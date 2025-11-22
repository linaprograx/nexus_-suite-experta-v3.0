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
You are a hybrid expert in mixology R&D, bar operations, and AI-driven productivity. 
Your job is to determine the Next Best Action the user must take TODAY. 
You must combine business strategy, bar production logic, creativity, menu development, and operational efficiency.

Rules:
- Deliver ONE clear action.
- It must be achievable today (micro-step), but aligned with a bigger vision (macro).
- Consider urgency, creative momentum, FENÓMENO’s bar concept, ingredient usage, and current production flow.
- IMPORTANT: If data is unclear, incomplete, or ambiguous, you MUST infer and still produce a high-quality recommendation.
- NEVER return empty text or say you cannot analyze. Infer and generate.
- ALWAYS follow the JSON output format exactly.
`;

  const userQuery = `
Analyze the structured context below and determine the single Next Best Action. 
Explain the reason clearly in <50 words.  
Return only JSON.

Context Data:
${JSON.stringify(processedData, null, 2)}

Required JSON Format:
{
  "action": "string",
  "reason": "string",
  "impact": "low | medium | high",
  "time": number
}
`;

  try {
    const result = await callGeminiApi(userQuery, systemPrompt);
    
    // Limpieza básica de la respuesta para extraer JSON si viene con markdown
    const cleanText = result.text.replace(/```json\n?|\n?```/g, '').trim();
    
    let parsedData: any;
    try {
      parsedData = JSON.parse(cleanText);
    } catch (e) {
      console.warn('NBA: JSON parsing failed, triggering fallback.', e);
      return FALLBACK_ACTION;
    }

    // Validación estructural básica
    if (
      typeof parsedData.action === 'string' &&
      typeof parsedData.reason === 'string' &&
      ['low', 'medium', 'high'].includes(parsedData.impact) &&
      typeof parsedData.time === 'number'
    ) {
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
