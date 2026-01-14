import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { CerebrityHeader } from '../components/CerebrityHeader';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityCritic: React.FC<Props> = ({ onNavigate }) => {
    // Mock critique logs
    const critiques = [
        {
            recipe: 'Mojito Classic',
            score: 8.5,
            feedback: 'Excellent balance, consider premium rum upgrade',
            date: '2h ago',
            severity: 'minor'
        },
        {
            recipe: 'Negroni Variant',
            score: 6.2,
            feedback: 'Ratio needs adjustment. Sweetness overpowers bitter notes',
            date: '5h ago',
            severity: 'major'
        },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <CerebrityHeader
                currentPage={PageName.CerebrityCritic}
                onNavigate={onNavigate}
            />

            {/* View Title Overlay */}
            <div className="px-7 -mt-2 mb-4 relative z-10">
                <h2 className="text-4xl font-black text-white tracking-tighter leading-none opacity-80 uppercase">
                    The Critic
                </h2>
                <p className="text-xs text-white/50 mt-1 font-bold uppercase tracking-widest opacity-60">
                    Proprietary Algorithm
                </p>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* Invoke Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-cyan-50 to-transparent">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-cyan-600 flex items-center justify-center text-white shadow-xl action-glow-turquoise">
                            <span className="material-symbols-outlined text-3xl fill-1">rate_review</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 mb-1">Invocar Crítico</h3>
                            <p className="text-xs text-zinc-600">Obtén retroalimentación profesional</p>
                        </div>
                    </div>

                    <PremiumButton
                        customColor="#00E5FF"
                        customGradient="linear-gradient(135deg, #00E5FF 0%, #0097A7 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        icon={<span className="material-symbols-outlined !text-base">psychology</span>}
                        iconPosition="right"
                    >
                        ENVIAR PARA REVISIÓN
                    </PremiumButton>
                </GlassCard>

                {/* Critique Log */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Críticas Recientes</h3>
                    {critiques.map((item, i) => (
                        <GlassCard
                            key={i}
                            rounded="3xl"
                            padding="md"
                            className="mb-3"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-lg font-bold text-zinc-900">{item.recipe}</h4>
                                        <span className={`text-2xl font-black ${item.score >= 8 ? 'text-emerald-600' : item.score >= 7 ? 'text-cyan-600' : 'text-amber-600'}`}>
                                            {item.score}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-600 mb-2">{item.feedback}</p>
                                    <span className="text-[9px] text-zinc-400">{item.date}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-wide ${item.severity === 'major' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                                    }`}>
                                    {item.severity}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 py-3 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors">
                                    Ver Reporte Completo
                                </button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CerebrityCritic;
