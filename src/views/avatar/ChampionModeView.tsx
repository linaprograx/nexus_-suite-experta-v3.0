import React, { useState } from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';

// --- Components ---

const AvatarColumn = ({ title, children, accentColor = "bg-lime-500" }: { title: string, children?: React.ReactNode, accentColor?: string }) => (
    <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* Transparent Header */}
        <div className="pb-4 flex justify-between items-center px-2">
            <h3 className="font-bold text-lime-900 tracking-wide text-xs uppercase flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${accentColor} shadow-[0_0_10px_rgba(132,204,22,0.5)]`}></span>
                {title}
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 relative px-2 pb-2">
            {children}
        </div>
    </div>
);

// High-Tech "Champion" Card Style (Olive/Lime Theme)
const ChampionCard = ({ children, className = "", active = false }: { children: React.ReactNode, className?: string, active?: boolean }) => (
    <div className={`
        rounded-xl backdrop-blur-md transition-all duration-300
        ${active
            ? 'bg-lime-500/20 border border-lime-400 shadow-[0_0_20px_rgba(132,204,22,0.2)]'
            : 'bg-white/50 border border-lime-900/10 hover:bg-lime-50 hover:border-lime-500/30'}
        ${className}
    `}>
        {children}
    </div>
);

const ChampionModeView: React.FC = () => {
    return (
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 text-lime-900">

            {/* Column 1: Competition Brief */}
            <AvatarColumn title="Brief de Competición">
                <div className="space-y-4">
                    <ChampionCard className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-400 to-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-lime-500/30">
                            <Icon svg={ICONS.award} className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-lime-800 uppercase tracking-tight">World Class 2024</h2>
                            <p className="text-xs font-bold text-lime-600 uppercase tracking-widest mt-1">Fase Regional: "Botanical Future"</p>
                        </div>
                        <div className="p-3 bg-lime-100 rounded-lg border border-lime-200">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold text-lime-700 uppercase">Tiempo Restante</span>
                                <Icon svg={ICONS.clock} className="w-4 h-4 text-lime-600" />
                            </div>
                            <span className="text-2xl font-mono font-bold text-lime-800">14:02:59</span>
                        </div>
                    </ChampionCard>

                    <ChampionCard className="p-4">
                        <h4 className="text-xs font-bold text-lime-800 uppercase mb-3 flex items-center gap-2">
                            <Icon svg={ICONS.list} className="w-4 h-4" /> Requisitos Obligatorios
                        </h4>
                        <ul className="space-y-2">
                            {['Min. 2 Ingredientes Caseros', 'Uso de Técnica "Fat Wash"', 'Sin Azúcar Añadido', 'Vaso Highball'].map((item, i) => (
                                <li key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700">
                                    <div className="w-4 h-4 rounded-full border border-lime-500 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-lime-500"></div>
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </ChampionCard>
                </div>
            </AvatarColumn>

            {/* Column 2: Design Canvas */}
            <AvatarColumn title="Lienzo de Diseño">
                <ChampionCard className="h-full flex flex-col justify-center items-center p-8 border-dashed border-2 border-lime-300 bg-white/30 hover:bg-white/50 group cursor-pointer transition-all">
                    <div className="w-20 h-20 rounded-full bg-lime-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <Icon svg={ICONS.flask} className="w-10 h-10 text-lime-600" />
                    </div>
                    <h3 className="text-lg font-bold text-lime-800 mb-2">Diseñar Nuevo Cocktail</h3>
                    <p className="text-xs text-center text-slate-500 max-w-[200px]">
                        Inicia el asistente de creación molecular para generar tu propuesta basada en los requisitos.
                    </p>
                    <button
                        onClick={() => console.log('[Champion Mode] Comenzar diseño clicado')}
                        className="mt-6 px-6 py-2 bg-lime-500 hover:bg-lime-400 text-white font-bold rounded-lg shadow-lg shadow-lime-500/20 transition-all text-xs uppercase tracking-wider"
                    >
                        Comenzar Diseño
                    </button>
                </ChampionCard>
            </AvatarColumn>

            {/* Column 3: Performance Analysis */}
            <AvatarColumn title="Simulación de Jurado">
                <div className="space-y-4">
                    <ChampionCard className="p-4">
                        <h4 className="text-xs font-bold text-lime-800 uppercase mb-4 flex items-center gap-2">
                            <Icon svg={ICONS.star} className="w-4 h-4" /> Criterios de Evaluación
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Balance de Sabor', score: 8.5 },
                                { label: 'Presentación Visual', score: 9.2 },
                                { label: 'Storytelling', score: 7.8 },
                                { label: 'Técnica', score: 8.9 }
                            ].map((crit, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                        <span>{crit.label}</span>
                                        <span className="text-lime-600">{crit.score}/10</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-lime-500 rounded-full"
                                            style={{ width: `${crit.score * 10}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ChampionCard>

                    <ChampionCard className="p-4 bg-lime-500/10 border-lime-400/50">
                        <h4 className="text-xs font-bold text-lime-800 uppercase mb-2">Comentario de IA</h4>
                        <p className="text-[11px] font-medium text-slate-600 italic">
                            "Tu propuesta 'Nebula Fizz' tiene una puntuación proyectada de 92/100. El uso de té macha eleva la complejidad, pero cuidado con la dilución si usas hielo estándar."
                        </p>
                    </ChampionCard>
                </div>
            </AvatarColumn>

        </div>
    );
};

export default ChampionModeView;
