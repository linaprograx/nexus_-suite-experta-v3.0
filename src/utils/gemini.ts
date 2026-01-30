import { GoogleGenAI, Modality } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    console.error("API Key de Gemini no encontrada. Asegúrate de que VITE_GEMINI_API_KEY está en tu archivo .env");
}

/**
 * @deprecated Use src/services/ai/textService.ts (Gateway) instead.
 * Direct browser calls to Google Identity/Gemini are discouraged.
 */
export const callGeminiApi = async (userQuery: string | { parts: any[], role?: string }, systemPrompt: string, generationConfig: any = null) => {
    console.error("CRITICAL: Legacy callGeminiApi invoked. This function is disabled.");
    throw new Error("Legacy callGeminiApi is disabled. Please migrate to src/services/ai/textService.ts which uses the secure AI Gateway.");
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
