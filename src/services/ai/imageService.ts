/**
 * Service to interact with the local AI Gateway for image generation.
 * This acts as a bridge between the frontend and the secure backend gateway.
 */

const AI_GATEWAY_URL = 'http://localhost:3001';

interface ImageResponse {
    imageBase64: string;
    mimeType: string;
    model: string;
}

export const generateImage = async (prompt: string): Promise<string> => {
    if (!prompt) throw new Error("Prompt is required");

    try {
        const response = await fetch(`${AI_GATEWAY_URL}/vertex/image`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.error || `Gateway Error: ${response.status}`);
            } catch {
                throw new Error(`Gateway Error (${response.status}): ${errorText}`);
            }
        }

        const data: ImageResponse = await response.json();

        // Validate response structure
        if (!data.imageBase64) {
            throw new Error("Invalid response from AI Gateway: Missing image data");
        }

        // Return formatted data URL ready for <img src="..." />
        return `data:${data.mimeType || 'image/png'};base64,${data.imageBase64}`;

    } catch (error: any) {
        console.error("AI Service Error:", error);
        throw new Error(error.message || "Failed to generate image");
    }
};
