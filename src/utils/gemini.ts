import { GoogleGenAI, Modality } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("API Key de Gemini no encontrada. Asegúrate de que VITE_GEMINI_API_KEY está en tu archivo .env");
}

export const callGeminiApi = async (userQuery: string | { parts: any[], role?: string }, systemPrompt: string, generationConfig: any = null) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: typeof userQuery === 'string' ? [{ parts: [{ text: userQuery }] }] : userQuery,
          config: { 
              systemInstruction: systemPrompt,
              ...(generationConfig && generationConfig)
          }
      });
      return response;
  } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw new Error("Error en la llamada a la API de Gemini. Verifique la consola para más detalles.");
  }
};

export const generateImage = async (prompt: string) => {
    if (!prompt || prompt.trim() === "") {
        throw new Error("El prompt de la imagen estaba vacío. No se puede generar.");
    }
    
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    try {
        // FIX: Se asegura que la llamada a la API se asigna a una constante 'response'.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { responseModalities: [Modality.IMAGE] },
        });
        
        // FIX: Se define 'base64Data' a partir de la 'response' obtenida.
        const base64Data = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!base64Data) {
            throw new Error("La respuesta de la API de Imagen (flash) no contenía datos de imagen válidos.");
        }
        return { predictions: [{ bytesBase64Encoded: base64Data }] };
    } catch (error) {
        console.error("Error en la API de Imagen (flash):", error);
        throw new Error("La llamada a la API de imagen falló. Revisa la consola.");
    }
};

export const callGeminiApiWithSearch = async (userQuery: string, systemPrompt: string, generationConfig: any = null) => {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        ...(generationConfig || {}),
        tools: [{googleSearch: {}}],
        systemInstruction: systemPrompt,
      }
  });
  
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
