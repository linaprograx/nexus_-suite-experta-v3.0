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
import { EnLaFranjaFija } from '../layout/FranjaFija';
import { StockResolverPanel } from '../../components/stock/StockResolverPanel';
import { useStockResolver } from '../../features/stock/hooks/useStockResolver';
import { PhysicalCountModal } from './PhysicalCountModal';

interface StockInventoryPanelProps {
    stockItems: StockItem[];
    purchases: PurchaseEvent[];
    allIngredients: Ingredient[];
    onSelectIngredient?: (ingredientId: string) => void;
    externalSearchTerm?: string;
    externalCategory?: string; // Added for Mobile Unified Toolbar
    onRecordMovement?: (item: StockItem, quantity: number, type: 'consumption' | 'waste' | 'adjustment', reason?: string) => void;
    onPhysicalCount?: (adjustments: { item: StockItem; counted: number; delta: number }[]) => void;
}

export const StockInventoryPanel: React.FC<StockInventoryPanelProps> = ({
    stockItems,
    purchases,
    allIngredients,
    onSelectIngredient,
    externalSearchTerm,
    externalCategory,
    onRecordMovement,
    onPhysicalCount
}) => {
    // Stock-out (consumption / waste / adjustment) mini-dialog — records in the item's own unit
    const [mvItem, setMvItem] = useState<StockItem | null>(null);
    const [mvQty, setMvQty] = useState('');
    const [mvType, setMvType] = useState<'consumption' | 'waste' | 'adjustment'>('consumption');
    const [showCount, setShowCount] = useState(false);
    const { db, userId } = useApp();
    const queryClient = useQueryClient();
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const searchQuery = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchQuery;
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
    const [internalSelectedCategory, setInternalSelectedCategory] = useState<string>('all');
    const selectedCategory = externalCategory !== undefined ? externalCategory : internalSelectedCategory;

    const filteredStockItems = useMemo(() => {
        return enrichedStockItems.filter(item => {
            const matchesSearch = item.ingredientName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [enrichedStockItems, searchQuery, selectedCategory]);

    // Recalculate metrics based on FILTERED items
    const filteredMetrics = useMemo(() => calculateInventoryMetrics(filteredStockItems), [filteredStockItems]);

    /**
     * Compras de este mes frente a las del mes anterior.
     *
     * Antes decía «% vs mes anterior» y calculaba `esteMes / TODO_EL_HISTÓRICO`.
     * Dos errores en una línea: el término de comparación era el acumulado desde
     * el principio de los tiempos, no el mes anterior, y una variación es
     * `(actual − anterior) / anterior`, no un cociente. Por eso mostraba «+0%»
     * el mismo día en que había compras registradas: unos cientos de euros sobre
     * ~39.000 € de histórico redondean a cero.
     *
     * También se corrige el rótulo. Esto mide **compras**, no el valor del
     * almacén: son cosas distintas y estaba etiquetado como si fueran la misma.
     */
    const inventoryTrend = useMemo(() => {
        const toMillis = (v: any): number => {
            if (!v) return 0;
            if (typeof v === 'number') return v;
            if (typeof v === 'string') return new Date(v).getTime();
            if (v.seconds) return v.seconds * 1000;          // Firestore Timestamp
            if (v instanceof Date) return v.getTime();
            if (typeof v.toMillis === 'function') return v.toMillis();
            return 0;
        };
        const now = new Date();
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

        let esteMes = 0, mesAnterior = 0;
        for (const p of (purchases || [])) {
            const val = (p as any).totalCost ?? ((p as any).quantity || 0) * ((p as any).unitPrice || 0);
            const t = toMillis((p as any).createdAt);
            if (t >= inicioMes) esteMes += val;
            else if (t >= inicioMesAnterior) mesAnterior += val;   // solo el mes anterior
        }

        // Sin mes anterior con el que comparar no hay variación que enseñar.
        // Antes se inventaba un +100%, que es peor que no decir nada.
        if (mesAnterior <= 0) {
            return { pct: 0, esteMes, hasData: false };
        }
        return {
            pct: ((esteMes - mesAnterior) / mesAnterior) * 100,
            esteMes,
            hasData: true,
        };
    }, [purchases]);


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
        <div className="lg:h-full flex flex-col lg:overflow-hidden relative">

            {/* RESOLVER PANEL - Fixed at top if present, content below begins after toolbar */}
            <div className="shrink-0 px-3 pt-3 pb-2 lg:px-6 lg:pt-6 z-30 relative">
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
            {/* HIDE IF EXTERNAL CONTROLS ARE PROVIDED */}
            {(externalSearchTerm === undefined && externalCategory === undefined) && (
                <EnLaFranjaFija>
                <div className="shrink-0 px-3 pb-3 pt-2 lg:px-6 lg:pb-4 z-20 relative">
                    <div className="flex gap-2 items-center w-full">
                        {/* Search Bar - Grows */}
                        <div className="relative flex-1 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Icon svg={ICONS.search} className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setInternalSearchQuery(e.target.value)}
                                className="pl-10 h-10 text-sm bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all hover:bg-white/60"
                            />
                        </div>

                        {/* Physical count */}
                        {onPhysicalCount && (
                            <button
                                onClick={() => setShowCount(true)}
                                title="Conteo físico de inventario"
                                className="h-10 px-3 shrink-0 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500 hover:text-white border border-sky-500/20 rounded-xl flex items-center gap-2 text-sm font-bold transition-all"
                            >
                                <Icon svg={ICONS.list} className="w-4 h-4" />
                                <span className="hidden sm:inline">Conteo</span>
                            </button>
                        )}

                        {/* Category Button */}
                        <div className="relative min-w-[140px]">
                            <button
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                                className="h-10 w-full px-3 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl flex items-center justify-between text-slate-700 dark:text-slate-200 hover:bg-white/60 transition-all text-sm group shadow-sm"
                            >
                                <div className="flex items-center gap-2 truncate">
                                    <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">Cat:</span>
                                    <span className="font-bold truncate max-w-[120px]">
                                        {selectedCategory === 'all' ? 'Todas' : selectedCategory}
                                    </span>
                                </div>
                                <Icon svg={ICONS.chevronDown} className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                            </button>

                            {/* Dropdown Menu */}
                            {showCategoryDropdown && (
                                <div className="absolute top-[calc(100%_+_8px)] right-0 w-full min-w-[220px] max-h-64 overflow-y-auto custom-scrollbar bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                    <button
                                        onClick={() => { setInternalSelectedCategory('all'); setShowCategoryDropdown(false); }}
                                        className="w-full text-left px-3 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm font-medium transition-colors flex justify-between group items-center mb-1"
                                    >
                                        <span className="text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 font-bold">Todas las Categorías</span>
                                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 group-hover:text-emerald-500 transition-colors">{stockItems.length}</span>
                                    </button>
                                    <div className="h-px bg-slate-100 dark:bg-slate-700/50 my-1 mx-2"></div>
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setInternalSelectedCategory(cat); setShowCategoryDropdown(false); }}
                                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/50 text-sm transition-colors flex justify-between group items-center"
                                        >
                                            <span className="text-slate-700 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{cat}</span>
                                            <span className="text-xs text-slate-400 group-hover:text-emerald-500 font-medium">({categoryStats[cat]})</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedIngIds.size > 0 && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleDeleteSelected}
                                title={`Eliminar ${selectedIngIds.size} seleccionados`}
                                className="h-10 w-10 shrink-0 rounded-xl shadow-lg shadow-red-500/20 bg-red-500 hover:bg-red-600 text-white transition-all animate-in zoom-in-50"
                            >
                                <Icon svg={ICONS.trash} className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
                </EnLaFranjaFija>

            )}

            {/* SCROLLABLE CONTENT */}
            <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar px-3 lg:px-6 pb-20">

                {/* Header Metrics (Auto-Scaling Text) */}
                <div className="flex gap-2 lg:gap-6 mb-4 lg:mb-8 shrink-0">
                    {/* Inventory Value Card */}
                    <div className="flex-1 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl lg:rounded-3xl p-3 lg:p-6 flex flex-col justify-between relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Icon svg={ICONS.dollarSign} className="w-32 h-32" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-widest mb-2 opacity-70">Valor Inventario</h4>
                            <div className="flex items-center justify-center h-10 lg:h-16 w-full relative z-10">
                                <span
                                    className={`font-bold tracking-tighter text-emerald-900 dark:text-emerald-100 transition-all duration-300
                                    ${filteredMetrics.totalValue > 99999 ? 'text-2xl lg:text-3xl' : filteredMetrics.totalValue > 9999 ? 'text-3xl lg:text-4xl' : 'text-3xl lg:text-6xl'}
                                `}
                                >
                                    €{filteredMetrics.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-center">
                            <span className="text-[10px] font-bold bg-white/40 dark:bg-black/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full backdrop-blur-md">
                                {inventoryTrend.hasData
                                    ? `Compras: ${inventoryTrend.pct >= 0 ? '+' : ''}${inventoryTrend.pct.toFixed(0)}% vs mes anterior`
                                    : `Compras del mes: €${inventoryTrend.esteMes.toFixed(0)}`}
                            </span>
                        </div>
                    </div>

                    {/* Items Count Card */}
                    <div className="flex-1 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-2xl lg:rounded-3xl p-3 lg:p-6 flex flex-col justify-between relative overflow-hidden group backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Icon svg={ICONS.box} className="w-32 h-32" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-widest mb-2 opacity-70">Items en Stock</h4>
                            <div className="flex items-center justify-center h-10 lg:h-16 w-full relative z-10">
                                <span
                                    className={`font-black tracking-tighter text-indigo-900 dark:text-indigo-100 transition-all duration-300
                                     ${filteredMetrics.totalItems > 999 ? 'text-3xl lg:text-4xl' : 'text-3xl lg:text-7xl'}
                                `}
                                >
                                    {filteredMetrics.totalItems}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory Grid (GLASS CARDS) */}
                <div className="mb-3 lg:mb-4 flex items-center justify-between">
                    <h3 className="text-base lg:text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Icon svg={ICONS.layers} className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500" />
                        Existencias Reales
                    </h3>
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-sm">
                        {filteredStockItems.length} productos
                    </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 pb-20">
                    {filteredStockItems.map((item) => {
                        const isSelected = selectedIngIds.has(item.ingredientId);
                        return (
                            <div
                                key={item.ingredientId}
                                onClick={() => onSelectIngredient && onSelectIngredient(item.ingredientId)}
                                className={`
                                relative flex flex-col justify-between min-h-0 lg:min-h-[160px] p-2.5 lg:p-5 rounded-xl lg:rounded-3xl transition-all duration-300 cursor-pointer group
                                backdrop-blur-md border shadow-lg
                                ${isSelected
                                        ? 'bg-emerald-500/10 border-emerald-500 shadow-emerald-500/20 scale-[1.02]'
                                        : 'bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-slate-800/60 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-1'
                                    }
                            `}
                            >
                                {/* Glass Reflection Effect */}
                                <div className="absolute inset-0 rounded-xl lg:rounded-3xl bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none" />

                                <div className="relative z-10 flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2 lg:gap-3">
                                        <div className="relative group/check" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(item.ingredientId)}
                                                className="peer appearance-none w-5 h-5 lg:w-6 lg:h-6 rounded-lg lg:rounded-xl border-2 border-slate-300/50 dark:border-slate-600/50 checked:bg-emerald-500 checked:border-emerald-500 cursor-pointer transition-all bg-white/30"
                                            />
                                            <Icon svg={ICONS.check} className="absolute inset-0 m-auto w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                                        </div>
                                        <div className={`p-1.5 lg:p-2 rounded-lg lg:rounded-xl ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white/30 dark:bg-black/20 text-slate-500 dark:text-slate-400'}`}>
                                            <Icon svg={ICONS.box} className="w-4 h-4 lg:w-5 lg:h-5" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {onRecordMovement && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMvItem(item); setMvQty(''); setMvType('consumption'); }}
                                                title="Registrar salida (consumo / merma / ajuste)"
                                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/40 dark:bg-black/20 text-slate-500 dark:text-slate-400 hover:bg-rose-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Icon svg={ICONS.minus} className="w-4 h-4" />
                                            </button>
                                        )}
                                        <div className={`w-3 h-3 rounded-full ${item.quantityAvailable > 5 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.6)]'}`} />
                                    </div>
                                </div>

                                <div className="relative z-10 px-0.5 lg:px-1">
                                    <h4 className="text-sm lg:text-base font-bold text-slate-800 dark:text-slate-100 uppercase leading-tight mb-1 line-clamp-2">
                                        {item.ingredientName}
                                    </h4>
                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-white/30 dark:bg-black/20 px-2 py-0.5 rounded-lg inline-block backdrop-blur-sm">
                                        {item.category || 'General'}
                                    </span>
                                </div>

                                <div className="relative z-10 mt-2 lg:mt-auto pt-2 lg:pt-4 flex items-end justify-between border-t border-white/10 dark:border-white/5">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl lg:text-4xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter drop-shadow-sm">
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

            {/* Physical count (#4) */}
            {showCount && onPhysicalCount && (
                <PhysicalCountModal
                    stockItems={filteredStockItems}
                    onClose={() => setShowCount(false)}
                    onConfirm={onPhysicalCount}
                />
            )}

            {/* Stock-out mini dialog — records a movement in the item's own unit (unit-safe, no conversion) */}
            {mvItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMvItem(null)} />
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 p-5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white mb-1">Registrar salida de stock</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{mvItem.ingredientName} · disponible {Number.isInteger(mvItem.quantityAvailable) ? mvItem.quantityAvailable : mvItem.quantityAvailable.toFixed(1)} {mvItem.unit}</p>

                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                            {([['consumption', 'Consumo'], ['waste', 'Merma'], ['adjustment', 'Ajuste']] as const).map(([val, label]) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setMvType(val)}
                                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-colors ${mvType === val ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                            <Input
                                type="number"
                                min="0"
                                value={mvQty}
                                onChange={e => setMvQty(e.target.value)}
                                placeholder="Cantidad"
                                className="flex-1 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                                autoFocus
                            />
                            <span className="text-xs font-bold text-slate-400 uppercase w-10">{mvItem.unit}</span>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setMvItem(null)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                            <button
                                onClick={() => {
                                    const q = parseFloat(mvQty);
                                    if (!q || q <= 0) return;
                                    onRecordMovement?.(mvItem, q, mvType);
                                    setMvItem(null);
                                }}
                                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                            >
                                Descontar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
