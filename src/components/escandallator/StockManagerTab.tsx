import React, { useMemo } from 'react';
import { Recipe, Ingredient } from '../../types';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { buildStockFromPurchases, calculateInventoryMetrics, StockItem } from '../../utils/stockUtils';
import { PurchaseEvent } from '../../hooks/usePurchaseIngredient';

interface StockManagerTabProps {
    purchases: PurchaseEvent[];
}

const StockManagerTab: React.FC<StockManagerTabProps> = ({ purchases }) => {

    // Derive Stock and Metrics
    const { stockItems, metrics } = useMemo(() => {
        const stock = buildStockFromPurchases(purchases);
        const meta = calculateInventoryMetrics(stock);
        return { stockItems: stock, metrics: meta };
    }, [purchases]);

    return (
        <div className="h-full flex flex-col w-full max-w-full p-4 overflow-hidden">
            {/* Header: Inventory Metrics */}
            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 dark:border-white/5 shadow-premium flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
                        <Icon svg={ICONS.dollar} className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Valor Inventario</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">€{metrics.totalValue.toFixed(2)}</p>
                    </div>
                </div>

                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl p-4 border border-white/10 dark:border-white/5 shadow-premium flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600">
                        <Icon svg={ICONS.box} className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Items en Stock</p>
                        <p className="text-2xl font-bold text-slate-700 dark:text-slate-100">{metrics.totalItems}</p>
                    </div>
                </div>
            </div>

            {/* Inventory Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                {stockItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center opacity-60">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                            <Icon svg={ICONS.archive} className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Inventario Vacío</h3>
                        <p className="text-sm text-slate-500">Registra compras en la sección de Ingredientes para llenar tu stock.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {stockItems.map((item) => (
                            <div key={item.ingredientId} className="group bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 hover:border-emerald-500/30 transition-all p-4 shadow-sm hover:shadow-md flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">{item.ingredientName}</h4>
                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">
                                            {item.providerName.substring(0, 10)}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1 mb-2">
                                        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                            {item.quantityAvailable % 1 === 0 ? item.quantityAvailable : item.quantityAvailable.toFixed(2)}
                                        </span>
                                        <span className="text-sm font-semibold text-emerald-600/70 uppercase">{item.unit}</span>
                                    </div>
                                </div>

                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <p className="text-slate-400">Coste Promedio</p>
                                        <p className="font-medium text-slate-600 dark:text-slate-300">€{item.averageUnitCost.toFixed(2)} / {item.unit}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-slate-400">Valor Total</p>
                                        <p className="font-bold text-emerald-600 dark:text-emerald-500">€{item.totalValue.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {/* Orders Summary (Recent Purchases) */}
            <div className="h-1/3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 overflow-hidden flex flex-col">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Icon svg={ICONS.fileText} className="w-4 h-4" />
                    Últimos Pedidos Generados
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                    {purchases.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600">
                                    <Icon svg={ICONS.check} className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.providerName}</p>
                                    <p className="text-xs text-slate-500">{p.ingredientName} (x{p.quantity})</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">€{p.totalCost.toFixed(2)}</p>
                                <p className="text-[10px] text-slate-400">{p.createdAt?.toLocaleDateString ? p.createdAt.toLocaleDateString() : 'Hoy'}</p>
                            </div>
                        </div>
                    ))}
                    {purchases.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No hay pedidos recientes.</p>}
                </div>
            </div>
        </div >
    );
};

export default StockManagerTab;

