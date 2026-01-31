/**
 * Service to interact with the local AI Gateway for text generation.
 * Replaces direct calls to Google Generative AI within the browser.
 */

const AI_GATEWAY_URL = 'http://localhost:3001';

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
            const isRetryable = error.message.includes('429') || error.message.includes('50') || error.message.includes('fetch');

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
