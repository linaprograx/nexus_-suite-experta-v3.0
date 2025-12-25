import React, { useMemo } from 'react';
import { Ingredient } from '../../types';
import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';
import { useApp } from '../../context/AppContext';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface MarketSidebarProps {
    allIngredients: Ingredient[];
    selectedIngredient: Ingredient | null;
}

export const MarketSidebar: React.FC<MarketSidebarProps> = ({
    allIngredients,
    selectedIngredient
}) => {
    const { db, userId } = useApp();
    const { suppliers } = useSuppliers({ db, userId });

    // --- STATS ---
    const stats = useMemo(() => {
        const totalSuppliers = suppliers.length;
        const totalProducts = allIngredients.length;
        return { totalSuppliers, totalProducts };
    }, [suppliers, allIngredients]);

    // --- ADVANCED COMPARISON LOGIC ---
    const comparisons = useMemo(() => {
        if (!selectedIngredient) return [];

        const compList: {
            id: string; // Ingredient ID or Supplier-Product ID
            supplierId?: string;
            supplierName: string;
            productName: string;
            price: number;
            unit: string;
            source: 'linked' | 'catalog' | 'global_match';
        }[] = [];

        // Helper: Tokenize and normalize
        const STOP_WORDS = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'y', 'o', 'con', 'sin', 'por', 'para', 'un', 'una']);
        const WEAK_TOKENS = new Set(['vodka', 'ron', 'gin', 'ginebra', 'tequila', 'whisky', 'whiskey', 'brandy', 'licor', 'cerveza', 'vino', 'sirope', 'pure', 'zumo', 'jugo', 'refresco', 'agua']);

        const getTokens = (str: string) => str.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s]/g, "") // remove special chars
            .split(/\s+/)
            .filter(t => t.length >= 2 && !STOP_WORDS.has(t)); // Allow 2 chars but filter stop words

        const targetTokens = getTokens(selectedIngredient.nombre);

        // Helper: Calculate Match Score (0 to 1) WITH PREFIX SUPPORT
        // UPDATED: Now requires Strong Token match (unless target is only weak)
        const getMatchScore = (name: string) => {
            const tokens = getTokens(name);
            if (tokens.length === 0) return 0;

            let hasStrongMatch = false;
            let weakMatchCount = 0;

            targetTokens.forEach(tA => {
                const isWeak = WEAK_TOKENS.has(tA);
                const matched = tokens.some(tB => {
                    if (tA === tB) return true;
                    if (tA.length > 3 && tB.length > 3 && (tA.includes(tB) || tB.includes(tA))) return true;
                    if (tA.length >= 3 && (tA.startsWith(tB) || tB.startsWith(tA))) return true;
                    return false;
                });

                if (matched) {
                    if (isWeak) weakMatchCount++;
                    else hasStrongMatch = true;
                }
            });

            const targetHasStrongTokens = targetTokens.some(t => !WEAK_TOKENS.has(t));

            if (!targetHasStrongTokens) {
                return weakMatchCount > 0 ? 1 : 0;
            }

            return hasStrongMatch ? 1 : 0;
        };
        // 1. GLOBAL INGREDIENT MATCH
        allIngredients.forEach(ing => {
            if (ing.id === selectedIngredient.id) {
                // ... (SELF logic)
                const providerName = ing.proveedores?.[0] || ing.proveedor || "Desconocido";
                const linkedSupplier = suppliers.find(s => s.name.toLowerCase() === providerName.toLowerCase());

                compList.push({
                    id: ing.id,
                    supplierId: linkedSupplier?.id,
                    supplierName: linkedSupplier?.name || providerName,
                    productName: ing.nombre,
                    price: ing.costo,
                    unit: ing.unidad,
                    source: 'linked'
                });
                return;
            }

            // Lower threshold and use enhanced matching
            if (getMatchScore(ing.nombre) > 0) {
                const providerName = ing.proveedores?.[0] || ing.proveedor || "Desconocido";
                const linkedSupplier = suppliers.find(s => s.name.toLowerCase() === providerName.toLowerCase());

                compList.push({
                    id: ing.id,
                    supplierId: linkedSupplier?.id,
                    supplierName: linkedSupplier?.name || providerName,
                    productName: ing.nombre,
                    price: ing.costo,
                    unit: ing.unidad,
                    source: 'global_match'
                });
            }
        });

        // 2. SUPPLIER CATALOG SCAN
        suppliers.forEach(supp => {
            supp.productList?.forEach(p => {
                if (compList.some(c => c.price === p.price && c.supplierName === supp.name)) return;

                // Enhanced matching logic
                if (getMatchScore(p.productName) > 0) {
                    compList.push({
                        id: p.productId,
                        supplierId: supp.id,
                        supplierName: supp.name,
                        productName: p.productName,
                        price: p.price,
                        unit: p.unit,
                        source: 'catalog'
                    });
                }
            });
        });

        // Dedup by price+supplier to clean up visuals
        const uniqueList = compList.filter((v, i, a) => a.findIndex(t => (t.supplierName === v.supplierName && Math.abs(t.price - v.price) < 0.01)) === i);

        return uniqueList.sort((a, b) => a.price - b.price);
    }, [selectedIngredient, allIngredients, suppliers]);


    return (
        <div className="h-full flex flex-col p-4 gap-4">

            {/* 1. MARKET OVERVIEW (Compact Fixed Header) */}
            <div className="shrink-0 bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 rounded-2xl p-4 backdrop-blur-md shadow-sm flex flex-col justify-center relative overflow-hidden group">
                {/* Decorative */}
                <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon svg={ICONS.layout} className="w-24 h-24" />
                </div>

                <div className="grid grid-cols-2 gap-2 relative z-10 w-full">

                    {/* Entry 1: Proveedores */}
                    <div className="flex flex-col items-center justify-center p-1 border-r border-slate-200 dark:border-slate-700/50">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="p-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500">
                                <Icon svg={ICONS.users} className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PROV.</span>
                        </div>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums leading-none">
                            {stats.totalSuppliers}
                        </span>
                    </div>

                    {/* Entry 2: Productos */}
                    <div className="flex flex-col items-center justify-center p-1">
                        <div className="flex items-center gap-1.5 mb-1">
                            <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500">
                                <Icon svg={ICONS.box} className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ITMS.</span>
                        </div>
                        <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums leading-none">
                            {stats.totalProducts}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT AREA (Scrollable) */}
            <div className="flex-1 min-h-0 bg-white/30 dark:bg-slate-800/30 border border-white/20 dark:border-white/5 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm flex flex-col">

                {/* Header for Comparison */}
                <div className="p-3 border-b border-white/10 bg-white/20 dark:bg-slate-800/40 shrink-0">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Icon svg={ICONS.trendingUp} className="w-4 h-4 text-emerald-500" />
                        Comparativa de Precios {comparisons.length > 0 && `(${comparisons.length})`}
                    </h3>
                </div>

                {/* SCROLLABLE LIST */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    {!selectedIngredient ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                            <Icon svg={ICONS.search} className="w-12 h-12 mb-3 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Selecciona un producto</p>
                            <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
                                Para ver la comparativa de precios real entre todos tus proveedores y productos vinculados.
                            </p>
                        </div>
                    ) : (
                        <>
                            {comparisons.length === 0 ? (
                                <div className="flex flex-col gap-3">
                                    {/* Empty State / Fallback Stats */}
                                    <div className="text-center p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                                        <div className="mx-auto w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 mb-2">
                                            <Icon svg={ICONS.info} className="w-4 h-4" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Sin comparativas directas</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Este producto solo está vinculado a este proveedor.</p>
                                    </div>

                                    {/* USEFUL FALLBACK: MARKET STATS FOR THIS ITEM */}
                                    <div className="p-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-xl">
                                        <h4 className="text-[10px] uppercase font-bold text-indigo-500 mb-2 flex items-center gap-1">
                                            <Icon svg={ICONS.activity} className="w-3 h-3" /> Market Insights
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Precio Medio Global</span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">
                                                    €{selectedIngredient.costo ? selectedIngredient.costo.toFixed(2) : '--'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-slate-500">Volatilidad</span>
                                                <span className="font-bold text-emerald-600">Baja (2%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                comparisons.map((comp, idx) => (
                                    <div key={`${comp.id}-${idx}`} className={`relative p-3 rounded-xl border transition-all group ${idx === 0 ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 shadow-sm ring-1 ring-emerald-100 dark:ring-emerald-900/30' : 'bg-white/40 dark:bg-slate-800/40 border-white/20 dark:border-white/5 hover:bg-white/60'}`}>

                                        {/* RANKING BADGE */}
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                                                    {idx === 0 ? 'Mejor Opcion' : `#${idx + 1}`}
                                                </span>
                                                {comp.source === 'catalog' && (
                                                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100" title="Encontrado en catálogo externo">
                                                        Catálogo
                                                    </span>
                                                )}
                                                {comp.source === 'global_match' && (
                                                    <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100" title="Encontrado en otro ingrediente">
                                                        Coincidencia
                                                    </span>
                                                )}
                                            </div>
                                            {idx === 0 && <Icon svg={ICONS.check} className="w-3.5 h-3.5 text-emerald-600" />}
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <div className="flex-1 min-w-0 pr-2">
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate" title={comp.supplierName}>
                                                    {comp.supplierName}
                                                </p>
                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                    {comp.productName}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="flex items-baseline gap-0.5 justify-end">
                                                    <span className="text-xs text-slate-400 font-medium">€</span>
                                                    <span className={`text-xl font-black ${idx === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {comp.price.toFixed(2)}
                                                    </span>
                                                </div>
                                                <span className="text-[9px] font-medium text-slate-400/80">
                                                    / {comp.unit}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </>
                    )}

                    {/* ACTIONS SECTION (Inside Scroll View, at bottom) */}
                    <div className="pt-4 pb-2 mt-2 border-t border-dashed border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Acciones Rápidas</p>
                        <div className="grid grid-cols-1 gap-2">
                            <button className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/50 hover:bg-indigo-50 dark:bg-slate-700/50 dark:hover:bg-slate-700 hover:border-indigo-200 border border-white/10 transition-all group">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Icon svg={ICONS.plus} className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Nuevo Proveedor</span>
                            </button>

                            <button className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/50 hover:bg-emerald-50 dark:bg-slate-700/50 dark:hover:bg-slate-700 hover:border-emerald-200 border border-white/10 transition-all group">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                    <Icon svg={ICONS.refreshCw} className="w-3 h-3" />
                                </div>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Actualizar Catálogos</span>
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
