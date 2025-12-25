import React, { useState, useMemo } from 'react';
import { PurchaseEvent, StockItem, Ingredient } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../context/AppContext';
import { doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { calculateInventoryMetrics } from '../../utils/stockUtils';
import { StockResolverPanel } from '../../components/stock/StockResolverPanel';
import { useStockResolver } from '../../features/stock/hooks/useStockResolver';

interface StockInventoryPanelProps {
    stockItems: StockItem[];
    purchases: PurchaseEvent[];
    allIngredients: Ingredient[];
    onSelectIngredient?: (ingredientId: string) => void;
}

export const StockInventoryPanel: React.FC<StockInventoryPanelProps> = ({
    stockItems,
    purchases,
    allIngredients,
    onSelectIngredient
}) => {
    const { db, userId } = useApp();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIngIds, setSelectedIngIds] = useState<Set<string>>(new Set());

    // --- Stock Resolver Hook ---
    const {
        isResolving,
        autoFixCount,
        manualFixCandidates,
        applyAutoFixes,
        resolveManual
    } = useStockResolver(allIngredients, purchases);

    // --- ENRICH STOCK ITEMS WITH CATEGORY ---
    const enrichedStockItems = useMemo(() => {
        return stockItems.map(item => {
            const ingredient = allIngredients.find(i => i.id === item.ingredientId);
            return {
                ...item,
                category: ingredient?.categoria || 'General'
            };
        });
    }, [stockItems, allIngredients]);

    // --- STOCK SEARCH & CATEGORY LOGIC ---
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    // Derive Categories and Counts
    const categoryStats = useMemo(() => {
        const stats: Record<string, number> = {};
        enrichedStockItems.forEach(item => {
            const cat = item.category;
            stats[cat] = (stats[cat] || 0) + 1;
        });
        return stats;
    }, [enrichedStockItems]);

    const categories = Object.keys(categoryStats).sort();
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const filteredStockItems = useMemo(() => {
        return enrichedStockItems.filter(item => {
            const matchesSearch = item.ingredientName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [enrichedStockItems, searchQuery, selectedCategory]);

    // Recalculate metrics based on FILTERED items
    const filteredMetrics = useMemo(() => calculateInventoryMetrics(filteredStockItems), [filteredStockItems]);


    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIngIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIngIds(newSet);
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`¿Eliminar ${selectedIngIds.size} items del inventario? Esto borrará el historial de compras asociado.`)) return;

        try {
            const batch = writeBatch(db!);
            const purchasesToDelete = purchases.filter(p => selectedIngIds.has(p.ingredientId));

            if (purchasesToDelete.length === 0) {
                alert("No se encontraron registros de compra para eliminar.");
                return;
            }

            purchasesToDelete.forEach(p => {
                if (p.id) batch.delete(doc(db!, `users/${userId}/purchases`, p.id));
            });

            await batch.commit();
            queryClient.invalidateQueries({ queryKey: ['stock', userId] });
            queryClient.invalidateQueries({ queryKey: ['purchases', userId] });
            setSelectedIngIds(new Set());
        } catch (e) {
            console.error(e);
            alert("Error al eliminar");
        }
    };


    return (
        <div className="h-full flex flex-col overflow-hidden relative">

            {/* RESOLVER PANEL - Fixed at top if present, content below begins after toolbar */}
            <div className="shrink-0 px-6 pt-6 pb-2 z-30 relative">
                <StockResolverPanel
                    autoFixCount={autoFixCount}
                    manualFixCandidates={manualFixCandidates}
                    onApplyAutoFixes={applyAutoFixes}
                    onResolveManual={resolveManual}
                    allIngredients={allIngredients}
                    isResolving={isResolving}
                />
            </div>

            {/* STICKY GLASS TOOLBAR (Search 3/4 + Category 1/4) */}
            <div className="shrink-0 px-6 pb-4 pt-2 z-20 relative">
                <div className="flex gap-4 items-center">
                    <div className="flex-1 flex gap-4">
                        {/* Search Bar (3/4 approx via flex-grow) */}
                        <div className="flex-[3] relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Icon svg={ICONS.search} className="w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 h-14 text-base bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all hover:bg-white/60"
                            />
                        </div>

                        {/* Category Button (1/4 approx) */}
                        <div className="flex-1 relative">
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="h-14 w-full px-4 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-2xl flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-white/60 transition-all font-medium relative group shadow-sm hover:shadow-md"
                            >
                                <div className="flex flex-col items-start truncate overflow-hidden">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Categoría</span>
                                    <span className="truncate w-full text-left -mt-0.5 text-sm font-bold">
                                        {selectedCategory === 'all' ? 'Todas' : selectedCategory}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {selectedCategory !== 'all' && (
                                        <span className="text-[10px] bg-emerald-100/50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                                            {categoryStats[selectedCategory]}
                                        </span>
                                    )}
                                    <Icon svg={ICONS.chevronDown} className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {showCategoryDropdown && (
                                <div className="absolute top-[calc(100%+8px)] right-0 w-full min-w-[220px] max-h-64 overflow-y-auto custom-scrollbar bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <button
                                        onClick={() => { setSelectedCategory('all'); setShowCategoryDropdown(false); }}
                                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm font-medium transition-colors flex justify-between group items-center mb-1"
                                    >
                                        <span className="text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 font-bold">Todas las Categorías</span>
                                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 group-hover:text-emerald-500 transition-colors">{stockItems.length}</span>
                                    </button>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-2"></div>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setShowCategoryDropdown(false); }}
                                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm transition-colors flex justify-between group items-center"
                                        >
                                            <span className="text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{cat}</span>
                                            <span className="text-xs text-slate-400 group-hover:text-emerald-500 font-medium">({categoryStats[cat]})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {selectedIngIds.size > 0 ? (
                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleDeleteSelected}
                            title={`Eliminar ${selectedIngIds.size} seleccionados`}
                            className="h-14 w-14 shrink-0 rounded-2xl shadow-lg shadow-red-500/20 bg-red-500 hover:bg-red-600 text-white transition-all animate-in zoom-in-50"
                        >
                            <Icon svg={ICONS.trash} className="w-6 h-6" />
                        </Button>
                    ) : (
                        <div className="w-14 h-14 shrink-0" />
                    )}
                </div>
            </div>

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-20">

                {/* Header Metrics (Auto-Scaling Text) */}
                <div className="flex gap-6 mb-8 shrink-0">
                    {/* Inventory Value Card */}
                    <div className="flex-1 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Icon svg={ICONS.dollarSign} className="w-32 h-32" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-widest mb-2 opacity-70">Valor Inventario</h4>
                            <div className="flex items-center justify-center h-16 w-full relative z-10">
                                <span
                                    className={`font-bold tracking-tighter text-emerald-900 dark:text-emerald-100 transition-all duration-300
                                    ${filteredMetrics.totalValue > 99999 ? 'text-3xl' : filteredMetrics.totalValue > 9999 ? 'text-4xl' : 'text-5xl lg:text-6xl'}
                                `}
                                >
                                    €{filteredMetrics.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                            <span className="text-[10px] font-bold bg-white/40 dark:bg-black/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full backdrop-blur-md">
                                +12% vs mes anterior
                            </span>
                        </div>
                    </div>

                    {/* Items Count Card */}
                    <div className="flex-1 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Icon svg={ICONS.box} className="w-32 h-32" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-widest mb-2 opacity-70">Items en Stock</h4>
                            <div className="flex items-center justify-center h-16 w-full relative z-10">
                                <span
                                    className={`font-black tracking-tighter text-indigo-900 dark:text-indigo-100 transition-all duration-300
                                     ${filteredMetrics.totalItems > 999 ? 'text-4xl' : 'text-5xl lg:text-7xl'}
                                `}
                                >
                                    {filteredMetrics.totalItems}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Grid (GLASS CARDS) */}
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Icon svg={ICONS.layers} className="w-5 h-5 text-emerald-500" />
                        Existencias Reales
                    </h3>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-sm">
                        {filteredStockItems.length} productos
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-20">
                    {filteredStockItems.map((item) => {
                        const isSelected = selectedIngIds.has(item.ingredientId);
                        return (
                            <div
                                key={item.ingredientId}
                                onClick={() => onSelectIngredient && onSelectIngredient(item.ingredientId)}
                                className={`
                                relative flex flex-col justify-between min-h-[160px] p-5 rounded-3xl transition-all duration-300 cursor-pointer group
                                backdrop-blur-md border shadow-lg
                                ${isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20 scale-[1.02]'
                                        : 'bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-1'
                                    }
                            `}
                            >
                                {/* Glass Reflection Effect */}
                                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />

                                <div className="relative z-10 flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="relative group/check" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(item.ingredientId)}
                                                className="peer appearance-none w-6 h-6 rounded-xl border-2 border-slate-300/50 dark:border-slate-600/50 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all bg-white/30"
                                            />
                                            <Icon svg={ICONS.check} className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                        </div>
                                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white/30 dark:bg-black/20 text-slate-500 dark:text-slate-400'}`}>
                                            <Icon svg={ICONS.box} className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <div className={`w-3 h-3 rounded-full ${item.quantityAvailable > 5 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'}`} />
                                </div>

                                <div className="relative z-10 px-1">
                                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 uppercase leading-tight mb-1 line-clamp-2">
                                        {item.ingredientName}
                                    </h4>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/30 dark:bg-black/20 px-2 py-0.5 rounded-lg inline-block backdrop-blur-sm">
                                        {item.category || 'General'}
                                    </span>
                                </div>

                                <div className="relative z-10 mt-auto pt-4 flex items-end justify-between border-t border-white/10 dark:border-white/5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter drop-shadow-sm">
                                            {Number.isInteger(item.quantityAvailable) ? item.quantityAvailable : item.quantityAvailable?.toFixed(1) || '0'}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400 uppercase mb-1">{item.unit}</span>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Valor</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            €{(item.totalValue || 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
