import React, { useState } from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { ChampionCreativePanel } from '../ChampionCreativePanel';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionCreativeView: React.FC = () => {
    const { state, actions } = useChampionContext();
    const [isAddingRef, setIsAddingRef] = useState(false);
    const [newRefText, setNewRefText] = useState('');

    const handleAddRef = () => {
        if (newRefText.trim()) {
            actions.toggleVisualRef(newRefText);
            setNewRefText('');
            setIsAddingRef(false);
        }
    };

    return (
        <div className="h-full w-full grid grid-cols-1 grid-rows-3 xl:grid-cols-[20fr_60fr_20fr] xl:grid-rows-1 gap-4 overflow-hidden">
            {/* COLUMN 1: INSPIRATION & MOOD */}
            <ChampionColumn
                title="Inspiración"
                accentColor="bg-violet-400/20 text-violet-200"
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
                                    className={`aspect-square rounded-lg shadow-sm cursor-pointer hover:scale-110 transition-transform ring-2 ${state.palette === color ? 'ring-violet-500 scale-105' : 'ring-white/10'}`}
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
                                        className={`p-3 rounded-xl border shadow-sm flex items-center justify-between group cursor-pointer transition-all ${isActive ? 'bg-violet-500/20 border-violet-500/50' : 'bg-white/5 border-white/10 hover:border-violet-500/30'}`}
                                        onClick={() => actions.toggleVisualRef(ref)}
                                    >
                                        <span className={`text-xs font-bold ${isActive ? 'text-violet-300' : 'text-slate-400'}`}>{ref}</span>
                                        <Icon svg={ICONS.image} className={`w-3 h-3 ${isActive ? 'text-violet-400' : 'text-slate-500'} group-hover:text-violet-400`} />
                                    </div>
                                );
                            })}

                            {/* Inline Input for New Ref */}
                            {isAddingRef ? (
                                <div className="p-2 bg-slate-900/50 border border-white/10 rounded-xl animate-in fade-in slide-in-from-top-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newRefText}
                                        onChange={e => setNewRefText(e.target.value)}
                                        placeholder="Ej: Neon Noir..."
                                        className="w-full bg-transparent text-white text-xs font-bold placeholder-slate-600 focus:outline-none mb-2 px-1"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleAddRef();
                                            if (e.key === 'Escape') setIsAddingRef(false);
                                        }}
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsAddingRef(false)} className="flex-1 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] uppercase text-slate-400">Cancel</button>
                                        <button onClick={handleAddRef} className="flex-1 py-1 bg-violet-600 hover:bg-violet-500 rounded text-[9px] uppercase text-white font-bold">Add</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    className="w-full py-2 border border-dashed border-slate-700 rounded-lg text-[10px] uppercase font-bold text-slate-500 hover:text-violet-400 hover:border-violet-500/30 transition-colors hover:bg-white/5"
                                    onClick={() => setIsAddingRef(true)}
                                >
                                    + Agregar Ref
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 2: MAIN WORKSPACE (Existing Creative Panel) */}
            <ChampionColumn
                title="Motor Creativo"
                accentColor="bg-violet-600/20 text-violet-200"
                scrollable
            >
                <div className="p-6">
                    {/* Panel Wrapper for Theme Context if needed */}
                    <div className="bg-slate-800/30 rounded-2xl border border-white/5 overflow-hidden">
                        <ChampionCreativePanel />
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 3: SERVICE EXPERIENCE (Refined) */}
            <ChampionColumn
                title="Experiencia de Servicio"
                accentColor="bg-fuchsia-500/20 text-fuchsia-200"
                scrollable
            >
                <div className="p-4 space-y-6">
                    {state.proposal ? (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            {/* GLASSWARE */}
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center mb-3 shadow-inner border border-white/5">
                                    <Icon svg={ICONS.layout} className="w-8 h-8 text-slate-400" />
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cristalería</h4>
                                <p className="text-sm font-bold text-white">{state.proposal.glassware || "N/A"}</p>
                            </div>

                            {/* GARNISH */}
                            <div className="bg-slate-800/50 p-5 rounded-[20px] border border-white/5 shadow-sm relative overflow-hidden group hover:border-fuchsia-500/30 transition-colors">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-500/10 rounded-bl-[40px] -mr-4 -mt-4 z-0 pointer-events-none" />
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                                    <Icon svg={ICONS.image} className="w-3 h-3" />
                                    Garnish
                                </h4>
                                <div className="relative z-10">
                                    <p className="text-sm font-black text-fuchsia-400 mb-2">
                                        {typeof state.proposal.garnish === 'object' ? state.proposal.garnish.name : (state.proposal.garnish || "Sin Garnish")}
                                    </p>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                        "{typeof state.proposal.garnish === 'object' ? state.proposal.garnish.description : "Detalle no disponible."}"
                                    </p>
                                </div>
                            </div>

                            {/* SERVICE RITUAL - HERO */}
                            <div className="bg-gradient-to-br from-slate-900 to-black p-6 rounded-[24px] text-white shadow-xl shadow-slate-900/50 relative overflow-hidden border border-white/10">
                                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-900/20 to-purple-900/20 pointer-events-none" />
                                <Icon svg={ICONS.sparkles} className="w-24 h-24 text-white/5 absolute -bottom-4 -right-4 rotate-12" />

                                <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4 relative z-10">Ritual de Servicio</h4>
                                <p className="text-xs font-medium text-white/80 leading-loose relative z-10 italic">
                                    "{state.proposal.ritual || "Generando ritual..."}"
                                </p>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <Icon svg={ICONS.sparkles} className="w-8 h-8 text-fuchsia-400 mx-auto mb-2" />
                            <p className="text-[10px] text-slate-400">Genera una propuesta para ver el análisis de servicio.</p>
                        </div>
                    )}
                </div>
            </ChampionColumn>
        </div>
    );
};
