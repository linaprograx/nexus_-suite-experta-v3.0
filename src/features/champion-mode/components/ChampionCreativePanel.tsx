import React from 'react';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { useChampionCreativeEngine } from '../hooks/useChampionCreativeEngine';

export const ChampionCreativePanel: React.FC = () => {
    const { state, actions } = useChampionCreativeEngine();

    return (
        <div className="flex flex-col gap-4 relative font-sans text-slate-800 max-w-3xl mx-auto w-full pb-4">
            {/* Background Base - subtle gradient as requested */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#f5f5f7] to-[#e8ecf5] rounded-[22px] pointer-events-none opacity-50 h-full" />

            {/* Inspiration Input Card */}
            <div className="relative bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl p-6 rounded-[22px] border border-white/40 dark:border-white/10 shadow-sm z-10 transition-all hover:shadow-[0px_4px_20px_rgba(0,0,0,0.06)] shrink-0">
                <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide">
                    <Icon svg={ICONS.sparkles} className="w-4 h-4 text-indigo-500" />
                    Motor Creativo
                </h2>

                <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Inspiración / Concepto</label>
                        <textarea
                            value={state.concept}
                            onChange={(e) => actions.setConcept(e.target.value)}
                            placeholder="Describe tu visión..."
                            className="w-full h-20 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[18px] p-4 text-sm font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all shadow-inner"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {['Floral', 'Ahumado', 'Minimalista', 'Teatral', 'Cítrico', 'Especiado'].map(tag => {
                            const isActive = state.tags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => actions.toggleTag(tag)}
                                    className={`
                                        px-4 py-1.5 rounded-full text-[11px] font-bold transition-all transform hover:scale-105 active:scale-95
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}
                                    `}
                                    title={`Filtrar por estilo ${tag}`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Proposed Result - Allow natural growth */}
            <div className="relative bg-white/40 dark:bg-slate-800/20 backdrop-blur-md p-0 rounded-[22px] border border-white/40 dark:border-white/10 flex flex-col z-10 shadow-sm min-h-[500px]">
                <div className="p-6 pb-2 flex items-center justify-between bg-white/40 dark:bg-slate-800/40 border-b border-white/20 dark:border-white/5">
                    <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${state.isGenerating ? 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        {state.isGenerating ? 'Generando...' : 'Propuesta Generada'}
                    </span>
                    <button
                        onClick={actions.generateProposal}
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors group"
                        title="Regenerar propuesta"
                    >
                        <Icon svg={ICONS.refresh} className={`w-4 h-4 text-slate-400 group-hover:text-indigo-500 ${state.isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="p-6 pt-4 flex-1">
                    {state.proposal ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 leading-tight">
                                {state.proposal.title}
                            </h1>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic mb-8 leading-relaxed border-l-4 border-indigo-200 pl-4 py-1">
                                "{state.proposal.description}"
                            </p>

                            <div className="space-y-0.5 mb-6">
                                {state.proposal.recipe.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm p-3 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                                        <span className="text-slate-700 dark:text-slate-300 font-bold">{item.ingredient}</span>
                                        <span className="font-mono text-indigo-500 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 min-h-[300px]">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                                <Icon svg={ICONS.flask} className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-xs uppercase tracking-widest font-bold">Sin Propuesta Activa</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white/40 dark:bg-slate-800/40 border-t border-white/20 dark:border-white/5 mt-auto">
                    <button
                        onClick={actions.generateProposal}
                        disabled={state.isGenerating}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-[18px] shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        <Icon svg={ICONS.wand} className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        {state.isGenerating ? 'DISEÑANDO...' : 'GENERAR PROPUESTA'}
                    </button>
                </div>
            </div>
        </div>
    );
};
