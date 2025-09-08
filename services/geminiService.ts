import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates an image from a text prompt using the imagen model.
 * @param prompt The text prompt to generate the image from.
 * @returns A data URL string of the generated PNG image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        const generatedImage = response.generatedImages?.[0];
        if (!generatedImage || !generatedImage.image || !generatedImage.image.imageBytes) {
            throw new Error("Image generation failed or returned no data.");
        }

        const base64ImageBytes = generatedImage.image.imageBytes;
        return `data:image/png;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image. Please check the prompt and API key.");
    }
};

interface ImageData {
    base64Data: string;
    mimeType: string;
}

/**
 * Edits an image based on a text prompt using the gemini-2.5-flash-image-preview model.
 * @param prompt The text prompt describing the edit.
 * @param images An array of original images, each with base64 data and a MIME type.
 * @param aspectRatio The desired aspect ratio for the output image.
 * @returns An object containing the data URL of the edited image and any accompanying text.
 */
export const editImage = async (
  prompt: string,
  images: ImageData[],
  aspectRatio: '1:1' | '16:9' | '9:16'
): Promise<{ imageUrl: string; text: string | null }> => {
    try {
        const imageParts = images.map(image => ({
            inlineData: {
                data: image.base64Data,
                mimeType: image.mimeType,
            },
        }));

        let fullPrompt = prompt;
        if (aspectRatio === '16:9') {
            fullPrompt += '\n\nEnsure the output image has a 16:9 aspect ratio.';
        } else if (aspectRatio === '9:16') {
            fullPrompt += '\n\nEnsure the output image has a 9:16 aspect ratio.';
        }

        const textPart = { text: fullPrompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [...imageParts, textPart],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });
        
        const candidate = response.candidates?.[0];
        if (!candidate || !candidate.content || !candidate.content.parts) {
            throw new Error("Invalid response from API. No content parts found.");
        }
        
        let imageUrl: string | null = null;
        let text: string | null = null;

        for (const part of candidate.content.parts) {
            if (part.inlineData) {
                const { data, mimeType: responseMimeType } = part.inlineData;
                imageUrl = `data:${responseMimeType};base64,${data}`;
            } else if (part.text) {
                text = (text ? text + "\n" : "") + part.text;
            }
        }

        if (!imageUrl) {
            throw new Error("API did not return an image. It might have refused the request. Please try a different prompt or image.");
        }

        return { imageUrl, text };
    } catch (error) {
        console.error("Error editing image:", error);
        throw new Error("Failed to edit image. The model may have safety concerns with the request.");
    }
};