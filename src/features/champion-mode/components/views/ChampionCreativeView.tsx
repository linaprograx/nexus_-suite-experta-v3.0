import React, { useState } from 'react';
import { ChampionColumn } from '../shared/ChampionColumn';
import { ChampionCreativePanel } from '../ChampionCreativePanel';
import { useChampionContext } from '../../context/ChampionContext';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

export const ChampionCreativeView: React.FC = () => {
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
                                <div key={color} className="aspect-square rounded-lg shadow-sm cursor-pointer hover:scale-110 transition-transform ring-2 ring-white" style={{ backgroundColor: color }} />
                            ))}
                        </div>
                    </div>

                    {/* Visual Tags */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Referencias Visuales</h4>
                        <div className="space-y-3">
                            {['Minimalismo Japonés', 'Art Deco', 'Cyberpunk', 'Naturaleza Muerta'].map(ref => (
                                <div key={ref} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group cursor-pointer hover:border-violet-300">
                                    <span className="text-xs font-bold text-slate-600">{ref}</span>
                                    <Icon svg={ICONS.image} className="w-3 h-3 text-slate-300 group-hover:text-violet-500" />
                                </div>
                            ))}
                            <button
                                className="w-full py-2 border border-dashed border-slate-300 rounded-lg text-[10px] uppercase font-bold text-slate-400 hover:text-violet-500 hover:border-violet-300 transition-colors"
                                onClick={() => alert("Función de carga de imágenes en desarrollo. Próximamente.")}
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

            {/* COLUMN 3: STORYTELLING */}
            <ChampionColumn
                title="Narrativa"
                accentColor="bg-fuchsia-500"
                scrollable
            >
                <div className="p-4 space-y-6">
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Origen & Concepto</h4>
                        <textarea
                            className="w-full h-32 bg-fuchsia-50/30 border border-fuchsia-100 rounded-xl p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/20"
                            placeholder="¿Cuál es la semilla de esta idea?..."
                        />
                    </div>

                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Perfil de Sabor</h4>
                        <div className="space-y-2">
                            {['Aroma', 'Ataque', 'Cuerpo', 'Final'].map(step => (
                                <div key={step} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 w-12">{step}</span>
                                    <input type="range" className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-fuchsia-500" />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ritual de Servicio</h4>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                            <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4">
                                <li>Ahumar copa con romero</li>
                                <li>Servir sobre bloque hielo</li>
                                <li>Atomizar essence de bergamota</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </ChampionColumn>
        </div>
    );
};
