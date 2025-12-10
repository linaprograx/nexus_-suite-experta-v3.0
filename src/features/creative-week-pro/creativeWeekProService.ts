import { callGeminiApi } from '../../utils/gemini';
import { PizarronTask } from '../../types';

export interface CreativeWeekData {
    summary: string;
    insights: string[];
    recommendation: {
        title: string;
        description: string;
        impact: 'bajo' | 'medio' | 'alto';
        difficulty: 'baja' | 'media' | 'alta';
    };
    stats?: {
        totalTasks: number;
        tasksByDay: Record<string, number>;
        mostUsedCategory: string;
        creationPeaks: string;
        operationalRatio: string;
    };
}

const FALLBACK_DATA: CreativeWeekData = {
    summary: "No hay suficiente actividad creativa registrada esta semana.",
    insights: ["Completa tareas para generar insights útiles."],
    recommendation: {
        title: "Registrar actividad creativa",
        description: "Añade o completa tareas en el pizarrón para activar el análisis semanal.",
        impact: "bajo",
        difficulty: "baja"
    },
    stats: {
        totalTasks: 0,
        tasksByDay: {},
        mostUsedCategory: "N/A",
        creationPeaks: "N/A",
        operationalRatio: "0"
    }
};

/**
 * Traduce el texto al español si detecta que está en otro idioma.
 * Si ya está en español o es vacío, lo devuelve tal cual o traducido.
 */
async function ensureSpanish(text: string): Promise<string> {
    if (!text) return "";

    // Heurística simple: si contiene palabras comunes en inglés, traducimos.
    // O mejor, para ser robustos, hacemos una llamada rápida pidiendo traducción si es necesario.
    // Dado que el sistema pide explícitamente esta función y su uso:

    try {
        const prompt = `Translate the following text to Spanish. If it is already in Spanish, just return it exactly as is. Do not add any explanation or quotes. Text: "${text}"`;
        const response = await callGeminiApi(
            prompt,
            "Eres un traductor experto. Solo devuelves el texto traducido al español."
        );
        // Safely extract text from response
        const translated = response.text?.trim();
        return translated || text;
    } catch (e) {
        console.warn("Translation failed, using original text:", e);
        return text;
    }
}

// Helper for date comparison
const isWithinLastDays = (dateStr: string, days: number) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= days;
};

export const getCreativeWeekInsights = async (tasks: PizarronTask[], userName: string): Promise<CreativeWeekData> => {
    try {
        if (!tasks || tasks.length === 0) {
            return FALLBACK_DATA;
        }

        // Preprocess tasks (last 14 days)
        const recentTasks = tasks.filter(t => {
            const dateStr = t.createdAt?.toDate ? t.createdAt.toDate().toISOString() : (t.createdAt ? new Date(t.createdAt).toISOString() : null);
            return dateStr && isWithinLastDays(dateStr, 14);
        });

        if (recentTasks.length < 3) {
            return FALLBACK_DATA;
        }

        // Build Analysis Payload
        const tasksByDay = recentTasks.reduce((acc: any, task) => {
            const dateStr = task.createdAt?.toDate ? task.createdAt.toDate().toISOString() : (task.createdAt ? new Date(task.createdAt).toISOString() : null);
            if (dateStr) {
                const date = dateStr.split('T')[0];
                acc[date] = (acc[date] || 0) + 1;
            }
            return acc;
        }, {});

        const categories = recentTasks.map(t => t.category);
        const mostUsedCategories = categories.sort((a, b) =>
            categories.filter(v => v === a).length - categories.filter(v => v === b).length
        ).pop();

        // Calculate creation peaks (simple logic: day with most tasks)
        const sortedDays = Object.entries(tasksByDay).sort((a: any, b: any) => b[1] - a[1]);
        const creationPeaks = sortedDays.length > 0 ? sortedDays[0][0] : "N/A";

        const operationalCount = recentTasks.filter(t => ['Admin', 'Urgente'].includes(t.category)).length;
        const creativeCount = recentTasks.length - operationalCount;
        const operationalRatio = recentTasks.length > 0 ? (operationalCount / recentTasks.length).toFixed(2) : "0";

        const payload = {
            tasksByDay,
            mostUsedCategories,
            creationPeaks,
            operationalRatio,
            totalTasks: recentTasks.length,
            userName
        };

        const systemPrompt = `Eres un analista experto en creatividad, productividad y mixología aplicada al desarrollo de barra.
         Genera insights sobre la semana creativa del usuario, identifica patrones, desequilibrios y oportunidades,
         y ofrece recomendaciones accionables de alto impacto.
         
         IMPORTANTE:
         - Tu respuesta debe ser ESTRICTAMENTE un objeto JSON válido.
         - NO uses bloques de código markdown (\`\`\`json).
         - TODOS los textos deben estar en ESPAÑOL.
         
         El formato debe ser exactamente:
         {
          "summary": "Resumen ejecutivo de la semana en una frase",
          "insights": ["Insight 1", "Insight 2", "Insight 3"],
          "recommendation": {
            "title": "Título de la recomendación",
            "description": "Descripción detallada",
            "impact": "bajo" | "medio" | "alto",
            "difficulty": "baja" | "media" | "alta"
          }
        }`;

        const response = await callGeminiApi(
            JSON.stringify(payload),
            systemPrompt,
            { responseMimeType: "application/json" }
        );

        const text = response.text || "";
        let data: CreativeWeekData;
        try {
            // Clean potentially markdown wrapped response
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("Gemini parse error", e, text);
            return FALLBACK_DATA;
        }

        // Validations and translations
        if (!data || !data.summary) return FALLBACK_DATA;

        // Attach calculated stats to the response
        data.stats = {
            totalTasks: recentTasks.length,
            tasksByDay,
            mostUsedCategory: mostUsedCategories || 'N/A',
            creationPeaks,
            operationalRatio
        };

        // Force Spanish Translation
        data.summary = await ensureSpanish(data.summary);
        if (data.insights && Array.isArray(data.insights)) {
            data.insights = await Promise.all(data.insights.map(i => ensureSpanish(i)));
        }
        if (data.recommendation) {
            data.recommendation.title = await ensureSpanish(data.recommendation.title);
            data.recommendation.description = await ensureSpanish(data.recommendation.description);

            // Normalize enums
            const mapImpact = (val: string) => {
                const v = val?.toLowerCase() || '';
                if (v.includes('high') || v.includes('alto')) return 'alto';
                if (v.includes('medium') || v.includes('medio')) return 'medio';
                return 'bajo';
            }
            const mapDifficulty = (val: string) => {
                const v = val?.toLowerCase() || '';
                if (v.includes('high') || v.includes('alta')) return 'alta';
                if (v.includes('medium') || v.includes('media')) return 'media';
                return 'baja';
            }

            data.recommendation.impact = mapImpact(data.recommendation.impact as any) as any;
            data.recommendation.difficulty = mapDifficulty(data.recommendation.difficulty as any) as any;
        } else {
            data.recommendation = FALLBACK_DATA.recommendation;
        }

        return data;

    } catch (error) {
        console.error("Error getting Creative Week insights:", error);
        return FALLBACK_DATA;
    }
}
