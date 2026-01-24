import { callGeminiApi } from '../../../utils/gemini';
import { cleanJSON } from '../../../utils/jsonCleaner';

export const powerTechCoherence = async (ingredients: string[]) => {
  const cleanIngredients = ingredients.filter(Boolean).join(', ');
  if (!cleanIngredients) {
    throw new Error("No ingredients provided for Tech Coherence analysis.");
  }

  const prompt = `Analiza la coherencia técnica de una receta con los siguientes ingredientes: "${cleanIngredients}". Identifica posibles conflictos, técnicas incompatibles y riesgos en la preparación. Devuelve un JSON con un título, un resumen, y dos secciones ('sections'): 'Fortalezas Técnicas' y 'Posibles Conflictos'.`;

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
            content: { type: "STRING" },
          },
          required: ["heading", "content"],
        },
      },
    },
    required: ["title", "summary", "sections"],
  };

  try {
    const result = await callGeminiApi(prompt, "Eres un director de I+D en un laboratorio de coctelería de vanguardia, experto en procesos y técnicas.", { responseMimeType: 'application/json', responseSchema: schema });
    const cleanedJson = cleanJSON(result.text);

    if (!cleanedJson.sections || cleanedJson.sections.length < 2) {
      throw new Error("La respuesta de la API no es válida.");
    }
    return cleanedJson;
  } catch (error) {
    console.error("Error en powerTechCoherence, usando fallback:", error);
    return {
      title: 'Análisis de Coherencia Técnica (Fallback)',
      summary: 'Evaluación de la viabilidad y sinergia técnica de la combinación de ingredientes.',
      sections: [
        {
          heading: 'Fortalezas Técnicas',
          content: 'La combinación de ingredientes es robusta y no presenta conflictos evidentes. Las técnicas de preparación estándar son adecuadas para lograr un resultado óptimo y consistente.',
        },
        {
          heading: 'Posibles Conflictos',
          content: 'No se han detectado conflictos técnicos significativos. Sin embargo, se recomienda prestar atención a la temperatura de servicio para mantener la integridad de los aromas más volátiles.',
        },
      ],
    };
  }
};
