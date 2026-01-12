import React, { useMemo, useState } from 'react';
import { PageName, UserProfile } from '../types';
import { Ingredient } from '../../../types';
import GlassCard from '../components/GlassCard';
import PremiumButton from '../components/PremiumButton';
import { useIngredients } from '../../../hooks/useIngredients';
import { useApp } from '../../../context/AppContext';
import { IngredientFormModal } from '../../../components/grimorium/IngredientFormModal';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioStock: React.FC<Props> = ({ onNavigate }) => {
    const { db, userId, appId } = useApp();
    const { ingredients, isLoading } = useIngredients();

    const [showIngredientModal, setShowIngredientModal] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    const stats = useMemo(() => {
        const total = ingredients.length;
        const lowStock = ingredients.filter(i => (i.stock || 0) <= (i.minStock || 0)).length;
        const criticalStock = ingredients.filter(i => (i.stock || 0) < (i.minStock || 0) * 0.5).length;
        return { total, lowStock, criticalStock };
    }, [ingredients]);

    const handleIngredientClick = (ing: Ingredient) => {
        setEditingIngredient(ing);
        setShowIngredientModal(true);
    };

    const handleNewIngredient = () => {
        setEditingIngredient(null);
        setShowIngredientModal(true);
    };

    const criticalItems = ingredients.filter(i => (i.stock || 0) < (i.minStock || 0) * 0.5).slice(0, 4);

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full">

            {/* Header */}
            <header className="pt-4 pb-4 px-5 z-10 relative">
                <div className="flex justify-between items-start mb-6 px-2">
                    <div>
                        <p className="text-[10px] font-black tracking-[0.2em] text-white/80 uppercase mb-1">Nexus Suite</p>
                        <h1 className="text-5xl font-extrabold text-white tracking-tighter leading-[0.9]">
                            STOCK<br />
                            <span className="text-white/70">ALERT</span>
                        </h1>
                    </div>
                    <div
                        className="bg-white/20 backdrop-blur-2xl border border-white/30 rounded-full p-3 shadow-xl cursor-pointer hover:bg-white/30 transition-all"
                        onClick={handleNewIngredient}
                    >
                        <span className="material-symbols-outlined text-white fill-1">add</span>
                    </div>
                </div>

                {/* Tab Bar */}
                <div className="bg-black/10 backdrop-blur-md border border-white/20 rounded-2xl p-1 flex items-center">
                    <button
                        onClick={() => onNavigate(PageName.GrimorioRecipes)}
                        className="flex-1 py-3 rounded-xl text-[11px] font-bold text-white/80 hover:text-white transition-all"
                    >
                        INVENTORY
                    </button>
                    <button className="flex-1 py-3 rounded-xl bg-white text-red-600 text-[11px] font-black shadow-lg">
                        CRITICAL
                    </button>
                    <button
                        onClick={() => onNavigate(PageName.GrimorioMarket)}
                        className="flex-1 py-3 rounded-xl text-[11px] font-bold text-white/80 hover:text-white transition-all"
                    >
                        REPORTS
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto custom-scroll px-5 space-y-4">

                {/* Emergency Card */}
                {stats.criticalStock > 0 && (
                    <GlassCard rounded="3xl" padding="lg" className="relative overflow-hidden group mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent pointer-events-none"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center text-white action-glow-red">
                                    <span className="material-symbols-outlined text-3xl font-bold">priority_high</span>
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-zinc-900 leading-tight">Emergency</h3>
                                    <p className="text-xs font-medium text-zinc-500">{stats.criticalStock} SKUs below threshold</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-zinc-400 group-hover:text-red-600 transition-colors">chevron_right</span>
                        </div>
                    </GlassCard>
                )}

                {/* Critical Items List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <span className="material-symbols-outlined animate-spin text-red-600">sync</span>
                        </div>
                    ) : criticalItems.length > 0 ? criticalItems.map((item, i) => {
                        const current = item.stock || 0;
                        const min = item.minStock || 0;
                        const percentage = Math.min(Math.max((current / (min || 1)) * 100, 0), 100);
                        const isExhausted = current === 0;

                        return (
                            <GlassCard
                                key={item.id}
                                rounded="3xl"
                                padding="md"
                                className="relative transition-all active:scale-[0.98] cursor-pointer"
                                onClick={() => handleIngredientClick(item)}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-red-600 fill-1">
                                                {isExhausted ? 'dangerous' : 'liquor'}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-zinc-900">{item.nombre}</h2>
                                            <p className="text-[10px] font-bold text-red-600/80 uppercase tracking-widest mt-0.5">
                                                {isExhausted ? 'Status: Exhausted' : 'Stock level: Critical'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-black text-red-600">{current.toString().padStart(2, '0')}</span>
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{item.unidad || 'UNITS'}</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-zinc-100 rounded-full h-1.5 mb-5">
                                    <div
                                        className="bg-red-600 h-1.5 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <button
                                        className="flex-[0.4] py-3.5 rounded-2xl text-[10px] font-black text-zinc-500 bg-zinc-100 border border-zinc-200 uppercase tracking-wider hover:bg-zinc-200 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); console.log('Scan'); }}
                                    >
                                        Scan
                                    </button>
                                    <PremiumButton
                                        module="grimorioStock"
                                        variant="gradient"
                                        size="md"
                                        icon={<span className="material-symbols-outlined !text-sm">bolt</span>}
                                        iconPosition="right"
                                        className="flex-1"
                                    >
                                        {isExhausted ? 'EMERGENCY ORDER' : 'REORDER NOW'}
                                    </PremiumButton>
                                </div>
                            </GlassCard>
                        );
                    }) : (
                        <GlassCard rounded="2xl" padding="xl">
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-6xl text-emerald-500 mb-4 block">inventory</span>
                                <h3 className="text-lg font-bold text-zinc-900 mb-2">All Stock Levels Normal</h3>
                                <p className="text-sm text-zinc-500">No critical alerts at this time</p>
                            </div>
                        </GlassCard>
                    )}
                </div>
            </main>

            {/* Ingredient Modal */}
            {showIngredientModal && db && userId && appId && (
                <IngredientFormModal
                    isOpen={showIngredientModal}
                    onClose={() => setShowIngredientModal(false)}
                    db={db}
                    userId={userId}
                    appId={appId}
                    editingIngredient={editingIngredient}
                />
            )}
        </div>
    );
};

export default GrimorioStock;
