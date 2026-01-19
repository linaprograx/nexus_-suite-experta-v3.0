import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';

import { useCerebrityOrchestrator } from '../../../hooks/useCerebrityOrchestrator';
import { callGeminiApi } from '../../../utils/gemini';
import { Type } from "@google/genai";
import { safeParseJson } from '../../../utils/json';
import { CerebrityResponseModal } from '../components/CerebrityResponseModal';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityCritic: React.FC<Props> = ({ onNavigate }) => {
    const { state, actions } = useCerebrityOrchestrator();
    const [menuText, setMenuText] = useState('');
    const [selectedFocus, setSelectedFocus] = useState<string[]>(['Coherencia']);
    const [criticResult, setCriticResult] = useState<any | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ isOpen: boolean, title: string, message: string, type?: 'success' | 'error' | 'info' | 'ai' } | null>(null);
    const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

    const toggleFocus = (focus: string) => {
        setSelectedFocus(prev => prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]);
    };

    const handleInviteCritic = async (specialMode?: 'allergens' | 'design' | 'prices' | 'text') => {
        if (!menuText.trim()) {
            setAlertConfig({
                isOpen: true,
                title: 'Entrada Vacía',
                message: 'Por favor, introduce el texto del menú o una descripción del cocktail para que el crítico pueda evaluarlo.',
                type: 'info'
            });
            return;
        }

        const activePersona = actions.getCriticPersona();
        let systemPrompt = `Actúa como un ${activePersona}. `;

        if (specialMode === 'allergens') {
            systemPrompt += `FOCO EXCLUSIVO EN SEGURIDAD ALIMENTARIA Y ALÉRGENOS. Detecta posibles alérgenos no declarados o riesgos técnicos.`;
        } else if (specialMode === 'design') {
            systemPrompt += `FOCO EXCLUSIVO EN DISEÑO Y ESTÉTICA. Analiza la presentación visual sugerida, nombres y equilibrio del menú.`;
        } else if (specialMode === 'prices') {
            systemPrompt += `FOCO EXCLUSIVO EN RENTABILIDAD Y PRECIOS. Analiza si los nombres e ingredientes justifican un precio premium.`;
        } else if (specialMode === 'text') {
            systemPrompt += `FOCO EXCLUSIVO EN REDACCIÓN Y ORTOGRAFÍA. Corrige textos y mejora el tono persuasivo.`;
        } else {
            systemPrompt += `Foco principal: ${selectedFocus.join(', ')}. `;
        }

        systemPrompt += `JSON estricto: puntosFuertes, debilidades, oportunidades (max 3 items cada uno), feedback (1 frase), score (0-10).`;

        try {
            const response = await callGeminiApi(
                `Analiza este menú:\n\n${menuText}`,
                systemPrompt,
                {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            puntosFuertes: { type: Type.ARRAY, items: { type: Type.STRING } },
                            debilidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                            oportunidades: { type: Type.ARRAY, items: { type: Type.STRING } },
                            feedback: { type: Type.STRING },
                            score: { type: Type.NUMBER }
                        },
                    }
                }
            );

            const result = safeParseJson(response.text);
            if (result) {
                setCriticResult(result);
            } else {
                throw new Error("La IA no devolvió un formato válido.");
            }
        } catch (e) {
            console.error("Critic Error:", e);
            setAlertConfig({
                isOpen: true,
                title: 'Error de Invocación',
                message: 'El crítico está ocupado o ha tenido un error al analizar tu menú. Intenta de nuevo en unos momentos.',
                type: 'error'
            });
        } finally {
            setIsGeneratingLocally(false);
        }
    };

    // 🧠 Hard Logic: Critic Persona & Severity
    const activePersona = actions.getCriticPersona();
    const severity = actions.getCriticSeverity();

    // Mock critique logs
    const critiques = [
        {
            recipe: 'Mojito Classic',
            score: 8.5,
            feedback: 'Excellent balance, consider premium rum upgrade',
            date: '2h ago',
            severity: 'minor'
        },
        {
            recipe: 'Negroni Variant',
            score: 6.2,
            feedback: 'Ratio needs adjustment. Sweetness overpowers bitter notes',
            date: '5h ago',
            severity: 'major'
        },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header Removed (Hoisted to Layout) */}

            <div className="px-5 mb-2 mt-2">
                <GlassCard rounded="2xl" padding="sm" className="bg-white/10 dark:!bg-white/5 border-white/20 dark:!border-white/10 mb-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Severidad del Algoritmo</p>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">{(severity * 100).toFixed(0)}%</span>
                            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-400"
                                    style={{ width: `${severity * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="px-5 mb-2">
                {/* Focus Checklist (Desktop Parity) */}
                <GlassCard rounded="2xl" padding="sm" className="bg-white/10 dark:!bg-white/5 border-white/20 dark:!border-white/10">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Foco Principal</p>
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-tighter">Avatar: {activePersona}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {['Rentabilidad', 'Originalidad', 'Coherencia', 'Tendencias'].map(focus => (
                            <button
                                key={focus}
                                onClick={() => toggleFocus(focus)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${selectedFocus.includes(focus) ? 'bg-cyan-500 border-cyan-400' : 'bg-transparent border-white/10'}`}
                            >
                                <div className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${selectedFocus.includes(focus) ? 'bg-white' : 'bg-transparent border-white/40'}`}>
                                    {selectedFocus.includes(focus) && <div className="w-1 h-1 rounded-full bg-cyan-600" />}
                                </div>
                                <span className={`text-[8px] font-bold ${selectedFocus.includes(focus) ? 'text-white' : 'text-white/60'}`}>{focus}</span>
                            </button>
                        ))}
                    </div>
                </GlassCard>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* Invoke Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-cyan-50 to-transparent dark:!bg-white/5 dark:from-cyan-900/10 dark:to-transparent dark:!border-white/10">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-xl action-glow-turquoise">
                            <span className="material-symbols-outlined text-3xl fill-1">rate_review</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Invocar Crítico</h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">Pega el texto de tu menú abajo</p>
                        </div>
                    </div>

                    <textarea
                        value={menuText}
                        onChange={(e) => setMenuText(e.target.value)}
                        placeholder="Ej: Margarita - Tequila, Triple Sec, Lima..."
                        className="w-full h-24 p-4 bg-white/60 dark:!bg-white/5 border border-cyan-100 dark:!border-white/10 rounded-2xl text-[11px] text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/40 focus:ring-2 focus:ring-cyan-500 outline-none mb-3 transition-all"
                    />

                    {/* Specialized Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button onClick={() => handleInviteCritic('allergens')} className="flex items-center gap-2 p-3 bg-zinc-100/50 dark:!bg-white/5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-zinc-200/50 dark:!border-white/5">
                            <span className="material-symbols-outlined text-xs text-amber-600 dark:text-amber-400">medical_services</span>
                            <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Alérgenos</span>
                        </button>
                        <button onClick={() => handleInviteCritic('design')} className="flex items-center gap-2 p-3 bg-zinc-100/50 dark:!bg-white/5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-zinc-200/50 dark:!border-white/5">
                            <span className="material-symbols-outlined text-xs text-purple-600 dark:text-purple-400">palette</span>
                            <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Diseño</span>
                        </button>
                        <button onClick={() => handleInviteCritic('prices')} className="flex items-center gap-2 p-3 bg-zinc-100/50 dark:!bg-white/5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-zinc-200/50 dark:!border-white/5">
                            <span className="material-symbols-outlined text-xs text-emerald-600 dark:text-emerald-400">payments</span>
                            <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Precios</span>
                        </button>
                        <button onClick={() => handleInviteCritic('text')} className="flex items-center gap-2 p-3 bg-zinc-100/50 dark:!bg-white/5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors border border-zinc-200/50 dark:!border-white/5">
                            <span className="material-symbols-outlined text-xs text-blue-600 dark:text-blue-400">spellcheck</span>
                            <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-300 uppercase tracking-wide">Textos</span>
                        </button>
                    </div>

                    <PremiumButton
                        customColor="#06b6d4"
                        customGradient="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        onClick={() => handleInviteCritic()}
                        loading={isGeneratingLocally || state.isEvaluating}
                        disabled={!menuText.trim() || isGeneratingLocally}
                        icon={<span className="material-symbols-outlined !text-base">gavel</span>}
                        iconPosition="right"
                    >
                        {isGeneratingLocally || state.isEvaluating ? 'CRITICANDO...' : 'INVOCAR CRÍTICO'}
                    </PremiumButton>
                </GlassCard>

                {/* Result Display */}
                {criticResult && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Análisis del Crítico</h3>
                        <GlassCard
                            rounded="3xl"
                            padding="md"
                            className="mb-6 bg-white/90 dark:!bg-white/5 border-cyan-200 dark:!border-white/10"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-cyan-600">{criticResult.score}</span>
                                    <span className="text-xs font-bold text-zinc-400">/ 10</span>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1 bg-cyan-100 rounded-full text-[10px] font-black text-cyan-700 uppercase">
                                        {criticResult.score >= 8 ? 'Excelente' : criticResult.score >= 6 ? 'Aceptable' : 'Mejorable'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">Puntos Fuertes</h4>
                                    <div className="space-y-1">
                                        {criticResult.puntosFuertes.map((item: string, i: number) => (
                                            <div key={i} className="flex gap-2 text-[11px] text-zinc-700 font-medium">
                                                <span className="text-emerald-500">•</span> {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-wider mb-2">Debilidades</h4>
                                    <div className="space-y-1">
                                        {criticResult.debilidades.map((item: string, i: number) => (
                                            <div key={i} className="flex gap-2 text-[11px] text-zinc-700 font-medium">
                                                <span className="text-rose-500">•</span> {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-100 italic text-xs text-cyan-800 font-serif leading-relaxed">
                                "{criticResult.feedback}"
                            </div>
                        </GlassCard>
                    </div>
                )}

                {/* Critique Log */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Críticas Recientes</h3>
                    {critiques.map((item, i) => (
                        <GlassCard
                            key={i}
                            rounded="3xl"
                            padding="md"
                            className="mb-3 bg-white/40 dark:!bg-white/5 border-white/20 dark:!border-white/10"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-lg font-bold text-zinc-900 dark:text-white">{item.recipe}</h4>
                                        <span className={`text-2xl font-black ${item.score >= 8 ? 'text-emerald-600 dark:text-emerald-400' : item.score >= 7 ? 'text-cyan-600 dark:text-cyan-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {item.score}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">{item.feedback}</p>
                                    <span className="text-[9px] text-zinc-400">{item.date}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wide ${item.severity === 'major' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                                    }`}>
                                    {item.severity}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-3 rounded-2xl text-[10px] font-black text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:!bg-white/5 border border-zinc-200 dark:!border-white/10 uppercase tracking-wider hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors">
                                    Ver Reporte Completo
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>

            {/* Premium Response Modal */}
            {alertConfig && (
                <CerebrityResponseModal
                    isOpen={alertConfig.isOpen}
                    onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    type={alertConfig.type}
                />
            )}
        </div>
    );
};

export default CerebrityCritic;
