
import { GoogleGenAI, Modality } from "@google/genai";

interface ImageData {
    base64Data: string;
    mimeType: string;
}

// --- Image Generation ---
const generateImage = async (ai: GoogleGenAI, prompt: string): Promise<string> => {
    try {
        // Make the API call more explicit and stable by requesting a single JPEG.
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
            }
        });
        const generatedImage = response.generatedImages?.[0];
        if (!generatedImage?.image?.imageBytes) {
            throw new Error("Image generation failed or returned no data.");
        }
        
        const mimeType = generatedImage.image.mimeType || 'image/jpeg';
        return `data:${mimeType};base64,${generatedImage.image.imageBytes}`;
    } catch (error) {
        console.error("Error in generateImage:", error);
        throw new Error(`The Gemini API call failed during image generation. Please check your API key and permissions. Original error: ${error.message}`);
    }
};

// --- Image Editing ---
const editImage = async (ai: GoogleGenAI, prompt: string, images: ImageData[])
  : Promise<{ imageUrl: string; text: string | null }> => {
    try {
        const imageParts = images.map(image => ({
            inlineData: { data: image.base64Data, mimeType: image.mimeType },
        }));

        const textPart = { text: prompt };
        const parts = [textPart, ...imageParts]; // Put text prompt first for stability

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            // Use the more robust chat-style format for the contents payload.
            contents: [{ role: 'user', parts }],
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
    } catch (error) {
        console.error("Error in editImage:", error);
        throw new Error(`The Gemini API call failed during image editing. Please check your API key and permissions. Original error: ${error.message}`);
    }
};

// --- Request Handlers ---

async function handlePost(ai: GoogleGenAI, req: Request): Promise<Response> {
    const body = await req.json();
    const { action } = body;
    const headers = { 'Content-Type': 'application/json' };

    switch (action) {
        case 'generate': {
            const { prompt } = body;
            if (!prompt) return new Response(JSON.stringify({ error: 'Prompt is required' }), { status: 400, headers });
            const imageUrl = await generateImage(ai, prompt);
            return new Response(JSON.stringify({ imageUrl }), { status: 200, headers });
        }
        case 'edit': {
            const { prompt, images } = body;
            if (!prompt || !images) return new Response(JSON.stringify({ error: 'Prompt and images are required' }), { status: 400, headers });
            const result = await editImage(ai, prompt, images);
            return new Response(JSON.stringify(result), { status: 200, headers });
        }
        default:
            return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers });
    }
}

/**
 * Main request handler for the API proxy.
 */
export default async function handler(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };
    try {
        // Initialize the client inside the handler to catch any environment errors.
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            throw new Error(
                "The API_KEY environment variable is not set. Please configure it in your Cloud Run service using the 'Reference a secret' feature."
            );
        }
        const ai = new GoogleGenAI({ apiKey });

        if (req.method === 'POST') {
            return await handlePost(ai, req);
        } else {
            return new Response(JSON.stringify({ error: `Method ${req.method} not allowed` }), {
                status: 405,
                headers: { 'Allow': 'POST', ...headers },
            });
        }
    } catch (error) {
        console.error("[API PROXY ERROR]", error);
        const message = error instanceof Error ? error.message : "An unknown internal server error occurred.";
        return new Response(JSON.stringify({ error: message }), {
            status: 500, headers,
        });
    }
}