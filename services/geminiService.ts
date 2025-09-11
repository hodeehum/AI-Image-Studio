interface ImageData {
    base64Data: string;
    mimeType: string;
}

const API_ENDPOINT = '/api/gemini';

/**
 * Handles the response from the backend API proxy.
 * @param response The fetch Response object.
 * @returns The JSON response data.
 * @throws An error if the response is not ok.
 */
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && errorData.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            // Response was not JSON or there was another parsing error.
            // The initial errorMessage is the best we can do.
        }
        throw new Error(errorMessage);
    }
    if (response.headers.get('Content-Type')?.includes('application/json')) {
        return response.json();
    }
    return response;
};

/**
 * Calls the backend proxy to generate an image from a text prompt.
 * @param prompt The text prompt to generate the image from.
 * @returns A data URL string of the generated PNG image.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', prompt }),
    });
    const data = await handleApiResponse(response);
    if (!data.imageUrl) {
        throw new Error("Backend API did not return an image URL.");
    }
    return data.imageUrl;
};

/**
 * Calls the backend proxy to edit an image based on a text prompt.
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
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', prompt, images, aspectRatio }),
    });
    const data = await handleApiResponse(response);
     if (!data.imageUrl) {
        throw new Error("Backend API did not return an image.");
    }
    return data;
};