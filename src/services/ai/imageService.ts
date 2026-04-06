/**
 * Service to interact with the local AI Gateway for image generation.
 * This acts as a bridge between the frontend and the secure backend gateway.
 */

const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || 'http://localhost:3001';

// ── Circuit Breaker (shared pattern with textService) ────────────
// Re-uses the same gateway availability concept.
import { resetGatewayCircuit } from './textService';

const CIRCUIT_COOLDOWN_MS = 60_000;
let imgCircuitOpen = false;
let imgCircuitOpenedAt = 0;

function isImageCircuitOpen(): boolean {
    if (!imgCircuitOpen) return false;
    if (Date.now() - imgCircuitOpenedAt > CIRCUIT_COOLDOWN_MS) {
        imgCircuitOpen = false;
        return false;
    }
    return true;
}

function openImageCircuit(): void {
    if (!imgCircuitOpen) {
        imgCircuitOpen = true;
        imgCircuitOpenedAt = Date.now();
        console.warn(`[AI Gateway] Image service unreachable. Will retry in ${CIRCUIT_COOLDOWN_MS / 1000}s.`);
    }
}
// ─────────────────────────────────────────────────────────────────

interface ImageResponse {
    imageBase64: string;
    mimeType: string;
    model: string;
}

export const generateImage = async (prompt: string): Promise<string> => {
    if (!prompt) throw new Error("Prompt is required");

    // Circuit breaker: fail fast when gateway is known to be down
    if (isImageCircuitOpen()) {
        throw new Error("AI Gateway is temporarily unavailable for image generation.");
    }

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
        // Detect connection-level failures
        const isConnectionError = error.message?.includes('Load failed') ||
            error.message?.includes('fetch') ||
            error.message?.includes('NetworkError') ||
            error.message?.includes('Failed to fetch');

        if (isConnectionError) {
            openImageCircuit();
            throw new Error("AI Gateway is temporarily unavailable for image generation.");
        }

        if (!imgCircuitOpen) {
            console.error("AI Image Service Error:", error);
        }
        throw new Error(error.message || "Failed to generate image");
    }
};
