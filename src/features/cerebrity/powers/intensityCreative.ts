import { callGeminiApi } from '../../../utils/gemini';
import { cleanJSON } from '../../../utils/jsonCleaner';

export const powerIntensityCreative = async (ingredients: string[]) => {
  const cleanIngredients = ingredients.filter(Boolean).join(', ');
  if (!cleanIngredients) {
    throw new Error("No ingredients provided for Intensity Creative analysis.");
  }

  const prompt = `Analiza la creatividad de una receta basada en los siguientes ingredientes: "${cleanIngredients}". Evalúa la originalidad, sinergia y audacia de la combinación. Devuelve un JSON con un título, un resumen, y una sección ('sections') que contenga un heading 'Análisis de Intensidad Creativa' y un 'content' con tu evaluación detallada y una puntuación final de 0 a 100.`;

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
    const result = await callGeminiApi(prompt, "Eres un jurado de concursos de coctelería de élite, conocido por tu agudo ojo para la innovación.", { responseMimeType: 'application/json', responseSchema: schema });
    const cleanedJson = cleanJSON(result.text);

    if (!cleanedJson.sections || cleanedJson.sections.length === 0) {
      throw new Error("La respuesta de la API no es válida.");
    }
    return cleanedJson;
  } catch (error) {
    console.error("Error en powerIntensityCreative, usando fallback:", error);
    return {
      title: 'Análisis de Intensidad Creativa (Fallback)',
      summary: 'Evaluación de la originalidad y audacia de la combinación de ingredientes.',
      sections: [
        {
          heading: 'Análisis de Intensidad Creativa',
          content: 'La combinación presenta un equilibrio interesante entre lo clásico y lo inesperado. Aunque algunos ingredientes son comunes, su interacción sugiere un potencial creativo notable. Puntuación: 75/100.',
        },
      ],
    };
  }
};
