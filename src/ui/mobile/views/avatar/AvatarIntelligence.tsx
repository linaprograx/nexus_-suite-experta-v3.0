import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarConfig, useAvatarCognition, Tone, ResearchAxis, RiskLevel } from '../../../../hooks/useAvatarCognition';
import { AvatarHeader } from '../../components/AvatarHeader';
import { PageName } from '../../types';
import { Icon } from '../../../../components/ui/Icon';
import { ICONS } from '../../../../components/ui/icons';

interface Props {
    config: AvatarConfig;
    accentColor: string;
}

const AvatarIntelligence: React.FC<Props> = ({ config }) => {
    const { activeAvatarType, getActiveProfile, updateActiveProfile, togglePrinciple, toggleResearchAxis } = useAvatarCognition();
    const activeProfile = getActiveProfile();

    const [isSimulating, setIsSimulating] = useState(false);
    const [simResult, setSimResult] = useState<string | null>(null);

    const handleSimulation = () => {
        setIsSimulating(true);
        setTimeout(() => {
            setSimResult("Decisión Óptima: Proceder con cautela. Riesgo calculado dentro de parámetros aceptables.");
            setIsSimulating(false);
        }, 2000);
    };

    if (!activeProfile) return <div className="p-8 text-center text-white/50">Perfil no activo</div>;

    return (
        <div className="space-y-6 pb-32">
            <AvatarHeader currentPage={PageName.AvatarIntelligence} />

            {/* MAIN VISUAL CORE - Desktop Parity */}
            <div className="relative px-4">
                <div className="relative w-full aspect-square max-w-[320px] mx-auto flex items-center justify-center">
                    {/* Orbitals - Rose Theme */}
                    <div className="absolute inset-0 rounded-full border border-rose-500/10 scale-[1.2] animate-[spin_40s_linear_infinite]" />
                    <div className="absolute inset-4 rounded-full border border-rose-500/20 scale-100 animate-[spin_20s_linear_infinite_reverse]" />
                    <div className="absolute inset-12 rounded-full border border-rose-500/5 border-t-rose-500/30 animate-[spin_10s_linear_infinite]" />

                    {/* Core Nucleus */}
                    <div className="relative z-10 w-48 h-48 rounded-full bg-[#0f0406]/80 backdrop-blur-xl border border-rose-500/30 shadow-[0_0_60px_rgba(225,29,72,0.15)] flex flex-col items-center justify-center text-center p-4">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500/10 to-transparent animate-pulse pointer-events-none" />

                        <span className="text-[9px] font-black text-rose-300/60 uppercase tracking-widest mb-1">Tono Cognitivo</span>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 drop-shadow-lg leading-none">
                            {activeProfile.tone}
                        </h2>

                        <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span className="text-[8px] font-bold text-rose-200 uppercase tracking-widest">
                                {activeProfile.researchAxis[0] || 'GENERAL'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="flex justify-center gap-8 mt-[-20px] relative z-20">
                    <div className="text-center">
                        <span className="text-[8px] font-black text-rose-300/40 uppercase tracking-widest block mb-1">Precisión</span>
                        <span className="text-lg font-mono text-rose-100 font-bold">94.2%</span>
                    </div>
                    <div className="text-center">
                        <span className="text-[8px] font-black text-rose-300/40 uppercase tracking-widest block mb-1">Creatividad</span>
                        <span className="text-lg font-mono text-rose-100 font-bold">88.5%</span>
                    </div>
                </div>
            </div>

            {/* CONTROLS STACK */}
            <div className="px-4 space-y-4">
                {/* Mode Selector */}
                <div className="bg-[#0f0406]/60 border border-rose-500/10 rounded-3xl p-1 flex">
                    {['Standard', 'Competition'].map(m => (
                        <button
                            key={m}
                            className={`flex-1 py-3 rounded-[1.3rem] text-[9px] font-black uppercase tracking-widest transition-all ${true ? 'bg-rose-500/10 text-rose-100' : 'text-rose-500/40' // Dummy logic for now
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Principles Card */}
                <div className="bg-[#0f0406]/80 backdrop-blur-md border border-rose-500/20 rounded-[2rem] p-6 shadow-lg shadow-rose-900/10">
                    <h3 className="text-xs font-black text-rose-200/50 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <Icon svg={ICONS.activity} className="w-3 h-3 text-rose-500" />
                        Principios Activos
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
                        {['Técnica > Narrativa', 'Minimalismo Radical', 'Eficacia de Coste', 'Impacto Visual'].map((p, i) => {
                            const isActive = activeProfile.activePrinciples.includes('p' + (i + 1)); // Simplified mapping
                            return (
                                <div key={p} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${isActive
                                        ? 'bg-rose-500/10 border-rose-500/30'
                                        : 'bg-white/5 border-transparent opacity-50'
                                    }`}>
                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-rose-100' : 'text-slate-500'}`}>{p}</span>
                                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_currentColor]" />}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Simulation Card */}
                <div className="bg-gradient-to-br from-[#0f0406] to-rose-950/20 backdrop-blur-md border border-rose-500/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[50px] rounded-full pointer-events-none" />

                    <h3 className="text-xs font-black text-rose-200/50 uppercase tracking-[0.2em] mb-6 relative z-10">Simulador de Decisión</h3>

                    <div className="flex flex-col gap-4 relative z-10">
                        <button
                            onClick={handleSimulation}
                            disabled={isSimulating}
                            className="w-full py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            {isSimulating ? <span className="animate-spin text-lg">⟳</span> : <Icon svg={ICONS.play} className="w-4 h-4" />}
                            {isSimulating ? 'Procesando...' : 'Ejecutar Simulación'}
                        </button>

                        {simResult && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/40 border border-rose-500/20 rounded-xl p-4"
                            >
                                <p className="text-[10px] text-rose-200 font-mono leading-relaxed">
                                    <span className="text-rose-500 mr-2">{">"}</span>
                                    {simResult}
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AvatarIntelligence;

