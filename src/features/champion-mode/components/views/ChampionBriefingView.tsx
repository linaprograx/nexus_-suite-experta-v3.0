import React from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
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
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-3 xl:grid-rows-1 gap-8 overflow-hidden">
            {/* COLUMN 1: CONTEXT & INPUTS */}
            <ChampionColumn
                title="Contexto Competitivo"
                accentColor="bg-cyan-500"
                scrollable
            >
                <div className="p-5">
                    {/* Reusing the Panel but configured for Input */}
                    <CompetitionBriefPanel />
                </div>
            </ChampionColumn>

            {/* COLUMN 2: OFFICIAL RULES DOCTRINE */}
            <ChampionColumn
                title="Reglas Oficiales"
                accentColor="bg-rose-500"
                scrollable
            >
                <div className="p-6 space-y-6">
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 sticky top-0 z-10 shadow-sm backdrop-blur-sm bg-rose-50/90">
                        <div className="flex items-center gap-3 mb-2 text-rose-800 font-bold uppercase text-[10px] tracking-widest">
                            <Icon svg={ICONS.alertTriangle} className="w-4 h-4" />
                            Restricciones Activas
                        </div>
                        <p className="text-xs text-rose-700 leading-relaxed">
                            Cualquier violación de estas reglas resultará en una penalización automática del Jurado IA en la fase de Validación.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {state.brief.constraints.length > 0 ? (
                            state.brief.constraints.map((rule, i) => (
                                <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:border-rose-300 group">
                                    <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                                        <span className="font-mono font-bold text-[10px]">{i + 1}</span>
                                    </div>
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        {rule}
                                    </span>
                                    {/* User Editable Rules */}
                                    <button
                                        className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-500 transition-all"
                                        onClick={() => actions.removeRule(i)}
                                    >
                                        <Icon svg={ICONS.trash} className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 opacity-50">
                                <Icon svg={ICONS.fileText} className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-400 font-medium">Sube las bases para extraer las reglas.</p>
                            </div>
                        )}

                        {/* Add Rule Button */}
                        <button
                            className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-bold uppercase hover:border-rose-300 hover:text-rose-500 transition-colors flex items-center justify-center gap-2"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Icon svg={ICONS.plus} className="w-3 h-3" />
                            Agregar Regla Manual
                        </button>
                    </div>
                </div>
            </ChampionColumn >

            {/* CUSTOM MODAL FOR ADDING RULES */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[30px] shadow-2xl p-8 transform animate-in zoom-in-95 duration-200">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <Icon svg={ICONS.plus} className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-wider">Nueva Regla Manual</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 block">Descripción de la Regla</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newRuleText}
                                        onChange={(e) => setNewRuleText(e.target.value)}
                                        placeholder="Ej: Prohibido usar hielo seco..."
                                        className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddRule}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    Agregar Regla
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* COLUMN 3: STRATEGIC AI DIRECTOR */}
            <ChampionColumn
                title="Estrategia Ganadora"
                accentColor="bg-violet-500"
                scrollable
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="bg-violet-50/50 rounded-[24px] p-6 border border-violet-100/50 flex-1 relative overflow-hidden group min-h-[300px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/20 rounded-full blur-3xl -mr-10 -mt-10" />

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-violet-600">
                                    <Icon svg={ICONS.robot} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-violet-900 uppercase tracking-widest">Director Creativo</h4>
                                    <p className="text-[10px] text-violet-500 font-medium">Análisis de Oportunidad</p>
                                </div>
                                <button
                                    className="ml-auto p-2 bg-white rounded-full text-violet-400 hover:text-violet-600 shadow-sm transition-colors"
                                    title="Regenerar Estrategia"
                                    onClick={() => actions.generateTacticalHint()}
                                >
                                    <Icon svg={ICONS.refresh} className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                <p className="text-sm text-slate-600 leading-loose style-italic">
                                    "Para <span className="font-bold text-slate-800">{state.brief.brand}</span> en una competencia de <span className="font-bold text-slate-800">{state.brief.competitionType}</span>, el jurado buscará..."
                                </p>

                                {state.tacticalHint ? (
                                    <div className="p-4 bg-violet-100/50 rounded-xl text-xs text-violet-800 animate-in fade-in slide-in-from-bottom-2">
                                        <p className="font-bold mb-1">💡 Hint Táctico:</p>
                                        "{state.tacticalHint}"
                                    </div>
                                ) : (
                                    <ul className="space-y-3 mt-4">
                                        <li className="flex gap-3 text-xs text-slate-500 bg-white/60 p-3 rounded-lg border border-violet-100/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                            <span>Innovación técnica sobre la narrativa tradicional. Evita clichés de la marca.</span>
                                        </li>
                                        <li className="flex gap-3 text-xs text-slate-500 bg-white/60 p-3 rounded-lg border border-violet-100/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                            <span>Uso disruptivo del ingrediente base obligatorio. La textura será clave.</span>
                                        </li>
                                        <li className="flex gap-3 text-xs text-slate-500 bg-white/60 p-3 rounded-lg border border-violet-100/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                                            <span>Presentación minimalista pero impactante. Menos es más en este challenge.</span>
                                        </li>
                                    </ul>
                                )}
                            </div>

                            <button
                                onClick={() => actions.generateTacticalHint()}
                                disabled={state.statusMessage?.includes('Analizando')}
                                className="w-full mt-6 py-3 bg-white border border-violet-100 text-violet-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-violet-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {state.statusMessage?.includes('Analizando') ? 'Analizando...' : 'Generar Hint Táctico'}
                            </button>
                        </div>
                    </div>
                </div>
            </ChampionColumn>
        </div >
    );
};
