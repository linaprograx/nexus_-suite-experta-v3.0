import React from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionValidationView: React.FC = () => {
    const { state, actions } = useChampionContext();
    const { aiEvaluation, proposal } = state;

    return (
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-3 xl:grid-rows-1 gap-8 overflow-hidden">
            {/* COLUMN 1: TECHNICAL ANALYSIS */}
            <ChampionColumn
                title="Análisis Técnico"
                accentColor="bg-slate-500"
                scrollable
            >
                <div className="p-6 h-full flex flex-col justify-start">
                    {aiEvaluation ? (
                        <div className="space-y-8 animate-in fade-in duration-700">
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-slate-100 bg-white shadow-xl relative">
                                    <span className="text-3xl font-black text-slate-800">{aiEvaluation.overallScore}</span>
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                                        Total
                                    </div>
                                </div>
                                <h4 className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Puntaje Oficial</h4>
                            </div>

                            <div className="space-y-4">
                                {Object.entries(aiEvaluation.categoryScores).map(([key, score]) => (
                                    <div key={key}>
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{key}</span>
                                            <span className="text-[10px] font-mono font-bold text-slate-700">{score}/100</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-slate-800 rounded-full transition-all duration-1000"
                                                style={{ width: `${score}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center opacity-40 py-10">
                            <Icon svg={ICONS.activity} className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-xs text-slate-500">Sin datos de análisis.</p>
                        </div>
                    )}
                </div>
            </ChampionColumn>

            {/* COLUMN 2: JURY FEEDBACK (Rules Engine Output) */}
            <ChampionColumn
                title="Veredicto del Jurado"
                accentColor="bg-emerald-500"
                scrollable
            >
                <div className="p-6 space-y-4">
                    {aiEvaluation ? (
                        <>
                            {/* ELITE/JUPITER: Multi-Jury Display */}
                            {aiEvaluation.juryBreakdown ? (
                                <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700">
                                    <div className="bg-slate-800 text-white p-3 rounded-lg text-center shadow-md">
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest">Panel de Expertos (Elite)</h4>
                                    </div>

                                    {/* Tech Judge */}
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Juez Técnico</span>
                                            <span className="text-[10px] font-bold text-slate-800">{aiEvaluation.juryBreakdown.technical.score}/100</span>
                                        </div>
                                        <p className="text-xs text-slate-600 italic">"{aiEvaluation.juryBreakdown.technical.comment}"</p>
                                    </div>

                                    {/* Brand Judge */}
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-fuchsia-500 uppercase">Brand Guardian</span>
                                            <span className="text-[10px] font-bold text-slate-800">{aiEvaluation.juryBreakdown.brand.score}/100</span>
                                        </div>
                                        <p className="text-xs text-slate-600 italic">"{aiEvaluation.juryBreakdown.brand.comment}"</p>
                                    </div>

                                    {/* Creative Judge */}
                                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-violet-500 uppercase">Juez Creativo</span>
                                            <span className="text-[10px] font-bold text-slate-800">{aiEvaluation.juryBreakdown.creative.score}/100</span>
                                        </div>
                                        <p className="text-xs text-slate-600 italic">"{aiEvaluation.juryBreakdown.creative.comment}"</p>
                                    </div>
                                </div>
                            ) : (
                                /* STANDARD PLATINUM DISPLAY */
                                <>
                                    <div className={`p-4 rounded-xl border ${aiEvaluation.overallScore >= 80 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} animate-in slide-in-from-bottom-4 duration-700`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                                <Icon svg={ICONS.user} className="w-4 h-4 text-slate-700" />
                                            </div>
                                            <h4 className={`text-xs font-bold uppercase tracking-widest ${aiEvaluation.overallScore >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                                {aiEvaluation.verdict}
                                            </h4>
                                        </div>
                                        <p className="text-xs text-slate-600 leading-relaxed italic border-l-2 pl-3 border-black/10">
                                            "{aiEvaluation.feedback[0] || "El jurado está deliberando..."}"
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-4">Comentarios Desglosados</h5>
                                        {aiEvaluation.feedback.slice(1).map((fb, i) => (
                                            <div key={i} className="flex gap-3 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm transition-transform hover:translate-x-1">
                                                <Icon svg={ICONS.messageSquare} className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
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
                            <Icon svg={ICONS.users} className="w-12 h-12 text-slate-300" />
                            <p className="text-sm text-slate-400 px-8 text-center leading-relaxed">
                                El panel de jueces está esperando tu propuesta final para emitir un veredicto oficial.
                            </p>
                            <button
                                onClick={() => actions.runAiEvaluation()}
                                disabled={!proposal}
                                className="px-6 py-2 bg-slate-800 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-lg"
                            >
                                Convocar Jurado
                            </button>
                        </div>
                    )}
                </div>
            </ChampionColumn>

            {/* COLUMN 3: CREATIVE ALIGNMENT */}
            <ChampionColumn
                title="Coherencia de Marca"
                accentColor="bg-fuchsia-500"
                scrollable
            >
                <div className="p-6 h-full relative flex flex-col items-center justify-center">
                    <div className="w-full aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center relative bg-slate-50/50">
                        <div className="text-center z-10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Radar de Marca</h4>
                            {/* Visual Placeholder for Radar Chart */}
                            <div className="w-40 h-40 mx-auto bg-white rounded-full border border-slate-100 relative flex items-center justify-center shadow-lg">
                                <div className="w-24 h-24 bg-fuchsia-500/10 rounded-full absolute animate-pulse" />
                                <div className="w-24 h-24 bg-cyan-500/10 rounded-full absolute border border-cyan-200" style={{ transform: 'scale(1.2) rotate(45deg)' }} />
                                <span className="text-[10px] font-bold text-slate-400 tracking-widest">BRANDFIT ™</span>
                            </div>
                        </div>
                        {/* Decorative Background Elements */}
                        <div className="absolute top-4 left-4 text-[10px] font-bold text-slate-300">INNOVACIÓN</div>
                        <div className="absolute top-4 right-4 text-[10px] font-bold text-slate-300">TÉCNICA</div>
                        <div className="absolute bottom-4 left-4 text-[10px] font-bold text-slate-300">IMPACTO</div>
                        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-300">STORY</div>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-xl border border-slate-100 shadow-sm w-full">
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Análisis de Alineación</h5>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            La propuesta se alinea en un <span className="text-emerald-500 font-bold">87%</span> con los valores de <span className="text-slate-700 font-bold">{state.brief.brand}</span>. Se recomienda potenciar el aspecto "Disruptivo" para asegurar la victoria.
                        </p>
                    </div>
                </div>
            </ChampionColumn>
        </div>
    );
};
