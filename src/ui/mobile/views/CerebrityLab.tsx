import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { CerebrityHeader } from '../components/CerebrityHeader';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityLab: React.FC<Props> = ({ onNavigate }) => {
    // Mock compositions
    const activeComps = [
        { name: 'Botanical Fusion', ingredients: 5, status: 'In Progress', progress: 65 },
        { name: 'Tropical Blend', ingredients: 4, status: 'Testing', progress: 85 },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <CerebrityHeader
                currentPage={PageName.CerebrityLab}
                onNavigate={onNavigate}
            />

            {/* View Title Overlay */}
            <div className="px-7 -mt-2 mb-4 relative z-10">
                <h2 className="text-4xl font-black text-white tracking-tighter leading-none opacity-80 uppercase">
                    The Lab
                </h2>
                <p className="text-xs text-white/50 mt-1 font-bold uppercase tracking-widest opacity-60">
                    Molecular Synthesis
                </p>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* New Composition Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-fuchsia-50 to-transparent">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-fuchsia-600 flex items-center justify-center text-white shadow-xl action-glow-pink">
                            <span className="material-symbols-outlined text-3xl fill-1">science</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 mb-1">Nuevo Experimento</h3>
                            <p className="text-xs text-zinc-600">Mezcla ingredientes algorítmicamente</p>
                        </div>
                    </div>

                    <PremiumButton
                        customColor="#F000FF"
                        customGradient="linear-gradient(135deg, #F000FF 0%, #6200EE 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        icon={<span className="material-symbols-outlined !text-base">add_circle</span>}
                        iconPosition="right"
                    >
                        INICIAR EXPERIMENTO
                    </PremiumButton>
                </GlassCard>

                {/* Active Compositions */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Composiciones Activas</h3>
                    {activeComps.map((comp, i) => (
                        <GlassCard
                            key={i}
                            rounded="3xl"
                            padding="md"
                            className="mb-3"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-zinc-900 mb-1">{comp.name}</h4>
                                    <p className="text-xs text-zinc-500">{comp.ingredients} ingredients • {comp.status}</p>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-fuchsia-600 fill-1">circle</span>
                                </div>
                            </div>

                            {/* Progress */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Progreso</span>
                                    <span className="text-[10px] font-black text-fuchsia-600">{comp.progress}%</span>
                                </div>
                                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                                    <div
                                        className="bg-fuchsia-600 h-1.5 rounded-full transition-all"
                                        style={{ width: `${comp.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-[0.4] py-3 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                    Ver
                                </button>
                                <PremiumButton
                                    customColor="#F000FF"
                                    variant="secondary"
                                    size="md"
                                    className="flex-1"
                                >
                                    Continuar
                                </PremiumButton>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CerebrityLab;
