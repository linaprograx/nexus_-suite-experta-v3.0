/**
 * Service to interact with the local AI Gateway for text generation.
 * Replaces direct calls to Google Generative AI within the browser.
 */

const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL || 'http://localhost:3001';

// ── Circuit Breaker ──────────────────────────────────────────────
// Prevents flooding the console with errors when the gateway is down.
// After a connection failure, it stops trying for CIRCUIT_COOLDOWN_MS.
const CIRCUIT_COOLDOWN_MS = 60_000; // 1 minute
let circuitOpen = false;
let circuitOpenedAt = 0;

function isCircuitOpen(): boolean {
    if (!circuitOpen) return false;
    // Auto-reset after cooldown
    if (Date.now() - circuitOpenedAt > CIRCUIT_COOLDOWN_MS) {
        circuitOpen = false;
        console.info('[AI Gateway] Circuit breaker reset — will retry on next call.');
        return false;
    }
    return true;
}

function openCircuit(): void {
    if (!circuitOpen) {
        circuitOpen = true;
        circuitOpenedAt = Date.now();
        console.warn(
            `[AI Gateway] Unreachable at ${AI_GATEWAY_URL}. ` +
            `AI features will use fallbacks. ` +
            `Will retry automatically in ${CIRCUIT_COOLDOWN_MS / 1000}s or on page refresh.`
        );
    }
}

/** Manually reset the circuit breaker (e.g. after starting the gateway). */
export function resetGatewayCircuit(): void {
    circuitOpen = false;
    circuitOpenedAt = 0;
    console.info('[AI Gateway] Circuit breaker manually reset.');
}
// ─────────────────────────────────────────────────────────────────

interface TextResponse {
    text: string;
}

/**
 * Generates text via the secure AI Gateway.
 * Merges system instruction into the prompt since the basic gateway endpoint 
 * currently accepts a single 'prompt' string.
 * 
 * @param userPrompt The main user query or task
 * @param systemInstruction Optional system role/persona definition
 */
export const generateText = async (userPrompt: string, systemInstruction?: string): Promise<TextResponse> => {
    if (!userPrompt) throw new Error("Prompt is required");

    // Circuit breaker: fail fast when gateway is known to be down
    if (isCircuitOpen()) {
        throw new Error("AI Gateway is temporarily unavailable. Using fallback data.");
    }

    // Polyfill for System Instruction: Prepend to prompt if provided
    const finalPrompt = systemInstruction
        ? `${systemInstruction}\n\n----------------\n\n${userPrompt}`
        : userPrompt;

    // Retry Logic for robustness (Network/Gateway errors)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch(`${AI_GATEWAY_URL}/vertex/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt: finalPrompt }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                // Check for rate limits or temporary server issues
                if (response.status === 429 || response.status >= 500) {
                    // Throw to trigger retry loop
                    throw new Error(`Gateway Error (${response.status}): ${errorText}`);
                }

                // For client errors (400), don't retry
                throw new Error(`Gateway Error (${response.status}): ${errorText}`);
            }

            const data = await response.json();

            if (!data.text) {
                throw new Error("Invalid response from AI Gateway: Missing text data");
            }

            return { text: data.text };

        } catch (error: any) {
            attempts++;

            // Detect connection-level failures (gateway not running)
            const isConnectionError = error.message?.includes('Load failed') ||
                error.message?.includes('fetch') ||
                error.message?.includes('NetworkError') ||
                error.message?.includes('Failed to fetch');

            if (isConnectionError) {
                openCircuit();
                throw new Error("AI Gateway is temporarily unavailable. Using fallback data.");
            }

            const isRetryable = error.message.includes('429') || error.message.includes('50');

            if (isRetryable && attempts < maxAttempts) {
                console.warn(`Text Service Attempt ${attempts} failed. Retrying...`, error.message);
                // Exponential backoff: 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 500));
                continue;
            }

            console.error("Text Service Error:", error);
            throw new Error(error.message || "Failed to generate text via Gateway");
        }
    }

    throw new Error("Text Service failed after max retries");
};

/**
 * Generates text using Google Search Grounding via Gateway.
 */
export const generateWithSearch = async (userPrompt: string, systemInstruction?: string): Promise<TextResponse & { sources?: any[] }> => {
    const finalPrompt = systemInstruction ? `${systemInstruction}\n\n----------------\n\n${userPrompt}` : userPrompt;

    try {
        const response = await fetch(`${AI_GATEWAY_URL}/vertex/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: finalPrompt }),
        });

        if (!response.ok) throw new Error(`Gateway Error: ${response.statusText}`);
        return await response.json();
    } catch (error: any) {
        console.error("Search Service Error:", error);
        throw error;
    }
};

/**
 * Generates text from Multimodal inputs (Text + Images) via Gateway.
 */
export const generateMultimodal = async (parts: any[], systemInstruction?: string): Promise<TextResponse> => {
    // If systemInstruction exists, prepend it as a text part
    const finalParts = systemInstruction
        ? [{ text: systemInstruction }, ...parts]
        : parts;

    try {
        const response = await fetch(`${AI_GATEWAY_URL}/vertex/multimodal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parts: finalParts }),
        });

        if (!response.ok) throw new Error(`Gateway Error: ${response.statusText}`);
        return await response.json();
    } catch (error: any) {
        console.error("Multimodal Service Error:", error);
        throw error;
    }
};
