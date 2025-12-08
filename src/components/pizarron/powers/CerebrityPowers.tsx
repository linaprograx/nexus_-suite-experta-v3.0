import React from 'react';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { ICONS } from '../../ui/icons';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";
import { Spinner } from '../../ui/Spinner';

interface CerebrityPowerResult {
    title: string;
    summary?: string;
    sections?: { heading: string; content: string }[];
    lists?: { heading: string; items: string[] }[];
    tables?: { heading: string; columns: string[]; rows: string[][] }[];
    // Compatibility fields
    simple?: string;
    advanced?: string;
    experto?: string;
}

interface CerebrityPowersProps {
    contextText: string;
    onApplyResult: (textToAppend: string) => void;
}

export const CerebrityPowers: React.FC<CerebrityPowersProps> = ({ contextText, onApplyResult }) => {
    const [loading, setLoading] = React.useState(false);
    const [activePower, setActivePower] = React.useState<string | null>(null);
    const [result, setResult] = React.useState<CerebrityPowerResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const allPowers = [
        { name: 'Intensidad Creativa', description: 'Analiza la creatividad.', icon: 'sparkles', color: 'purple' },
        { name: 'Coherencia Técnica', description: 'Detecta conflictos técnicos.', icon: 'lab', color: 'cyan' },
        { name: 'Optimización del Garnish', description: 'Sugiere garnishes.', icon: 'leaf', color: 'green' },
        { name: 'Mejora de Storytelling', description: 'Mejora la narrativa.', icon: 'book', color: 'purple' },
        { name: 'Creative Booster', description: 'Genera nuevas ideas.', icon: 'sparkles', color: 'purple' },
        { name: 'Analizador de Storytelling', description: 'Diagnóstico de narrativa.', icon: 'book', color: 'cyan' },
        { name: 'Identificador de Rarezas', description: 'Ingredientes inusuales.', icon: 'alert', color: 'orange' },
        { name: 'Mayor Armonía', description: 'Balance de sabores.', icon: 'wave', color: 'green' },
        { name: 'Mapeo de Sabores', description: 'Perfil aromático.', icon: 'map', color: 'orange' },
    ];

    const safeJsonParse = (raw: string): any => {
        try {
            return JSON.parse(raw);
        } catch {
            try {
                const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
                return JSON.parse(cleaned);
            } catch {
                return { summary: "Error al parsear la respuesta de IA." };
            }
        }
    };

    const getPowerPrompt = (powerName: string, context: string) => {
        const genericSchema = {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING },
                sections: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { heading: { type: Type.STRING }, content: { type: Type.STRING } }
                    }
                },
                lists: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { heading: { type: Type.STRING }, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
                    }
                },
                tables: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            heading: { type: Type.STRING },
                            columns: { type: Type.ARRAY, items: { type: Type.STRING } },
                            rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
                        }
                    }
                },
                simple: { type: Type.STRING },
                advanced: { type: Type.STRING },
                experto: { type: Type.STRING },
            }
        };

        switch (powerName) {
            case 'Intensidad Creativa':
                return {
                    prompt: `Analiza la creatividad de: "${context}". Devuelve un JSON con 'summary' y 'sections' detallando originalidad y ejecución.`,
                    systemInstruction: 'Eres un director creativo de coctelería.',
                    responseSchema: genericSchema
                };
            case 'Coherencia Técnica':
                return {
                    prompt: `Analiza: "${context}". Detecta errores técnicos. Devuelve 'summary' y 'lists' con problemas y soluciones.`,
                    systemInstruction: 'Eres un experto técnico en bar.',
                    responseSchema: genericSchema
                };
            case 'Optimización del Garnish':
                return {
                    prompt: `Para: "${context}", sugiere 3 garnishes. Devuelve JSON con campos 'simple', 'advanced', 'experto'.`,
                    systemInstruction: 'Experto en garnish.',
                    responseSchema: genericSchema
                };
            case 'Mejora de Storytelling':
                return {
                    prompt: `Mejora este texto: "${context}". Devuelve 'summary' y 'sections' con 3 variaciones de tono (Poético, Técnico, Misterioso).`,
                    systemInstruction: 'Copywriter experto en coctelería.',
                    responseSchema: genericSchema
                };
            case 'Creative Booster':
                return {
                    prompt: `Usa "${context}" como inspiración para 3 nuevas ideas locas. Devuelve 'tables' con columnas [Nombre, Concepto, Twist].`,
                    systemInstruction: 'Innovador radical de bebidas.',
                    responseSchema: genericSchema
                };
            case 'Analizador de Storytelling':
                return {
                    prompt: `Analiza el storytelling: "${context}". Devuelve 'lists' de fortalezas y debilidades.`,
                    systemInstruction: 'Editor literario de menús.',
                    responseSchema: genericSchema
                };
            case 'Identificador de Rarezas':
                return {
                    prompt: `Busca ingredientes raros en: "${context}". Devuelve 'tables' con [Ingrediente, Rareza, Explicación].`,
                    systemInstruction: 'Cazador de ingredientes exóticos.',
                    responseSchema: genericSchema
                };
            case 'Mayor Armonía':
                return {
                    prompt: `Analiza el balance de sabores de: "${context}". Sugiere ajustes 'lists' para mejorar la armonía.`,
                    systemInstruction: 'Experto en paladar y balance.',
                    responseSchema: genericSchema
                };
            case 'Mapeo de Sabores':
                return {
                    prompt: `Mapea los sabores de: "${context}". Devuelve 'tables' con [Familia, Ingrediente, Intensidad].`,
                    systemInstruction: 'Sommelier de cócteles.',
                    responseSchema: genericSchema
                };
            default:
                return null;
        }
    };

    const handleActivatePower = async (powerName: string) => {
        if (!contextText.trim()) {
            setError("Escribe algo en la tarea para analizar.");
            return;
        }
        setLoading(true);
        setActivePower(powerName);
        setResult(null);
        setError(null);

        try {
            const powerPrompt = getPowerPrompt(powerName, contextText);
            if (!powerPrompt) throw new Error("Poder no disponible.");

            const response = await callGeminiApi(
                powerPrompt.prompt,
                powerPrompt.systemInstruction || "Asistente experto.",
                { responseMimeType: "application/json", responseSchema: powerPrompt.responseSchema }
            );

            const data = safeJsonParse(response.text);
            setResult({ ...data, title: powerName });
        } catch (e: any) {
            setError(e.message || "Error al activar poder.");
        } finally {
            setLoading(false);
        }
    };

    const formatResultForEditor = (res: CerebrityPowerResult) => {
        let text = `\n\n--- ${res.title} ---\n`;
        if (res.summary) text += `${res.summary}\n`;
        if (res.simple) text += `\nSimple: ${res.simple}`;
        if (res.advanced) text += `\nAvanzado: ${res.advanced}`;
        if (res.experto) text += `\nExperto: ${res.experto}`;

        res.sections?.forEach(s => text += `\n### ${s.heading}\n${s.content}\n`);
        res.lists?.forEach(l => {
            text += `\n### ${l.heading}\n`;
            l.items.forEach(i => text += `- ${i}\n`);
        });
        res.tables?.forEach(t => {
            text += `\n### ${t.heading}\n`;
            text += `| ${t.columns.join(' | ')} |\n| ${t.columns.map(() => '---').join(' | ')} |\n`;
            t.rows.forEach(r => text += `| ${r.join(' | ')} |\n`);
        });
        return text;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allPowers.map(power => (
                    <button
                        key={power.name}
                        onClick={() => handleActivatePower(power.name)}
                        disabled={loading}
                        className={`p-2 rounded-lg border text-left transition-all hover:scale-[1.02] active:scale-95 flex flex-col gap-1
                            ${activePower === power.name ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300'}
                        `}
                    >
                        <div className={`p-1.5 rounded-md w-fit bg-${power.color}-100 dark:bg-${power.color}-900/30 text-${power.color}-600 dark:text-${power.color}-400`}>
                            <Icon svg={(ICONS as any)[power.icon] || ICONS.sparkles} className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{power.name}</span>
                    </button>
                ))}
            </div>

            {loading && (
                <div className="p-4 text-center text-slate-500 flex flex-col items-center gap-2 animate-pulse">
                    <Spinner />
                    <span className="text-xs">Invocando a la IA...</span>
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                    <Icon svg={ICONS.alert} className="w-4 h-4" />
                    {error}
                </div>
            )}

            {result && !loading && (
                <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-900/10 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-2">
                            <Icon svg={ICONS.sparkles} className="w-4 h-4" /> Resultado: {result.title}
                        </h4>
                        <Button size="sm" onClick={() => onApplyResult(formatResultForEditor(result))} className="bg-violet-600 hover:bg-violet-700 text-white">
                            Insertar
                        </Button>
                    </div>

                    <div className="text-sm text-slate-700 dark:text-slate-300 max-h-60 overflow-y-auto custom-scrollbar p-2 bg-white/50 dark:bg-black/20 rounded-lg">
                        {/* Simplified preview rendering */}
                        {result.summary && <p className="mb-2 italic">{result.summary}</p>}
                        {result.sections?.map((s, i) => (
                            <div key={i} className="mb-2">
                                <strong className="block text-xs uppercase tracking-wide opacity-70">{s.heading}</strong>
                                <p>{s.content}</p>
                            </div>
                        ))}
                        {result.simple && <p><strong>Simple:</strong> {result.simple}</p>}
                        {result.advanced && <p><strong>Avanzado:</strong> {result.advanced}</p>}
                        {result.experto && <p><strong>Experto:</strong> {result.experto}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};
