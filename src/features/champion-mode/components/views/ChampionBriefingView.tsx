import React from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
// import { CompetitionBriefPanel } from '../CompetitionBriefPanel'; // Assuming this needs dark mode too, but for now wrapping it or relying on internal styles? 
// Actually I'll wrap it in a dark container or just style the surrounding.
// The Panel likely needs its own refactor if it has hardcoded styles. 
// For now I'll assume I can style the container.
import { CompetitionBriefPanel } from '../CompetitionBriefPanel';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionBriefingView: React.FC = () => {
    const { state, actions } = useChampionContext();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [newRuleText, setNewRuleText] = React.useState('');

    const handleAddRule = () => {
        if (!newRuleText.trim()) return;
        actions.addRule(newRuleText);
        setNewRuleText('');
        setIsModalOpen(false);
    };

    return (
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-3 xl:grid-rows-1 gap-4 overflow-hidden relative">
            {/* COLUMN 1: CONTEXT & INPUTS */}
            <ChampionColumn
                title="Contexto Competitivo"
                accentColor="bg-cyan-500/20 text-cyan-200"
                scrollable
            >
                <div className="p-4">
                    {/* Dark Mode Wrapper around Panel if Panel is transparent */}
                    <div className="bg-slate-800/50 rounded-2xl p-2 border border-white/10">
                        <CompetitionBriefPanel />
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 2: OFFICIAL RULES DOCTRINE */}
            <ChampionColumn
                title="Reglas Oficiales"
                accentColor="bg-rose-500/20 text-rose-200"
                scrollable
            >
                <div className="p-4 space-y-4">
                    <div className="bg-rose-900/30 border border-rose-500/30 rounded-2xl p-4 sticky top-0 z-10 backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-3 mb-2 text-rose-300 font-bold uppercase text-[10px] tracking-widest">
                            <Icon svg={ICONS.alert} className="w-4 h-4" />
                            Restricciones Activas
                        </div>
                        <p className="text-xs text-rose-200/80 leading-relaxed">
                            Cualquier violación de estas reglas resultará en una penalización automática del Jurado IA en la fase de Validación.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {state.brief.constraints.length > 0 ? (
                            state.brief.constraints.map((rule, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-slate-800/40 rounded-xl border border-white/5 shadow-sm transition-all hover:border-rose-500/50 group">
                                    <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                        <span className="font-mono font-bold text-[10px]">{i + 1}</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                                        {rule}
                                    </span>
                                    {/* User Editable Rules */}
                                    <button
                                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-slate-500 hover:text-rose-400 transition-all"
                                        onClick={() => actions.removeRule(i)}
                                    >
                                        <Icon svg={ICONS.trash} className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <Icon svg={ICONS.fileText} className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                                <p className="text-sm text-slate-400 font-medium">Sube las bases para extraer las reglas.</p>
                            </div>
                        )}

                        {/* Add Rule Button */}
                        <button
                            className="w-full py-3 border border-dashed border-slate-700/50 rounded-xl text-slate-500 text-xs font-bold uppercase hover:border-rose-500/50 hover:text-rose-400 transition-colors flex items-center justify-center gap-2 bg-slate-800/20"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Icon svg={ICONS.plus} className="w-3 h-3" />
                            Agregar Regla Manual
                        </button>
                    </div>
                </div>
            </ChampionColumn >

            {/* COLUMN 3: STRATEGIC AI DIRECTOR */}
            <ChampionColumn
                title="Estrategia Ganadora"
                accentColor="bg-violet-500/20 text-violet-200"
                scrollable
            >
                <div className="p-4 h-full flex flex-col">
                    <div className="bg-gradient-to-br from-violet-900/40 to-slate-900/40 rounded-[24px] p-6 border border-violet-500/20 flex-1 relative overflow-hidden group min-h-[300px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-violet-500/20 shadow-inner flex items-center justify-center text-violet-300 border border-violet-500/30">
                                    <Icon svg={ICONS.brain} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-violet-200 uppercase tracking-widest">Director Creativo</h4>
                                    <p className="text-[10px] text-violet-400 font-medium">Análisis de Oportunidad</p>
                                </div>
                                <button
                                    className="ml-auto p-2 bg-white/5 rounded-full text-violet-400 hover:text-white hover:bg-white/10 shadow-sm transition-colors border border-white/5"
                                    title="Regenerar Estrategia"
                                    onClick={() => actions.generateTacticalHint()}
                                >
                                    <Icon svg={ICONS.refresh} className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <p className="text-sm text-slate-300 leading-loose style-italic">
                                    "Para <span className="font-bold text-white">{state.brief.brand}</span> en una competencia de <span className="font-bold text-white">{state.brief.competitionType}</span>, el jurado buscará..."
                                </p>

                                {state.tacticalHint ? (
                                    <div className="p-4 bg-violet-500/10 rounded-xl text-xs text-violet-200 animate-in fade-in slide-in-from-bottom-2 border border-violet-500/20">
                                        <p className="font-bold mb-1 text-violet-300">💡 Hint Táctico:</p>
                                        "{state.tacticalHint}"
                                    </div>
                                ) : (
                                    <ul className="space-y-3 mt-4">
                                        <li className="flex gap-3 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                            <span>Innovación técnica sobre la narrativa tradicional. Evita clichés.</span>
                                        </li>
                                        <li className="flex gap-3 text-xs text-slate-400 bg-white/5 p-3 rounded-lg border border-white/5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                            <span>Uso disruptivo del ingrediente base.</span>
                                        </li>
                                    </ul>
                                )}
                            </div>

                            <button
                                onClick={() => actions.generateTacticalHint()}
                                disabled={state.statusMessage?.includes('Analizando')}
                                className="w-full mt-6 py-3 bg-violet-600/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-violet-500 transition-colors shadow-lg shadow-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10"
                            >
                                {state.statusMessage?.includes('Analizando') ? 'Analizando...' : 'Generar Hint Táctico'}
                            </button>
                        </div>
                    </div>
                </div>
            </ChampionColumn>

            {/* CUSTOM MODAL - ABSOLUTE POSITIONED TO COVER VIEW */}
            {
                isModalOpen && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-[30px] shadow-2xl p-8 transform animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                    <Icon svg={ICONS.plus} className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider">Nueva Regla Manual</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Descripción de la Regla</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newRuleText}
                                        onChange={(e) => setNewRuleText(e.target.value)}
                                        placeholder="Ej: Prohibido usar hielo seco..."
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleAddRule();
                                            if (e.key === 'Escape') setIsModalOpen(false);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddRule}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-900/50 transition-all"
                                >
                                    Agregar Regla
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
