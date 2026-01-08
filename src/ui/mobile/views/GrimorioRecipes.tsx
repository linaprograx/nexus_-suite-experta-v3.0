import React from 'react';
import { PageName, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioRecipes: React.FC<Props> = ({ onNavigate }) => {
    return (
        <AnimatedPage className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* 1. Header (Green Title) */}
            <header className="px-6 pt-6 pb-2">
                <h1 className="text-2xl font-black text-emerald-600 tracking-tight mb-4">Recipes</h1>

                {/* Tab Bar */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioRecipes)} variant="pressed" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-emerald-600 bg-emerald-50/50">
                        Recipes
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioStock)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Stock
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioMarket)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Market
                    </NeuButton>
                </div>
            </header>

            {/* 2. Content (Scrollable) */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-4 pb-32">

                <div className="relative mb-6">
                    <input
                        type="text"
                        placeholder="Search database..."
                        className="w-full neu-pressed py-4 pl-12 pr-4 rounded-2xl text-xs font-bold text-neu-main placeholder-neu-sec/50 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-neu-sec">search</span>
                </div>

                {[1, 2, 3].map((r, i) => (
                    <NeuCard key={r} className="p-0 rounded-[2rem] overflow-hidden" delay={i * 0.1}>
                        <div className="h-32 bg-slate-200 relative">
                            <img src={`https://picsum.photos/seed/recipe${r}/400/200`} className="w-full h-full object-cover" />
                            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase text-emerald-600 shadow-sm">
                                Verano 2025
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-lg font-black text-neu-main mb-1">Nebula Fizz {r}</h3>
                            <p className="text-[10px] text-neu-sec font-medium mb-4 uppercase tracking-wide">Gin • Citrus • Smoke</p>

                            <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-neu-sec uppercase">Cost</span>
                                    <span className="text-sm font-black text-neu-main">$2.40</span>
                                </div>
                                <NeuButton className="w-10 h-10 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200">
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </NeuButton>
                            </div>
                        </div>
                    </NeuCard>
                ))}
            </main>
        </AnimatedPage>
    );
};

export default GrimorioRecipes;
