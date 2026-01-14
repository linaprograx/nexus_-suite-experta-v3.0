import React, { useState } from 'react';
import { PageName, UserProfile } from '../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { CerebrityHeader } from '../components/CerebrityHeader';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const CerebrityTrend: React.FC<Props> = ({ onNavigate }) => {
    // Mock trends
    const trends = [
        { name: 'Low-ABV Cocktails', growth: '+245%', category: 'Health Conscious', hot: true },
        { name: 'Mezcal Renaissance', growth: '+180%', category: 'Spirits', hot: true },
        { name: 'Botanical Infusions', growth: '+95%', category: 'Ingredients', hot: false },
        { name: 'Clarified Milk Punch', growth: '+67%', category: 'Technique', hot: false },
    ];

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <CerebrityHeader
                currentPage={PageName.CerebrityTrend}
                onNavigate={onNavigate}
            />

            {/* View Title Overlay */}
            <div className="px-7 -mt-2 mb-4 relative z-10">
                <h2 className="text-4xl font-black text-white tracking-tighter leading-none opacity-80 uppercase">
                    Trend Locator
                </h2>
                <p className="text-xs text-white/50 mt-1 font-bold uppercase tracking-widest opacity-60">
                    Real-time Market Intel
                </p>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* Search Card */}
                <GlassCard rounded="3xl" padding="xl" className="bg-gradient-to-r from-amber-50 to-transparent">
                    <div className="flex items-center gap-5 mb-5">
                        <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center text-white shadow-xl action-glow-gold">
                            <span className="material-symbols-outlined text-3xl fill-1">trending_up</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-zinc-900 mb-1">Descubrir Tendencias</h3>
                            <p className="text-xs text-zinc-600">Análisis de mercado global</p>
                        </div>
                    </div>

                    <div className="mb-4" style={{
                        background: 'rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        borderRadius: '1rem',
                        overflow: 'hidden'
                    }}>
                        <input
                            type="text"
                            placeholder="Buscar tendencias..."
                            className="w-full bg-transparent py-4 px-5 text-sm font-bold text-zinc-900 placeholder:text-zinc-500 outline-none"
                        />
                    </div>

                    <PremiumButton
                        customColor="#FFD700"
                        customGradient="linear-gradient(135deg, #FFD700 0%, #D97706 100%)"
                        variant="gradient"
                        size="lg"
                        fullWidth
                        icon={<span className="material-symbols-outlined !text-base">search</span>}
                        iconPosition="right"
                    >
                        BUSCAR TENDENCIAS
                    </PremiumButton>
                </GlassCard>

                {/* Trending Now */}
                <div>
                    <h3 className="text-xs font-black text-white/80 uppercase tracking-wider mb-3 px-2">Tendencias Ahora</h3>
                    {trends.map((trend, i) => (
                        <GlassCard
                            key={i}
                            rounded="3xl"
                            padding="md"
                            className="mb-3"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="text-lg font-bold text-zinc-900">{trend.name}</h4>
                                        {trend.hot && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-[8px] font-black uppercase tracking-wide flex items-center gap-1">
                                                <span className="material-symbols-outlined !text-xs fill-1">local_fire_department</span>
                                                HOT
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500 mb-2">{trend.category}</p>
                                    <span className="text-sm font-black text-emerald-600">{trend.growth}</span>
                                </div>
                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-amber-600 fill-1">arrow_upward</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default CerebrityTrend;
