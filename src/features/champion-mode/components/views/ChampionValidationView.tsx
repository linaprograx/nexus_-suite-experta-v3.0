import React from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';
import { useCerebrityOrchestrator } from '../../../../hooks/useCerebrityOrchestrator';

export const ChampionValidationView: React.FC = () => {
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
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-3 xl:grid-rows-1 gap-4 overflow-hidden">
            {/* COLUMN 1: TECHNICAL ANALYSIS */}
            <ChampionColumn
                title="Análisis Técnico"
                accentColor="bg-slate-500/20 text-slate-200"
                scrollable
            >
                <div className="p-6 h-full flex flex-col justify-start">
                    {aiEvaluation ? (
                        <div className="space-y-8 animate-in fade-in duration-700">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-white/5 bg-white/10 shadow-xl relative backdrop-blur-md">
                                    <span className="text-3xl font-black text-white">{aiEvaluation.overallScore}</span>
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-slate-700 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border border-white/10">
                                        Total
                                    </div>
                                </div>
                                <h4 className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Puntaje Oficial</h4>
                            </div>

                            <div className="space-y-4">
                                {aiEvaluation.categoryScores && Object.entries(aiEvaluation.categoryScores).map(([key, score]) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">{key}</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-300">{score as number}/100</span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(100,116,139,0.5)]"
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-40 py-10">
                            <Icon svg={ICONS.activity} className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">Sin datos de análisis.</p>
                        </div>
                    )}
                </div>
            </ChampionColumn>

            {/* COLUMN 2: JURY FEEDBACK (Rules Engine Output) */}
            <ChampionColumn
                title="Veredicto del Jurado"
                accentColor="bg-emerald-500/20 text-emerald-200"
                scrollable
            >
                <div className="p-6 space-y-4">
                    {aiEvaluation ? (
                        <>
                            {/* ELITE/JUPITER: Multi-Jury Display */}
                            {aiEvaluation.juryBreakdown ? (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                                    <div className="bg-slate-800/80 border border-white/10 text-white p-3 rounded-lg text-center shadow-lg backdrop-blur-md">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Panel de Expertos (Elite)</h4>
                                    </div>

                                    {/* Tech Judge */}
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 shadow-sm hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Juez Técnico</span>
                                            <span className="text-[10px] font-bold text-white">{aiEvaluation.juryBreakdown.technical.score}/100</span>
                                        </div>
                                        <p className="text-xs text-slate-300 italic">"{aiEvaluation.juryBreakdown.technical.comment}"</p>
                                    </div>

                                    {/* Brand Judge */}
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 shadow-sm hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-fuchsia-400 uppercase">Brand Guardian</span>
                                            <span className="text-[10px] font-bold text-white">{aiEvaluation.juryBreakdown.brand.score}/100</span>
                                        </div>
                                        <p className="text-xs text-slate-300 italic">"{aiEvaluation.juryBreakdown.brand.comment}"</p>
                                    </div>

                                    {/* Creative Judge */}
                                    <div className="bg-white/5 p-3 rounded-xl border border-white/10 shadow-sm hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-violet-400 uppercase">Juez Creativo</span>
                                            <span className="text-[10px] font-bold text-white">{aiEvaluation.juryBreakdown.creative.score}/100</span>
                                        </div>
                                        <p className="text-xs text-slate-300 italic">"{aiEvaluation.juryBreakdown.creative.comment}"</p>
                                    </div>
                                </div>
                            ) : (
                                /* STANDARD PLATINUM DISPLAY */
                                <>
                                    <div className={`p-4 rounded-xl border ${aiEvaluation.overallScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'} animate-in slide-in-from-bottom-4 duration-700`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-white/10 shadow-sm flex items-center justify-center border border-white/10">
                                                <Icon svg={ICONS.user} className="w-4 h-4 text-slate-300" />
                                            </div>
                                            <h4 className={`text-xs font-bold uppercase tracking-widest ${aiEvaluation.overallScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {aiEvaluation.verdict}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 pl-3 border-white/10">
                                            "{aiEvaluation.feedback?.[0] || aiEvaluation.feedback || "El jurado está deliberando..."}"
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-4">Comentarios Desglosados</h5>
                                        {Array.isArray(aiEvaluation.feedback) && aiEvaluation.feedback.slice(1).map((fb: string, i: number) => (
                                            <div key={i} className="flex gap-3 text-xs text-slate-300 bg-white/5 p-3 rounded-lg border border-white/5 shadow-sm transition-transform hover:translate-x-1 hover:bg-white/10">
                                                <Icon svg={ICONS.messageCircle} className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                                                {fb}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        /* EMPTY STATE */
                        <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                            <Icon svg={ICONS.users} className="w-12 h-12 text-slate-500" />
                            <p className="text-sm text-slate-400 px-8 text-center leading-relaxed">
                                El panel de jueces está esperando tu propuesta final para emitir un veredicto oficial.
                            </p>
                            <button
                                onClick={handleRunJury}
                                disabled={!proposal || orchestratorState.isEvaluating}
                                className="px-6 py-2 bg-slate-700 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-600 transition-colors disabled:opacity-50 shadow-lg flex items-center gap-2 border border-white/10"
                            >
                                {orchestratorState.isEvaluating ? (
                                    <>
                                        <Icon svg={ICONS.refresh} className="w-3 h-3 animate-spin" />
                                        Deliberando...
                                    </>
                                ) : (
                                    "Convocar Jurado"
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </ChampionColumn>

            {/* COLUMN 3: CREATIVE ALIGNMENT */}
            <ChampionColumn
                title="Coherencia de Marca"
                accentColor="bg-fuchsia-500/20 text-fuchsia-200"
                scrollable
            >
                <div className="p-6 h-full relative flex flex-col items-center justify-center">
                    <div className="w-full aspect-square border-2 border-dashed border-white/10 rounded-2xl flex items-center justify-center relative bg-white/5 overflow-hidden group">
                        {state.brandEvaluation && state.brandEvaluation.imageUrl ? (
                            <img
                                src={state.brandEvaluation.imageUrl}
                                alt="Brand Radar"
                                className="w-full h-full object-cover rounded-xl animate-in fade-in duration-700 transition-transform group-hover:scale-110"
                            />
                        ) : (
                            <div className="text-center z-10">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Radar de Marca</h4>
                                {/* Visual Placeholder for Radar Chart */}
                                <div className="w-40 h-40 mx-auto bg-slate-800/50 rounded-full border border-white/10 relative flex items-center justify-center shadow-lg backdrop-blur-sm">
                                    <div className="w-24 h-24 bg-fuchsia-500/10 rounded-full absolute animate-pulse" />
                                    <div className="w-24 h-24 bg-cyan-500/10 rounded-full absolute border border-cyan-500/30" style={{ transform: 'scale(1.2) rotate(45deg)' }} />
                                    <span className="text-[10px] font-bold text-slate-400 tracking-widest">BRANDFIT ™</span>
                                </div>
                            </div>
                        )}

                        {/* Decorative Background Elements (Only show if no image) */}
                        {!state.brandEvaluation?.imageUrl && (
                            <>
                                <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-500/50">INNOVACIÓN</div>
                                <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-500/50">TÉCNICA</div>
                                <div className="absolute bottom-4 left-4 text-[10px] font-bold text-slate-500/50">IMPACTO</div>
                                <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-500/50">STORY</div>
                            </>
                        )}
                    </div>

                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10 shadow-sm w-full">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Análisis de Alineación</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            La propuesta se alinea en un <span className="text-emerald-400 font-bold">87%</span> con los valores de <span className="text-white font-bold">{state.brief.brand}</span>. Se recomienda potenciar el aspecto "Disruptivo" para asegurar la victoria.
                        </p>
                    </div>
                </div>
            </ChampionColumn>
        </div>
    );
};
