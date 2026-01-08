import React from 'react';
import { PageName, StockItem, UserProfile } from '../types';
import AnimatedPage from '../components/AnimatedPage';
import NeuCard from '../components/NeuCard';
import NeuButton from '../components/NeuButton';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioStock: React.FC<Props> = ({ onNavigate }) => {
    const stockItems: StockItem[] = [
        { id: '1', name: 'Vodka Premium', current: 2, min: 5, unit: 'botellas', supplier: 'Dist. Nacional', price: 45.00 },
        { id: '2', name: 'Lima Fresca', current: 15, min: 20, unit: 'kg', supplier: 'Frutas Locales', price: 2.50 },
        { id: '3', name: 'Sirope de Agave', current: 4, min: 4, unit: 'botellas', supplier: 'Import. Bio', price: 12.00 },
    ];

    return (
        <AnimatedPage className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* 1. Header (Red Title) */}
            <header className="px-6 pt-6 pb-2">
                <h1 className="text-2xl font-black text-rose-500 tracking-tight mb-4">Stock</h1>

                {/* Tab Bar */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioRecipes)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Recipes
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioStock)} variant="pressed" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-rose-500 bg-rose-50/50">
                        Stock
                    </NeuButton>
                    <NeuButton onClick={() => onNavigate(PageName.GrimorioMarket)} variant="flat" className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shrink-0 text-neu-sec">
                        Market
                    </NeuButton>
                </div>
            </header>

            {/* 2. Content */}
            <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-4 space-y-4 pb-32">

                {/* Alert Card */}
                <NeuCard className="p-4 rounded-2xl flex items-center justify-between border-l-4 border-l-rose-500 bg-rose-50/20" delay={0.1}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full neu-pressed text-rose-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-xl">warning</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-neu-main text-xs">Critical Levels</h4>
                            <p className="text-[9px] text-neu-sec">3 items below minimum</p>
                        </div>
                    </div>
                    <NeuButton className="px-4 py-2 text-[9px] font-black text-rose-500 uppercase bg-white/50" variant="flat">
                        Review
                    </NeuButton>
                </NeuCard>

                <div className="space-y-4">
                    {stockItems.map((item, i) => {
                        const isLow = item.current <= item.min;
                        return (
                            <NeuCard key={item.id} className="p-5 rounded-[2rem]" delay={0.2 + (i * 0.1)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-neu-main text-lg">{item.name}</h4>
                                        <p className="text-[10px] text-neu-sec font-bold uppercase tracking-wider">{item.supplier} • ${item.price}/{item.unit}</p>
                                    </div>
                                    <div className={`text-right ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        <span className="block text-2xl font-black">{item.current}</span>
                                        <span className="text-[8px] font-black uppercase">Current</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="h-2 w-full neu-pressed rounded-full mb-4 overflow-hidden">
                                    <div
                                        style={{ width: `${Math.min((item.current / item.min) * 50, 100)}%` }}
                                        className={`h-full rounded-full ${isLow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                    ></div>
                                </div>

                                <div className="flex gap-3">
                                    <NeuButton className="flex-1 py-3 text-[10px] font-black uppercase text-neu-sec hover:text-rose-500">
                                        Adjust
                                    </NeuButton>
                                    <NeuButton className={`flex-1 py-3 text-[10px] font-black uppercase ${isLow ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        Reorder
                                    </NeuButton>
                                </div>
                            </NeuCard>
                        );
                    })}
                </div>
            </main>
        </AnimatedPage>
    );
};

export default GrimorioStock;
