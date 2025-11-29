import { callGeminiApi } from '../../../utils/gemini';
import { cleanJSON } from '../../../utils/jsonCleaner';

export const powerStorytellingImprover = async (baseText: string, theme?: string) => {
  if (!baseText || !baseText.trim()) {
    throw new Error("No base text provided for Storytelling Improvement.");
  }

  const themeInstruction = theme 
    ? `Incorpora sutilmente la temática: "${theme}".` 
    : '';

  const prompt = `
Eres un copywriter galardonado especializado en marcas de lujo.

A partir del siguiente texto: "${baseText}", ${themeInstruction}
genera un storytelling refinado.

⚠️ PRODUCE EXCLUSIVAMENTE UN JSON PURO con:
{
  "title": "...",
  "summary": "...",
  "lists": [
    { "heading": "Variación 1", "items": ["Texto 1"] },
    { "heading": "Variación 2", "items": ["Texto 2"] },
    { "heading": "Versión Premium", "items": ["Texto 3"] }
  ]
}

Reglas:
- EXACTAMENTE 3 variaciones.
- Cada variación entre 110 y 140 palabras.
- Nada de loops, nada de relleno, nada de repetir frases.
- Tono emocional, elegante, premium.
- NO incluyas comentarios, explicaciones ni markdown.
SOLO JSON.
`;

  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      summary: { type: "STRING" },
      lists: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            heading: { type: "STRING" },
            items: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["heading", "items"],
        },
      },
    },
    required: ["title", "summary", "lists"],
  };

  try {
    const result = await callGeminiApi(
      prompt,
      "",
      { responseMimeType: 'application/json', responseSchema: schema }
    );

    const cleaned = cleanJSON(result.text);

    // Validación estricta
    if (
      !cleaned.lists ||
      cleaned.lists.length !== 3 ||
      !cleaned.lists.every((l: any) =>
        typeof l.heading === 'string' &&
        Array.isArray(l.items) &&
        typeof l.items[0] === 'string' &&
        l.items[0].length > 50
      )
    ) {
      throw new Error("Respuesta incompleta.");
    }

    return cleaned;

  } catch (err) {
    console.error("Error en powerStorytellingImprover:", err);

    return {
      title: "Mejora de Storytelling (Fallback)",
      summary: "Tres perspectivas refinadas y emocionales.",
      lists: [
        { heading: "Variación 1", items: ["Una narrativa clara, emotiva y equilibrada que realza el carácter del cóctel sin saturar la experiencia sensorial."] },
        { heading: "Variación 2", items: ["Una lectura fluida y sugestiva que envuelve al lector en una atmósfera elegante y evocadora."] },
        { heading: "Versión Premium", items: ["Una pieza literaria depurada y sofisticada, diseñada para elevar la identidad del cóctel y resonar profundamente en su audiencia."] }
      ]
    };
  }
};