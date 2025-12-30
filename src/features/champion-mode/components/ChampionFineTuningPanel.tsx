import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionContext } from '../context/ChampionContext';
import { soundEngine } from '../../avatar/soundEngine';

export const ChampionFineTuningPanel: React.FC = () => {
    const { state, actions } = useChampionContext();

    const handleCopyPitch = () => {
        if (!state.proposal) return;
        const text = `${state.proposal.title}\n\n${state.proposal.description}\n\n${state.proposal.recipe.map(i => `- ${i.ingredient}: ${i.amount}`).join('\n')}`;
        navigator.clipboard.writeText(text);
        soundEngine.playSuccessSoft();
        // Here we would ideally show a toast, but playing success sound is enough feedback for now
    };

    return (
        <div className="h-full flex flex-col gap-4 font-sans text-slate-800 relative">
            {/* Status Toast */}
            {state.statusMessage && (
                <div className="absolute top-0 right-0 left-0 -mt-8 z-50 flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-slate-800 text-white text-[10px] font-bold py-2 px-4 rounded-full shadow-xl flex items-center gap-2">
                        <Icon svg={ICONS.check} className="w-3 h-3 text-emerald-400" />
                        {state.statusMessage}
                    </div>
                </div>
            )}

            {/* AI Evaluator / Tech Validation */}
            <div className="p-5 bg-white rounded-[22px] border border-white shadow-sm relative z-20 transition-all hover:shadow-md">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[2px] flex items-center gap-2">
                        <Icon svg={ICONS.cpu} className="w-3 h-3 text-fuchsia-500" />
                        {state.aiEvaluation ? 'Evaluación IA' : 'Validación Técnica'}
                    </h3>
                    <button
                        onClick={() => {
                            soundEngine.playClickSoft();
                            actions.runAiEvaluation();
                        }}
                        disabled={!state.proposal}
                        className="text-[9px] bg-fuchsia-50 text-fuchsia-600 px-3 py-1 rounded-full font-bold hover:bg-fuchsia-100 transition-colors disabled:opacity-50"
                    >
                        {state.aiEvaluation ? 'Re-evaluar' : 'Evaluar'}
                    </button>
                </div>

                {state.aiEvaluation ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                            <span className="text-4xl font-black text-slate-800 tracking-tighter animate-in zoom-in spin-in-3 duration-500">{state.aiEvaluation.overallScore}</span>
                            <div className="text-right">
                                <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded border shadow-sm ${state.aiEvaluation.overallScore > 85 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                    {state.aiEvaluation.verdict}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {Object.entries(state.aiEvaluation.categoryScores).slice(0, 3).map(([key, score], idx) => (
                                <div key={key} style={{ animationDelay: `${idx * 100}ms` }} className="animate-in slide-in-from-left-4 fade-in duration-500">
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">{key}</span>
                                        <span className="text-[9px] font-mono font-bold text-slate-600">{score}/100</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${score}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-center justify-center py-6 opacity-40">
                            <p className="text-[10px] text-center text-slate-400 max-w-[150px] font-medium leading-relaxed">
                                Ejecuta el análisis IA para obtener puntuaciones predictivas.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                soundEngine.playClickSoft();
                                actions.runAiEvaluation();
                            }}
                            disabled={!state.proposal}
                            className="w-full py-3 bg-slate-50 text-fuchsia-600 text-[10px] font-bold uppercase rounded-xl border border-dashed border-fuchsia-200 hover:bg-fuchsia-50 hover:border-fuchsia-300 transition-all font-mono"
                        >
                            Iniciar Análisis
                        </button>
                    </div>
                )}
            </div>

            {/* Story Summary Card */}
            {state.proposal && (
                <div className="bg-slate-50 rounded-[22px] border border-slate-100 p-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h4 className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-[1px] mb-3 flex justify-between">
                        Story Summary
                        <button onClick={handleCopyPitch} className="text-indigo-500 hover:text-indigo-700 flex items-center gap-1 transition-colors">
                            <Icon svg={ICONS.copy} className="w-3 h-3" />
                            <span className="text-[9px]">Copiar Pitch</span>
                        </button>
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 font-bold text-[8px] uppercase">Concepto</span>
                            <span className="font-bold text-slate-700 truncate block">{state.proposal.title}</span>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100">
                            <span className="block text-slate-400 font-bold text-[8px] uppercase">Estilo</span>
                            <span className="font-bold text-slate-700 truncate block">{state.tags.slice(0, 2).join(', ')}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
                {/* Visual Mode Toggle for Presentation */}
                <button
                    onClick={() => {
                        soundEngine.playClickSoft();
                        actions.setViewMode('PRESENTATION');
                    }}
                    disabled={!state.proposal}
                    className="col-span-2 p-3 bg-slate-800 text-white rounded-[18px] shadow-lg shadow-slate-200 flex items-center justify-center gap-2 transition-all hover:bg-slate-700 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:shadow-none"
                    title="Modo Presentación"
                >
                    <Icon svg={ICONS.monitor} className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Modo Presentación</span>
                </button>

                <button
                    onClick={() => {
                        soundEngine.playClickSoft();
                        actions.triggerPdfExport();
                    }}
                    disabled={!state.proposal}
                    className="p-3 bg-white hover:bg-slate-50 rounded-[18px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                    title="Exportar PDF"
                >
                    <Icon svg={ICONS.fileText} className="w-4 h-4 text-rose-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">PDF</span>
                </button>

                <button
                    onClick={() => {
                        soundEngine.playClickSoft();
                        actions.createTrainingPlan();
                    }}
                    disabled={!state.proposal}
                    className="p-3 bg-white hover:bg-slate-50 rounded-[18px] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 hover:-translate-y-0.5 active:scale-95"
                    title="Plan Entrenamiento"
                >
                    <Icon svg={ICONS.calendar} className="w-4 h-4 text-emerald-500" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Plan</span>
                </button>
            </div>
        </div>
    );
};

export default ChampionFineTuningPanel;
