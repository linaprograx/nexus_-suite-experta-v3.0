import React from 'react';
import { PageName, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioMarket: React.FC<Props> = ({ onNavigate }) => {
    return (
        <AnimatedPage className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* 1. Header (Amber Title) */}
            <header className="px-6 pt-6 pb-2">
                <h1 className="text-2xl font-black text-amber-500 tracking-tight mb-4">Market</h1>

                {/* Tab Bar */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioRecipes)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Recipes
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioStock)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Stock
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioMarket)} variant="pressed" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-amber-500 bg-amber-50/50">
                        Market
                    </NeuButton>
                </div>
            </header>

            {/* 2. Content */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-4 pb-32">

                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((item, i) => (
                        <NeuCard key={item} className="p-4 rounded-3xl flex flex-col gap-3 group cursor-pointer" delay={0.1 * i}>
                            <div className="w-full aspect-square rounded-2xl neu-pressed p-2 overflow-hidden relative">
                                <img src={`https://picsum.photos/seed/market${item}/200/200`} className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all duration-500" alt="Ingredient" />
                                <div className="absolute top-3 right-3 bg-amber-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-wide shadow-lg">
                                    Promo
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-neu-main text-sm leading-tight">Exotic Fruit Box</h4>
                                <p className="text-[9px] text-neu-sec mt-1 uppercase tracking-wider font-bold">Global Imports Ltd.</p>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-lg font-black text-neu-main">$85</span>
                                <NeuButton className="w-8 h-8 rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </NeuButton>
                            </div>
                        </NeuCard>
                    ))}
                </div>

            </main>
        </AnimatedPage>
    );
};

export default GrimorioMarket;
