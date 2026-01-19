import React, { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../../components/GlassCard';
import PremiumButton from '../../components/PremiumButton';
import { AvatarConfig } from '../../../../hooks/useAvatarCognition';
import { AvatarHeader } from '../../components/AvatarHeader';
import { PageName } from '../../types';

interface Props {
    config: AvatarConfig;
    accentColor: string;
}

const AvatarIntelligence: React.FC<Props> = ({ config, accentColor }) => {
    const [mode, setMode] = useState<'Standard' | 'Competition'>('Standard');
    const [pressure, setPressure] = useState(50);

    return (
        <div className="space-y-6">
            <AvatarHeader currentPage={PageName.AvatarIntelligence} />
            {/* Header / Mode Toggle */}
            <div className="flex bg-transparent p-1 mx-4 gap-2">
                <button
                    onClick={() => setMode('Standard')}
                    className={`flex-1 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'Standard' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white/40 text-zinc-500 border border-white/40'
                        }`}
                >
                    Servicio Estándar
                </button>
                <button
                    onClick={() => setMode('Competition')}
                    className={`flex-1 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'Competition' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-white/40 text-zinc-500 border border-white/40'
                        }`}
                >
                    Modo Competición
                </button>
            </div>

            {/* Cognitive Dial Section */}
            <div className="flex flex-col items-center justify-center py-6 bg-gradient-to-b from-red-950/10 to-transparent rounded-[3rem] border border-black/5">
                <div className="relative w-48 h-48 flex items-center justify-center">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full border-[10px] border-black/5 shadow-inner"></div>
                    <div className="absolute inset-0 rounded-full border-[2px] border-red-500/10"></div>

                    {/* The Dial itself */}
                    <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center shadow-2xl relative z-10">
                        <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1">Tono Cognitivo</span>
                        <span className="text-xl font-black text-zinc-900 uppercase">Eficiente</span>
                        <div className="mt-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[7px] font-black uppercase tracking-tighter flex items-center gap-1">
                            <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                            COSTE
                        </div>
                    </div>

                    {/* Accent Glow */}
                    <div className="absolute -bottom-2 w-1/2 h-4 bg-red-600/20 blur-xl rounded-full"></div>
                </div>

                {/* Sub-metrics */}
                <div className="flex gap-10 mt-6">
                    <div className="text-center">
                        <p className="text-[7px] font-black text-red-950/60 uppercase tracking-widest mb-1">Precisión</p>
                        <p className="text-sm font-black text-red-950">94.2%</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[7px] font-black text-red-950/60 uppercase tracking-widest mb-1">Creatividad</p>
                        <p className="text-sm font-black text-red-950">88.5%</p>
                    </div>
                </div>
            </div>

            {/* Principles Section */}
            <div>
                <h3 className="text-[10px] font-black text-red-950/70 uppercase tracking-widest mb-3 px-2">Principios Activos</h3>
                <div className="space-y-2">
                    {config.activePrinciples.map((principle, idx) => (
                        <GlassCard key={principle} rounded="2xl" padding="md" className="flex items-center justify-between border-black/5 bg-white/40 shadow-sm">
                            <span className="text-xs font-black text-red-950 uppercase tracking-tight">{principle}</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                        </GlassCard>
                    ))}
                    <GlassCard rounded="2xl" padding="md" className="border-black/5 bg-white/10 opacity-40">
                        <span className="text-xs font-black text-red-950/40 uppercase tracking-tight">Impacto Visual</span>
                    </GlassCard>
                </div>
            </div>

            {/* Decision Simulator */}
            <GlassCard rounded="3xl" padding="lg" className="bg-red-950/10 border-red-950/5 shadow-sm">
                <h3 className="text-[10px] font-black text-red-950/80 uppercase tracking-widest mb-6">Simulador de Decisión</h3>

                <div className="space-y-6">
                    <div>
                        <p className="text-[8px] font-black text-red-950/60 uppercase tracking-widest mb-3">Contexto</p>
                        <div className="flex flex-wrap gap-2">
                            {['SERVICE', 'COMPETITION', 'R&D', 'CRISIS'].map(tag => (
                                <button key={tag} className={`px-3 py-1.5 rounded-lg text-[8px] font-black border transition-all ${tag === 'SERVICE' ? 'bg-red-950 border-red-900 text-white' : 'bg-white/40 border-black/10 text-red-950/60'
                                    }`}>
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[8px] font-black text-red-950/60 uppercase tracking-widest">Presión</p>
                            <span className="text-[10px] font-black text-red-950">{pressure}%</span>
                        </div>
                        <input
                            type="range"
                            min="0" max="100"
                            value={pressure}
                            onChange={(e) => setPressure(parseInt(e.target.value))}
                            className="w-full h-1 bg-black/10 rounded-full appearance-none accent-red-950"
                        />
                    </div>

                    <button className="w-full py-3 bg-red-950 text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-900 transition-all group shadow-md">
                        Ejecutar Simulación
                        <span className="material-symbols-outlined !text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>

                    <div className="bg-white/60 rounded-2xl p-4 font-mono text-[9px] text-red-950/70 min-h-[80px] border border-black/5 shadow-inner">
                        <span className="opacity-60">{">"}</span> Esperando parámetros de simulación...
                    </div>
                </div>
            </GlassCard>
        </div>
    );
};

export default AvatarIntelligence;

