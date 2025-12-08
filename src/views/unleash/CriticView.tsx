import React, { useState } from 'react';
import { Type } from "@google/genai";
import { callGeminiApi } from '../../utils/gemini';
import { blobToBase64 } from '../../utils/blobToBase64';
import CriticControls from '../../components/make-menu/CriticControls';
import CriticDashboard, { CriticResultType } from '../../components/make-menu/CriticDashboard';

const CriticView: React.FC = () => {
    // --- Critic State ---
    const [criticMenuText, setCriticMenuText] = useState('');
    const [criticMenuImage, setCriticMenuImage] = useState<File | null>(null);
    const [loadingCritic, setLoadingCritic] = useState(false);
    const [errorCritic, setErrorCritic] = useState<string | null>(null);
    const [criticResult, setCriticResult] = useState<CriticResultType | null>(null);

    // Configuration State
    const [criticPersona, setCriticPersona] = useState('Inspector Michelin');
    const [criticFocus, setCriticFocus] = useState<string[]>(['Coherencia']);

    // --- Critic Handlers ---
    const handleInvokeCritic = async () => {
        if (!criticMenuText.trim() && !criticMenuImage) return;
        setLoadingCritic(true);
        setErrorCritic(null);
        setCriticResult(null);

        const focusText = criticFocus.length > 0 ? ` Enfócate especialmente en: ${criticFocus.join(', ')}.` : '';
        const systemPrompt = `Actúa como un ${criticPersona}. Analiza el menú. ${focusText} Sé DIRECTO y BREVE. JSON estricto: puntosFuertes, debilidades, oportunidades (max 3 items cada uno), feedback (1 frase).`;

        const parts = [];
        if (criticMenuImage) {
            const base64Data = await blobToBase64(criticMenuImage);
            parts.push({ text: "Analiza la IMAGEN de este menú de cócteles. Si hay texto, analízalo. Si no, analiza el diseño, estilo y concepto." });
            parts.push({ inlineData: { mimeType: criticMenuImage.type, data: base64Data } });
        }
        if (criticMenuText.trim()) {
            parts.push({ text: `Analiza también (o en su lugar) este TEXTO de menú:\n\n${criticMenuText}` });
        }

        const userQueryPayload = { parts };
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    puntosFuertes: { type: Type.ARRAY, items: { type: Type.STRING } },
                    debilidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                    oportunidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                    feedback: { type: Type.STRING },
                },
            }
        };

        try {
            const response = await callGeminiApi(userQueryPayload, systemPrompt, generationConfig);
            if (!response.text) throw new Error("La IA no devolvió una crítica válida.");

            // Allow for markdown code block wrapping
            const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResult = JSON.parse(cleanText);

            setCriticResult(parsedResult);
        } catch (e: any) {
            console.error("Critic Error:", e);
            setErrorCritic(e.message || "Error al invocar al crítico");
        } finally {
            setLoadingCritic(false);
        }
    };

    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-[220px,minmax(0,1fr),220px] gap-6">
            {/* Left Sidebar - Configuration */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <div className="h-full rounded-2xl border border-amber-200/50 overflow-hidden bg-white/40 backdrop-blur-md shadow-sm flex flex-col">
                    <div className="p-4 border-b border-amber-100 bg-white/50">
                        <h3 className="font-bold text-amber-900 tracking-wide text-sm uppercase">Configuración</h3>
                    </div>

                    <div className="p-4 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                        {/* Persona Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">Perfil del Crítico</label>
                            <select
                                className="w-full bg-white/60 border border-amber-200 rounded-lg p-2 text-sm text-amber-900 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                                value={criticPersona}
                                onChange={(e) => setCriticPersona(e.target.value)}
                            >
                                <option value="Inspector Michelin">Inspector Michelin ⭐️</option>
                                <option value="Influencer Trendy">Influencer Trendy 📸</option>
                                <option value="Auditor Financiero">Auditor Financiero 💰</option>
                                <option value="Experto en Sostenibilidad">Experto Sostenibilidad 🌱</option>
                                <option value="Cliente Furioso">Cliente Furioso 😡</option>
                            </select>
                            <p className="text-[10px] text-amber-700/60 leading-tight">
                                Define la personalidad y severidad del análisis.
                            </p>
                        </div>

                        {/* Focus Toggles */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider">Foco Principal</label>
                            <div className="space-y-2">
                                {['Rentabilidad', 'Originalidad', 'Coherencia', 'Tendencias'].map(focus => (
                                    <label key={focus} className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="accent-amber-600 w-4 h-4 rounded border-amber-300"
                                            checked={criticFocus.includes(focus)}
                                            onChange={(e) => {
                                                if (e.target.checked) setCriticFocus([...criticFocus, focus]);
                                                else setCriticFocus(criticFocus.filter(f => f !== focus));
                                            }}
                                        />
                                        <span className="text-sm text-slate-600 group-hover:text-amber-700 transition-colors">{focus}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* History Placeholder (Visual Only) */}
                        <div className="mt-8 pt-4 border-t border-amber-100">
                            <label className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 block">Historial Reciente</label>
                            <div className="space-y-2 opacity-60">
                                <div className="text-xs text-slate-500 p-2 bg-white/40 rounded border border-transparent hover:border-amber-200 cursor-pointer">
                                    Análisis: Menú Verano
                                </div>
                                <div className="text-xs text-slate-500 p-2 bg-white/40 rounded border border-transparent hover:border-amber-200 cursor-pointer">
                                    Auditoría: Precios 2025
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content - Dashboard */}
            <div className="h-full min-h-0 overflow-hidden flex flex-col relative rounded-2xl z-20">
                <CriticDashboard
                    result={criticResult}
                    loading={loadingCritic}
                    error={errorCritic}
                />
            </div>

            {/* Right Sidebar - Controls */}
            <div className="h-full min-h-0 flex flex-col relative z-20">
                <CriticControls
                    criticMenuText={criticMenuText}
                    loading={loadingCritic}
                    onTextChange={setCriticMenuText}
                    onImageChange={setCriticMenuImage}
                    onInvoke={handleInvokeCritic}
                />
            </div>
        </div>
    );
};

export default CriticView;
