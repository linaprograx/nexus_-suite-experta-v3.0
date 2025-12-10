import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionCreativeEngine } from '../hooks/useChampionCreativeEngine';

export const ChampionFineTuningPanel: React.FC = () => {
    const { state, actions } = useChampionCreativeEngine();

    return (
        <div className="h-full flex flex-col gap-4 font-sans text-slate-800 relative">
            {/* Status Toast */}
            {state.statusMessage && (
                <div className="absolute top-0 right-0 left-0 -mt-12 z-50 flex justify-center animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-slate-800 text-white text-xs font-bold py-2 px-4 rounded-full shadow-lg flex items-center gap-2">
                        <Icon svg={ICONS.check} className="w-3 h-3 text-emerald-400" />
                        {state.statusMessage}
                    </div>
                </div>
            )}
            {/* Tech Validation */}
            <div className="p-5 bg-white/80 dark:bg-slate-800/40 backdrop-blur-xl rounded-[22px] border border-white/40 dark:border-white/10 shadow-sm relative z-20">
                <h3 className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[2px] mb-5 flex items-center justify-between">
                    <span>Validación Técnica</span>
                    <button className="text-[10px] text-indigo-500 hover:underline">Ver Detalles</button>
                </h3>

                <div className="space-y-5">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">ABV (Alcohol)</span>
                            <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 rounded">18.5%</span>
                        </div>
                        <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-full">
                            <div className="absolute top-0 left-0 h-full bg-emerald-500 w-[60%] rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dulzura (Brix)</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2 rounded uppercase">Balanced</span>
                        </div>
                        <div className="relative h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden w-full">
                            <div className="absolute top-0 left-0 h-full bg-amber-500 w-[45%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.3)]"></div>
                        </div>
                    </div>
                </div>

                <button className="mt-4 w-full py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase rounded-xl border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors">
                    Re-Optimizar Balance
                </button>
            </div>

            {/* Judges Checklist */}
            <div className="flex-1 bg-white/40 dark:bg-slate-800/20 backdrop-blur-md rounded-[22px] border border-white/40 dark:border-white/10 p-5 overflow-y-auto custom-scrollbar">
                <h4 className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-[2px] mb-4">Checklist Jueces</h4>
                <div className="space-y-2">
                    {['Historia / Storytelling', 'Balance de sabor', 'Técnica visual', 'Limpieza', 'Uso del producto'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-white/40 dark:bg-slate-800/40 hover:bg-white/60 rounded-xl cursor-pointer transition-all group border border-transparent hover:border-indigo-200/50 hover:shadow-sm">
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 bg-white/50 group-hover:border-indigo-500 flex items-center justify-center transition-colors">
                                <Icon svg={ICONS.check} className="w-3 h-3 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200">{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                    onClick={actions.saveToGrimorium}
                    disabled={!state.proposal}
                    className="p-4 bg-white/60 dark:bg-slate-800/60 hover:bg-white backdrop-blur-xl rounded-[22px] border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/40 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.book} className="w-4 h-4 text-indigo-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase text-center leading-tight">Enviar a<br />Grimorium</span>
                </button>

                <button
                    onClick={actions.createTrainingPlan}
                    disabled={!state.proposal}
                    className="p-4 bg-white/60 dark:bg-slate-800/60 hover:bg-white backdrop-blur-xl rounded-[22px] border border-white/40 dark:border-white/10 shadow-sm flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/40 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.layout} className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase text-center leading-tight">Crear Plan<br />Entrenamiento</span>
                </button>
            </div>
        </div>
    );
};
