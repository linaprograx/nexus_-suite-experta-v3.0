import React, { useState, useMemo } from 'react';
import { PageName, UserProfile } from '../types';
import { GrimorioHeader } from '../components/GrimorioHeader';
import { useIngredients } from '../../../hooks/useIngredients';
import { MarketSidebar } from '../../../components/grimorium/MarketSidebar';
import { GrimorioToolbar } from '../components/GrimorioToolbar';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';

interface Props {
    onNavigate: (page: PageName) => void;
    user?: UserProfile;
}

const GrimorioMarket: React.FC<Props> = ({ onNavigate }) => {
    const { ingredients } = useIngredients();

    // Toolbar State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

    const categories = useMemo(() => {
        const cats = new Set(ingredients.map(i => i.categoria || 'General'));
        return Array.from(cats).sort();
    }, [ingredients]);

    // Derived Selection
    const selectedIngredient = useMemo(() =>
        ingredients.find(i => i.id === selectedItemId) || null
        , [ingredients, selectedItemId]);

    // Filtered List (for the bottom view)
    const filteredIngredients = useMemo(() => {
        return ingredients.filter(item => {
            const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.categoria === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [ingredients, searchQuery, selectedCategory]);

    return (
        <div className="bg-transparent relative overflow-hidden flex flex-col h-full text-zinc-800 dark:text-zinc-100">
            {/* FIXED GRADIENT LAYER - Removed to use Global MobileShell Gradient */}

            <div className="shrink-0 bg-transparent z-10">
                <GrimorioHeader
                    activeSection="market"
                    pageTitle="Mercado"
                />
            </div>

            {/* Unified Toolbar */}
            <div className="shrink-0 z-20">
                <GrimorioToolbar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    color="orange"
                // Status not relevant for Market generally, but could add "Pending Order" etc.
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-4">

                {/* 1. Market Overview (Stats from Sidebar) */}
                {/* We render MarketSidebar ALWAYS, but if no item selected, it shows Stats + Empty State */}
                {/* BUT we want to show stats + OUR LIST when empty. */}
                {/* MarketSidebar renders Stats (Fixed) + Main Content (Scroll). This layout is tricky to nest. */}
                {/* If selectedItemId is null, MarketSidebar shows big "Select Item". */}
                {/* We can put MarketSidebar in a Modal? Or usage Split View? */}
                {/* Let's try: Render MarketSidebar stats MANUALLY (or extract) and then list? */}
                {/* No, reuse component. */}

                {selectedIngredient ? (
                    // DETAIL VIEW (Comparison)
                    <div className="h-full flex flex-col">
                        <button
                            onClick={() => setSelectedItemId(null)}
                            className="flex items-center gap-2 mb-4 text-sm font-bold text-slate-500 hover:text-emerald-500"
                        >
                            <Icon svg={ICONS.chevronLeft} className="w-4 h-4" /> Volver al listado
                        </button>
                        <div className="flex-1 overflow-hidden rounded-2xl border border-white/20">
                            <MarketSidebar
                                allIngredients={ingredients}
                                selectedIngredient={selectedIngredient}
                            />
                        </div>
                    </div>
                ) : (
                    // LIST VIEW
                    <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-white/40 border border-white/20 flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Proveedores</span>
                                <span className="text-2xl font-black text-slate-800">{new Set(ingredients.map(i => i.proveedor)).size}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/40 border border-white/20 flex flex-col items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase">Productos</span>
                                <span className="text-2xl font-black text-slate-800">{ingredients.length}</span>
                            </div>
                        </div>

                        {/* Product List */}
                        <div className="space-y-2 pb-20">
                            {filteredIngredients.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedItemId(item.id)}
                                    className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/20 dark:border-white/5 active:scale-95 transition-transform flex justify-between items-center group"
                                >
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.nombre}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                {item.categoria || 'General'}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {item.proveedor || 'Sin proveedor'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-emerald-600">€{item.costo?.toFixed(2)}</div>
                                        <div className="text-[10px] text-slate-400">{item.unidad}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrimorioMarket;
