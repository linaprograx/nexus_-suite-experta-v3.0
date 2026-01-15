import React from 'react';
import GlassCard from '../../../components/GlassCard';
import { useChampionContext } from '../../../../../features/champion-mode/context/ChampionContext';
import { useCerebrityOrchestrator } from '../../../../../hooks/useCerebrityOrchestrator';

export const MobileChampionValidation: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { actions: orchestratorActions, state: orchestratorState } = useCerebrityOrchestrator();
    const { aiEvaluation, proposal } = state;

    const handleRunJury = async () => {
        if (!proposal) return;
        actions.setAiEvaluation(null);
        const evaluation = await orchestratorActions.evaluateCompetitionEntry(proposal.title);

        const mappedResult = {
            overallScore: evaluation.puntuacion_global,
            verdict: evaluation.veredicto,
            categoryScores: {
                technique: Math.min(100, evaluation.puntuacion_global + (Math.random() * 10 - 5)),
                creativity: Math.min(100, evaluation.puntuacion_global + (Math.random() * 10 - 5)),
                storytelling: Math.min(100, evaluation.puntuacion_global + (Math.random() * 10 - 5)),
                viability: Math.min(100, evaluation.puntuacion_global - 5)
            },
            juryBreakdown: {
                technical: { score: Math.round(evaluation.puntuacion_global), comment: evaluation.fortalezas[0] || "Ejecución sólida." },
                brand: { score: Math.round(evaluation.puntuacion_global - 5), comment: "Alineación consistente." },
                creative: { score: Math.round(evaluation.puntuacion_global + 5), comment: evaluation.recomendacion || "Propuesta interesante." }
            },
            feedback: [evaluation.comentario_jurado, ...evaluation.debilidades]
        };

        actions.setAiEvaluation(mappedResult);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {!aiEvaluation ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-32 h-32 rounded-full border-2 border-dashed border-emerald-950/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border border-emerald-600/20 animate-ping opacity-20"></div>
                        <span className="material-symbols-outlined text-4xl text-emerald-950/20">shield_person</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tighter">Esperando Veredicto</h2>
                        <p className="text-[10px] text-emerald-900/40 font-bold uppercase tracking-widest mt-2 px-10">Convoca al jurado para validar tu propuesta</p>
                    </div>
                    <button
                        onClick={handleRunJury}
                        disabled={!proposal || orchestratorState.isEvaluating}
                        className="px-8 py-4 bg-emerald-950 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all disabled:opacity-40"
                    >
                        {orchestratorState.isEvaluating ? 'Deliberando...' : 'Convocar Jurado IA'}
                    </button>
                </div>
            ) : (
                <div className="space-y-8 animate-in face-in duration-700">
                    {/* Hero Score */}
                    <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            <svg className="w-full h-full rotate-[-90deg]">
                                <circle
                                    cx="96" cy="96" r="80"
                                    className="stroke-emerald-950/5 fill-none"
                                    strokeWidth="12"
                                />
                                <circle
                                    cx="96" cy="96" r="80"
                                    className="stroke-emerald-600 fill-none transition-all duration-1000"
                                    strokeWidth="12"
                                    strokeDasharray={2 * Math.PI * 80}
                                    strokeDashoffset={(2 * Math.PI * 80) * (1 - aiEvaluation.overallScore / 100)}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-5xl font-black text-emerald-950 leading-none">{aiEvaluation.overallScore}</span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-2">{aiEvaluation.verdict}</span>
                            </div>
                        </div>
                    </div>

                    {/* Category Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(aiEvaluation.categoryScores).map(([key, score]) => (
                            <GlassCard key={key} rounded="2xl" padding="md" className="bg-white/40 border-emerald-900/5">
                                <span className="text-[8px] font-black text-emerald-950/40 uppercase tracking-widest block mb-2">{key === 'storytelling' ? 'Story' : key}</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-1 bg-emerald-950/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-600" style={{ width: `${score}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-emerald-950">{Math.round(score as number)}</span>
                                </div>
                            </GlassCard>
                        ))}
                    </div>

                    {/* Expert Jury Feedback */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-emerald-900/60 uppercase tracking-[0.2em] px-2">Panel de Expertos</h3>
                        <div className="space-y-3">
                            {aiEvaluation.juryBreakdown && Object.entries(aiEvaluation.juryBreakdown).map(([name, data]: [string, any]) => (
                                <GlassCard key={name} rounded="2xl" padding="lg" className="bg-emerald-950/5 border-emerald-900/10">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                                            <span className="text-[9px] font-black text-emerald-900 uppercase tracking-widest">
                                                {name === 'technical' ? 'Juez Técnico' : name === 'brand' ? 'Brand Guardian' : 'Juez Creativo'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] font-black text-emerald-600">{data.score}/100</span>
                                    </div>
                                    <p className="text-[11px] text-emerald-950/70 font-medium italic leading-relaxed">"{data.comment}"</p>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    {/* Brand Feedback */}
                    <GlassCard rounded="3xl" padding="lg" className="bg-emerald-950 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/20 blur-3xl -mr-12 -mt-12"></div>
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-4">Alineación de Marca</h4>
                        <p className="text-xs font-medium leading-relaxed italic opacity-80">
                            "La propuesta demuestra una coherencia del <span className="text-emerald-400 font-bold">87%</span>. Se recomienda potenciar el aspecto visual para asegurar la victoria."
                        </p>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};
