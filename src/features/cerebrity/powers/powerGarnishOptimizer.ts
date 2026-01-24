import { callGeminiApi } from '../../../utils/gemini';
import { cleanJSON } from '../../../utils/jsonCleaner';

export const powerGarnishOptimizer = async (ingredients: string[]) => {
  const cleanIngredients = ingredients.filter(Boolean).join(', ');
  if (!cleanIngredients) throw new Error("No ingredients provided.");

  const prompt = `
Eres un director creativo de coctelería contemporánea.

Basado en: "${cleanIngredients}"
genera EXACTAMENTE 3 propuestas de garnish: Simple, Avanzado, Experto.

Formato obligatorio:
{
  "title": "...",
  "summary": "...",
  "sections": [
    { "heading": "Simple", "content": "Texto..." },
    { "heading": "Avanzado", "content": "Texto..." },
    { "heading": "Experto", "content": "Texto..." }
  ]
}

Reglas:
- Cada propuesta entre 70 y 110 palabras.
- Nada excesivamente largo.
- No loops, no repeticiones.
- El de nivel "Experto" debe ser creativo y conceptual.
- Produce SOLO JSON, sin markdown.
`;

  const schema = {
    type: "OBJECT",
    properties: {
      title: { type: "STRING" },
      summary: { type: "STRING" },
      sections: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            heading: { type: "STRING" },
            content: { type: "STRING" }
          },
          required: ["heading", "content"]
        }
      }
    },
    required: ["title", "summary", "sections"]
  };

  try {
    const result = await callGeminiApi(
      prompt,
      "",
      { responseMimeType: "application/json", responseSchema: schema }
    );

    const cleaned = cleanJSON(result.text);

    if (
      !cleaned.sections ||
      cleaned.sections.length !== 3 ||
      !cleaned.sections.every((s: any) =>
        typeof s.heading === 'string' &&
        typeof s.content === 'string' &&
        s.content.length > 30
      )
    ) {
      throw new Error("Respuesta incompleta.");
    }

    return cleaned;

  } catch (err) {
    console.error("Error en powerGarnishOptimizer:", err);

    return {
      title: "Optimización de Garnish (Fallback)",
      summary: "Opciones refinadas para elevar tu cóctel.",
      sections: [
        { heading: "Simple", content: "Un twist fresco de cítrico ejecutado a la perfección para realzar el aroma y el color del cóctel." },
        { heading: "Avanzado", content: "Un garnish con textura: una lámina deshidratada aromática para aportar complejidad visual y gustativa." },
        { heading: "Experto", content: "Un garnish multisensorial con elementos interactivos para crear una experiencia inolvidable." }
      ]
    };
  }
};