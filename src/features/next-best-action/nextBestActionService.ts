import { Recipe, PizarronTask } from '../../../types';
import { callGeminiApi } from '../../utils/gemini';

export interface NextBestActionData {
  action: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  time: number;
}

// Fallback constante y obligatorio
const FALLBACK_ACTION: NextBestActionData = {
  action: "Revisar tus tareas del día",
  reason: "No se pudo generar un análisis estable. Usando reglas internas de prioridad.",
  impact: "medium",
  time: 10
};

function isValidNBA(data: any) {
  return (
    data &&
    typeof data.action === 'string' &&
    typeof data.reason === 'string' &&
    ['low','medium','high'].includes(data.impact) &&
    typeof data.time === 'number'
  );
}

interface PreprocessedData {
  userName: string;
  recipes: { title: string; category: string; status: string; difficulty: string }[];
  tasks: { content: string; category: string; status: string; urgency: string; progress: number }[];
  creativeSummary: {
    totalTasks: number;
    dailyAverage: number;
    bestDay: string;
  };
}

function preprocessData(
  recipes: Recipe[],
  tasks: PizarronTask[],
  creativeSummary: any,
  userName: string
): PreprocessedData {
  return {
    userName,
    recipes: recipes.slice(-10).map(r => ({
      title: r.nombre || 'Sin título',
      category: r.categorias?.[0] || 'General',
      status: 'active', // Recipe type doesn't have status
      difficulty: 'medium' // Recipe type doesn't have difficulty
    })),
    tasks: tasks.slice(-15).map(t => ({
      content: t.texto,
      category: t.category,
      status: t.status,
      urgency: t.priority || 'normal',
      progress: 0 // PizarronTask podría no tener progress explícito, asumimos 0 o derivamos si existe
    })),
    creativeSummary: {
      totalTasks: creativeSummary?.totalTasks || 0,
      dailyAverage: creativeSummary?.dailyAverage || 0,
      bestDay: creativeSummary?.bestDay || 'N/A'
    }
  };
}

export async function getNextBestAction(
  recipes: Recipe[],
  tasks: PizarronTask[],
  creativeSummary: any,
  userName: string
): Promise<NextBestActionData> {

  const processedData = preprocessData(recipes, tasks, creativeSummary, userName);

  const systemPrompt = `
Eres un experto híbrido en I+D de mixología, operaciones de bar y productividad impulsada por IA.
Tu trabajo es determinar la Próxima Mejor Acción (Next Best Action) que el usuario debe tomar HOY.
Debes combinar estrategia de negocio, lógica de producción de bar, creatividad, desarrollo de menús y eficiencia operativa.

Reglas:
- Entrega UNA sola acción clara.
- Debe ser realizable hoy (micro-paso), pero alineada con una visión más grande (macro).
- Considera la urgencia, el impulso creativo, el concepto del bar FENÓMENO, el uso de ingredientes y el flujo de producción actual.
- IMPORTANTE: Si los datos son poco claros, incompletos o ambiguos, DEBES inferir y aun así producir una recomendación de alta calidad.
- NUNCA devuelvas texto vacío ni digas que no puedes analizar. Infiere y genera.
- SIEMPRE responde en español. Si detectas texto, categorías o datos en inglés, TÚ debes traducirlo automáticamente al español.
- Mantén un tono profesional, claro, directo y estilo "Nexus Suite". Usa "tú", no "usted".
- La variable "reason" debe redactarse en español fluido y tener menos de 40 palabras.
- SIEMPRE sigue exactamente el formato de salida JSON.
`;

  const userQuery = `
Analiza el contexto estructurado a continuación y determina la única Próxima Mejor Acción.
Explica la razón claramente en menos de 40 palabras en español fluido.
Devuelve solo JSON.

Datos de Contexto:
${JSON.stringify(processedData, null, 2)}

Formato JSON Requerido:
{
  "action": "string",
  "reason": "string",
  "impact": "low | medium | high",
  "time": number
}
`;

  try {
    const result = await callGeminiApi(userQuery, systemPrompt);
    
    // Limpieza mejorada de JSON
    const cleanText = result.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      console.warn('NBA: JSON parsing failed, triggering fallback.', e);
      return FALLBACK_ACTION;
    }

    // Validación estricta usando helper
    if (isValidNBA(parsedData)) {
      return parsedData as NextBestActionData;
    } else {
      console.warn('NBA: Invalid JSON structure, triggering fallback.');
      return FALLBACK_ACTION;
    }

  } catch (error) {
    console.error('NBA Service Error:', error);
    return FALLBACK_ACTION;
  }
}
