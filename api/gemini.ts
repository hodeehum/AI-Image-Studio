import { GoogleGenAI, Modality } from "@google/genai";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

let ai: GoogleGenAI;
const secretManager = new SecretManagerServiceClient();

/**
 * Retrieves the API key from Google Cloud Secret Manager.
 * Caches the key after the first retrieval.
 */
async function getApiKey(): Promise<string> {
  const secretName = process.env.API_KEY_SECRET_NAME;
  if (!secretName) {
    throw new Error(
      "The API_KEY_SECRET_NAME environment variable is not set. Please configure it in your deployment environment."
    );
  }

  try {
    const [version] = await secretManager.accessSecretVersion({ name: secretName });
    const apiKey = version.payload?.data?.toString();
    if (!apiKey) {
      throw new Error("Could not retrieve a valid API key from Secret Manager.");
    }
    return apiKey;
  } catch (err) {
    console.error("Failed to access secret from Secret Manager:", err);
    throw new Error("Failed to access API key from Secret Manager.");
  }
}

/**
 * Ensures the GoogleGenAI client is initialized.
 * This function uses lazy initialization to create the client only when it's first needed.
 */
async function ensureAiClientInitialized() {
  if (!ai) {
    const apiKey = await getApiKey();
    ai = new GoogleGenAI({ apiKey });
  }
}

interface ImageData {
    base64Data: string;
    mimeType: string;
}

// --- Image Generation ---
const generateImage = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    const generatedImage = response.generatedImages?.[0];
    if (!generatedImage?.image?.imageBytes) {
        throw new Error("Image generation failed or returned no data.");
    }
    return `data:image/png;base64,${generatedImage.image.imageBytes}`;
};

// --- Image Editing ---
const editImage = async (prompt: string, images: ImageData[], aspectRatio: '1:1' | '16:9' | '9:16')
  : Promise<{ imageUrl: string; text: string | null }> => {
    const imageParts = images.map(image => ({
        inlineData: { data: image.base64Data, mimeType: image.mimeType },
    }));
    let fullPrompt = prompt;
    if (aspectRatio !== '1:1') {
        fullPrompt += `\n\nEnsure the output image has a ${aspectRatio} aspect ratio.`;
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: { parts: [...imageParts, { text: fullPrompt }] },
        config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
    });
    const candidate = response.candidates?.[0];
    if (!candidate?.content?.parts) throw new Error("Invalid response from API.");
    let imageUrl: string | null = null, text: string | null = null;
    for (const part of candidate.content.parts) {
        if (part.inlineData) imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        else if (part.text) text = (text ? `${text}\n` : "") + part.text;
    }
    if (!imageUrl) throw new Error("API did not return an image.");
    return { imageUrl, text };
};

// --- Request Handlers ---

async function handlePost(req: Request): Promise<Response> {
    const body = await req.json();
    const { action } = body;

    switch (action) {
        case 'generate': {
            const { prompt } = body;
            if (!prompt) return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400 });
            const imageUrl = await generateImage(prompt);
            return new Response(JSON.stringify({ imageUrl }), { status: 200 });
        }
        case 'edit': {
            const { prompt, images, aspectRatio } = body;
            if (!prompt || !images || !aspectRatio) return new Response(JSON.stringify({ error: 'Prompt, images, and aspectRatio are required' }), { status: 400 });
            const result = await editImage(prompt, images, aspectRatio);
            return new Response(JSON.stringify(result), { status: 200 });
        }
        default:
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    }
}

/**
 * Main request handler for the API proxy.
 */
export default async function handler(req: Request): Promise<Response> {
    try {
        // Initialize the Gemini AI client before handling any request.
        await ensureAiClientInitialized();

        if (req.method === 'POST') {
            return await handlePost(req);
        } else {
            return new Response(JSON.stringify({ error: `Method ${req.method} not allowed` }), {
                status: 405,
                headers: { 'Allow': 'POST', 'Content-Type': 'application/json' },
            });
        }
    } catch (error) {
        console.error("[API PROXY ERROR]", error);
        const message = error instanceof Error ? error.message : "An unknown internal server error occurred.";
        return new Response(JSON.stringify({ error: message }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }
}