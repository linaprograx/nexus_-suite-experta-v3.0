import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ChampionColumn } from '../shared/ChampionColumn';
import { ChampionCreativePanel } from '../ChampionCreativePanel';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';
import { getGlasswareIcon } from '../../../../components/ui/GlasswareIcons';

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
                            {/* Reference List */}
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
                        </div>

                        <div className="mt-4">
                            <button
                                className="w-full py-3 border border-dashed border-slate-600/50 rounded-xl text-[10px] uppercase font-bold text-slate-500 hover:text-violet-300 hover:border-violet-500/50 transition-colors hover:bg-white/5 flex items-center justify-center gap-2"
                                onClick={() => setIsAddingRef(true)}
                            >
                                <Icon svg={ICONS.plus} className="w-3 h-3" />
                                Agregar Referencia
                            </button>
                        </div>
                    </div>
                </div>
            </ChampionColumn>

            {/* PORTAL MODAL FOR NEW REF */}
            {isAddingRef && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-slate-900/10" onClick={() => setIsAddingRef(false)} />
                    <div className="w-full max-w-sm bg-white/95 border border-white/60 rounded-[30px] shadow-2xl p-8 transform animate-in zoom-in-95 duration-200 backdrop-blur-xl relative z-10">

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 border border-violet-200 shadow-sm mx-auto mb-3">
                                <Icon svg={ICONS.image} className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-wider">Nueva Referencia</h3>
                            <p className="text-xs text-slate-500 font-medium mt-1">Añade un estilo visual o concepto artístico</p>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-bold text-center"
                                    placeholder="Ej: Neon Noir, Bauhaus, Vaporwave..."
                                    value={newRefText}
                                    onChange={e => setNewRefText(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddRef();
                                        if (e.key === 'Escape') setIsAddingRef(false);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => { setIsAddingRef(false); setNewRefText(''); }}
                                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddRef}
                                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-violet-500/30 transition-all"
                            >
                                Añadir
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* COLUMN 2: MAIN WORKSPACE (Existing Creative Panel) */}
            <ChampionColumn
                title="Motor Creativo"
                accentColor="bg-violet-600/20 text-violet-200"
                scrollable
            >
                <div className="p-6">
                    {/* Panel Wrapper for Theme Context if needed */}
                    <div className="rounded-2xl overflow-hidden h-full">
                        <ChampionCreativePanel />
                    </div>
                </div>
            </ChampionColumn>

            {/* COLUMN 3: SERVICE EXPERIENCE (Refined) */}
            <ChampionColumn
                title="Experiencia de Servicio"
                accentColor="bg-fuchsia-500/20 text-fuchsia-800"
                scrollable
            >
                <div className="p-4 space-y-6">
                    {state.proposal ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            {/* GLASSWARE */}
                            <div className="text-center p-4 bg-white/60 rounded-[20px] border border-white/40 shadow-sm">
                                <div className="w-16 h-16 mx-auto mb-3 relative flex items-center justify-center">
                                    <div className="w-14 h-14 bg-fuchsia-100 rounded-full flex items-center justify-center text-fuchsia-600 border border-fuchsia-200 shadow-inner">
                                        <svg
                                            viewBox="0 0 24 24"
                                            width="32"
                                            height="32"
                                            className="w-8 h-8 opacity-80"
                                            dangerouslySetInnerHTML={{ __html: getGlasswareIcon(state.proposal.glassware || "") }}
                                        />
                                    </div>
                                </div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cristalería</h4>
                                <p className="text-sm font-black text-slate-800 leading-tight">{state.proposal.glassware || "N/A"}</p>
                            </div>

                            {/* GARNISH */}
                            <div className="bg-white p-5 rounded-[20px] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-fuchsia-300 transition-colors">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-fuchsia-50 rounded-bl-[40px] -mr-4 -mt-4 z-0 pointer-events-none" />
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10 flex items-center gap-2">
                                    <Icon svg={ICONS.image} className="w-3 h-3 text-fuchsia-400" />
                                    Garnish
                                </h4>
                                <div className="relative z-10">
                                    <p className="text-sm font-black text-slate-800 mb-2 leading-tight">
                                        {typeof state.proposal.garnish === 'object' ? state.proposal.garnish.name : (state.proposal.garnish || "Sin Garnish")}
                                    </p>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        "{typeof state.proposal.garnish === 'object' ? state.proposal.garnish.description : "Detalle no disponible."}"
                                    </p>
                                </div>
                            </div>

                            {/* SERVICE RITUAL - HERO */}
                            <div className="bg-gradient-to-br from-fuchsia-600 to-violet-600 p-6 rounded-[24px] text-white shadow-lg shadow-fuchsia-500/20 relative overflow-hidden border border-white/20">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay pointer-events-none" />
                                <Icon svg={ICONS.sparkles} className="w-24 h-24 text-white/10 absolute -bottom-4 -right-4 rotate-12" />

                                <h4 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4 relative z-10">Ritual de Servicio</h4>
                                <p className="text-xs font-bold text-white leading-loose relative z-10 italic">
                                    "{state.proposal.ritual || "Generando ritual..."}"
                                </p>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-10 opacity-70">
                            <Icon svg={ICONS.sparkles} className="w-10 h-10 text-fuchsia-400/80 mx-auto mb-3" />
                            <p className="text-xs text-slate-300 font-medium">Genera una propuesta para ver el análisis de servicio.</p>
                        </div>
                    )}
                </div>
            </ChampionColumn>
        </div>
    );
};
