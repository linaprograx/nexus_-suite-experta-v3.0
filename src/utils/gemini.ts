import { GoogleGenAI, Modality } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("API Key de Gemini no encontrada. Asegúrate de que VITE_GEMINI_API_KEY está en tu archivo .env");
}

export const callGeminiApi = async (userQuery: string | { parts: any[], role?: string }, systemPrompt: string, generationConfig: any = null) => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Retry Logic for 429 (Rate Limit)
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: typeof userQuery === 'string' ? [{ parts: [{ text: userQuery }] }] : userQuery,
                config: {
                    systemInstruction: systemPrompt,
                    ...(generationConfig && generationConfig)
                }
            });

            // Standardize return to prevent access errors in views
            const text = typeof response.text === 'function' ? response.text() : response.text;
            return { text: text || "" };

        } catch (error: any) {
            // Check for 429 (Quota Exceeded) or 503 (Server Overload)
            const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('Quota exceeded');

            if (isRateLimit && attempts < maxAttempts - 1) {
                console.warn(`Gemini 429 Rate Limit hit. Retrying in ${(attempts + 1) * 2}s...`);
                await new Promise(resolve => setTimeout(resolve, (attempts + 1) * 2000));
                attempts++;
                continue;
            }

            console.error("Error calling Gemini API:", error);
            throw new Error("Error en la llamada a la API de Gemini (Rate Limit o Red). Verifique la consola.");
        }
    }
    // Fallback if loop finishes without return (should stay in try/catch usually)
    throw new Error("Gemini API Failed after retries.");

};

export const generateImage = async (prompt: string) => {
    if (!prompt || prompt.trim() === "") {
        throw new Error("El prompt de la imagen estaba vacío. No se puede generar.");
    }

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    try {
        // ATTEMPT 1: Imagen 3.0 (Official Stable)
        const response = await ai.models.generateContent({
            model: 'imagen-3.0-generate-001',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });

        const base64Data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64Data) {
            throw new Error("Imagen 3 no devolvió datos válidos.");
        }
        return { predictions: [{ bytesBase64Encoded: base64Data }] };

    } catch (error: any) {
        console.warn("Imagen 3 API Failed. trying fallback...", error.message);
        throw error; // Re-throw to let ImageGenerator handle the fallback
    }
};

export const callGeminiApiWithSearch = async (userQuery: string, systemPrompt: string, generationConfig: any = null) => {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userQuery,
        config: {
            ...(generationConfig || {}),
            tools: [{ googleSearch: {} }],
            systemInstruction: systemPrompt,
        }
    });

    return {
        text: response.text,
        sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
};
