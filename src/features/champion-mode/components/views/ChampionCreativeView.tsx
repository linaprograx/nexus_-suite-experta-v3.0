import React, { useState } from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { ChampionCreativePanel } from '../ChampionCreativePanel';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionCreativeView: React.FC = () => {
    const { state, actions } = useChampionContext();
    return (
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-[20fr_60fr_20fr] xl:grid-rows-1 gap-8 overflow-hidden">
            {/* COLUMN 1: INSPIRATION & MOOD */}
            <ChampionColumn
                title="Inspiración"
                accentColor="bg-violet-400"
                scrollable
            >
                <div className="p-4 space-y-6">
                    {/* Color Palette */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Paleta Cromática</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {['#1e293b', '#475569', '#94a3b8', '#cbd5e1', '#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe'].map(color => (
                                <div
                                    key={color}
                                    className={`aspect-square rounded-lg shadow-sm cursor-pointer hover:scale-110 transition-transform ring-2 ${state.palette === color ? 'ring-violet-500 scale-105' : 'ring-white'}`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => actions.setPalette(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Visual Tags */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Referencias Visuales</h4>
                        <div className="space-y-3">
                            {['Minimalismo Japonés', 'Art Deco', 'Cyberpunk', 'Naturaleza Muerta'].map(ref => {
                                const isActive = state.tags.includes(ref);
                                return (
                                    <div
                                        key={ref}
                                        className={`p-3 rounded-xl border shadow-sm flex items-center justify-between group cursor-pointer transition-all ${isActive ? 'bg-violet-50 border-violet-500' : 'bg-white border-slate-200 hover:border-violet-300'}`}
                                        onClick={() => actions.toggleVisualRef(ref)}
                                    >
                                        <span className={`text-xs font-bold ${isActive ? 'text-violet-700' : 'text-slate-600'}`}>{ref}</span>
                                        <Icon svg={ICONS.image} className={`w-3 h-3 ${isActive ? 'text-violet-500' : 'text-slate-300'} group-hover:text-violet-500`} />
                                    </div>
                                );
                            })}
                            <button
                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-[10px] uppercase font-bold text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors"
                                onClick={() => {
                                    const ref = prompt("Agregar referencia visual (texto):");
                                    if (ref) actions.toggleVisualRef(ref);
                                }}
                            >
                                + Agregar Ref
                            </button>
                        </div>
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 2: MAIN WORKSPACE (Existing Creative Panel) */}
            <ChampionColumn
                title="Motor Creativo"
                accentColor="bg-violet-600"
                scrollable
            >
                <div className="p-6">
                    <ChampionCreativePanel />
                </div>
            </ChampionColumn>

            {/* COLUMN 3: SERVICE EXPERIENCE (Refined) */}
            <ChampionColumn
                title="Experiencia de Servicio"
                accentColor="bg-fuchsia-500"
                scrollable
            >
                <div className="p-4 space-y-6">
                    {state.proposal ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* GLASSWARE */}
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                                    <Icon svg={ICONS.layout} className="w-8 h-8 text-slate-300" />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cristalería</h4>
                                <p className="text-sm font-bold text-slate-800">{state.proposal.glassware || "N/A"}</p>
                            </div>

                            {/* GARNISH */}
                            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-fuchsia-200 transition-colors">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-50 rounded-bl-[40px] -mr-4 -mt-4 z-0 pointer-events-none" />
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                                    <Icon svg={ICONS.image} className="w-3 h-3" />
                                    Garnish
                                </h4>
                                <div className="relative z-10">
                                    <p className="text-sm font-black text-fuchsia-600 mb-2">
                                        {typeof state.proposal.garnish === 'object' ? state.proposal.garnish.name : (state.proposal.garnish || "Sin Garnish")}
                                    </p>
                                    <p className="text-xs text-slate-500 leading-relaxed italic">
                                        "{typeof state.proposal.garnish === 'object' ? state.proposal.garnish.description : "Detalle no disponible."}"
                                    </p>
                                </div>
                            </div>

                            {/* SERVICE RITUAL - HERO */}
                            <div className="bg-slate-900 p-6 rounded-[24px] text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/50 to-purple-900/50 pointer-events-none" />
                                <Icon svg={ICONS.sparkles} className="w-24 h-24 text-white/5 absolute -bottom-4 -right-4 rotate-12" />

                                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4 relative z-10">Ritual de Servicio</h4>
                                <p className="text-xs font-medium text-white/90 leading-loose relative z-10 italic">
                                    "{state.proposal.ritual || "Generando ritual..."}"
                                </p>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <Icon svg={ICONS.sparkles} className="w-8 h-8 text-fuchsia-300 mx-auto mb-2" />
                            <p className="text-[10px] text-slate-400">Genera una propuesta para ver el análisis de servicio.</p>
                        </div>
                    )}
                </div>
            </ChampionColumn>
        </div>
    );
};
