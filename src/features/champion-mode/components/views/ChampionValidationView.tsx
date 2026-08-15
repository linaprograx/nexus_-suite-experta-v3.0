import React from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionValidationView: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { aiEvaluation, proposal, brandEvaluation, juryDifficulty } = state;
    const [isRunning, setIsRunning] = React.useState(false);

    const handleRunJury = async () => {
        if (!proposal || isRunning) return;
        setIsRunning(true);
        actions.setAiEvaluation(null);
        try {
            await actions.runAiEvaluation();
        } finally {
            setIsRunning(false);
        }
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
                                            <span className="text-[10px] font-bold text-rose-400 uppercase">Juez Creativo</span>
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
                        /* EMPTY STATE — CTA prominente */
                        <div className="h-full flex flex-col items-center justify-center space-y-6 px-6">
                            {/* Dificultad selector */}
                            <div className="w-full">
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2 text-center">Nivel del Jurado</p>
                                <div className="flex gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                                    {(['Easy', 'Medium', 'World Class'] as const).map(level => (
                                        <button
                                            key={level}
                                            onClick={() => actions.setJuryDifficulty(level)}
                                            className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wide transition-all ${
                                                state.juryDifficulty === level
                                                    ? level === 'World Class'
                                                        ? 'bg-amber-500 text-white shadow-md'
                                                        : 'bg-rose-600 text-white shadow-md'
                                                    : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Icon svg={ICONS.users} className="w-14 h-14 text-slate-600" />
                            <p className="text-sm text-slate-400 text-center leading-relaxed max-w-[220px]">
                                {proposal
                                    ? 'Tu propuesta está lista para ser evaluada por el jurado.'
                                    : 'Genera una propuesta en el Motor Creativo primero.'}
                            </p>

                            <button
                                onClick={handleRunJury}
                                disabled={!proposal || isRunning}
                                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                                    proposal && !isRunning
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-900/50 hover:scale-[1.02] active:scale-[0.98]'
                                        : 'bg-white/5 border border-white/10 text-slate-600 cursor-not-allowed'
                                }`}
                            >
                                {isRunning ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-t-white border-r-transparent border-b-white border-l-transparent rounded-full animate-spin" />
                                        Deliberando...
                                    </>
                                ) : (
                                    <>⚖ Convocar Jurado</>
                                )}
                            </button>
                            {!proposal && (
                                <p className="text-[10px] text-slate-600 text-center">Primero genera una propuesta en el paso 2</p>
                            )}
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
                                    <div className="w-24 h-24 bg-rose-500/10 rounded-full absolute border border-rose-500/30" style={{ transform: 'scale(1.2) rotate(45deg)' }} />
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
                        {brandEvaluation ? (
                            <div className="space-y-2">
                                {/* verdict badge */}
                                {brandEvaluation.verdict && (
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                                        brandEvaluation.verdict === 'STRONG' ? 'bg-emerald-500/20 text-emerald-300' :
                                        brandEvaluation.verdict === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                                        'bg-red-500/20 text-red-300'
                                    }`}>{brandEvaluation.verdict}</span>
                                )}
                                {/* alignment score bar */}
                                {brandEvaluation.brandAlignmentScore != null && (
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-fuchsia-500 rounded-full transition-all duration-1000" style={{ width: `${brandEvaluation.brandAlignmentScore}%` }} />
                                        </div>
                                        <span className="text-fuchsia-300 font-bold text-xs">{brandEvaluation.brandAlignmentScore}%</span>
                                    </div>
                                )}
                                {/* risks */}
                                {brandEvaluation.risks?.length > 0 && (
                                    <ul className="text-[10px] text-slate-500 space-y-0.5">
                                        {brandEvaluation.risks.slice(0, 2).map((r: string, i: number) => (
                                            <li key={i}>⚠ {r}</li>
                                        ))}
                                    </ul>
                                )}
                                {/* recommendation */}
                                {brandEvaluation.strategicRecommendation && (
                                    <p className="text-[10px] text-slate-400 italic mt-1">→ {brandEvaluation.strategicRecommendation}</p>
                                )}
                            </div>
                        ) : isRunning ? (
                            <p className="text-[11px] text-slate-500 italic">Analizando coherencia de marca...</p>
                        ) : (
                            <p className="text-[11px] text-slate-500 italic">
                                Convoca al jurado para analizar la alineación con <span className="text-white">{state.brief.brand || 'la marca'}</span>.
                            </p>
                        )}
                    </div>
                </div>
            </ChampionColumn>
        </div>
    );
};
