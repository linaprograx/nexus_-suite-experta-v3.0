import { getAccessToken } from './auth.js';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
console.log("[Vertex DEBUG] GOOGLE_CLOUD_PROJECT_ID =", PROJECT_ID);
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

// Models
const TEXT_MODEL = process.env.GOOGLE_VERTEX_MODEL_TEXT || 'gemini-1.5-flash-001';
const IMAGE_MODEL = process.env.GOOGLE_VERTEX_MODEL_IMAGE || 'imagen-3.0-generate-001';

const API_ENDPOINT = `https://${LOCATION}-aiplatform.googleapis.com/v1`;

interface TextResponse {
    text: string;
}

interface ImageResponse {
    imageBase64: string;
    mimeType: string;
    model: string;
}

/**
 * Generates text using Gemini on Vertex AI.
 */
export const generateText = async (prompt: string): Promise<TextResponse> => {
    if (!PROJECT_ID) throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");

    const { token } = await getAccessToken();
    const url = `${API_ENDPOINT}/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${TEXT_MODEL}:generateContent`;

    const payload = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }],
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.95,
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Text API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;

    // Parse Gemini Response
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No text content in Gemini response");

    return { text };
};

/**
 * Generates image using Imagen 3 on Vertex AI.
 */
export const generateImage = async (prompt: string): Promise<ImageResponse> => {
    if (!PROJECT_ID) throw new Error("GOOGLE_CLOUD_PROJECT_ID not set");

    const { token } = await getAccessToken();
    const url = `${API_ENDPOINT}/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${IMAGE_MODEL}:predict`;

    // Imagen 3 Payload Structure
    const payload = {
        instances: [
            { prompt: prompt }
        ],
        parameters: {
            sampleCount: 1,
            aspectRatio: "1:1" // Default square
        }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI Image API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json() as any;

    // Parse Imagen Response
    // Expecting: { predictions: [ { bytesBase64Encoded: "..." } ] }
    const base64 = data.predictions?.[0]?.bytesBase64Encoded;

    if (!base64) {
        // Fallback check for different versions/formats
        console.error("Unexpected Imagen Response:", JSON.stringify(data).substring(0, 200));
        throw new Error("No image data in Vertex response");
    }

    return {
        imageBase64: base64,
        mimeType: "image/png",
        model: IMAGE_MODEL
    };
};
