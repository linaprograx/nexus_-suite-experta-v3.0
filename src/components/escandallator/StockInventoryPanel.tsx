import React, { useMemo } from 'react';
import { ICONS } from '../ui/icons';
import { Icon } from '../ui/Icon';
import { buildStockFromPurchases, calculateInventoryMetrics, StockItem } from '../../utils/stockUtils';
import { PurchaseEvent } from '../../hooks/usePurchaseIngredient';

interface StockInventoryPanelProps {
    purchases: PurchaseEvent[];
    stockItems?: StockItem[]; // Optional, can be passed from parent
    onSelectIngredient?: (ingredientId: string) => void;
}

export const StockInventoryPanel: React.FC<StockInventoryPanelProps> = ({ purchases, stockItems: propStockItems, onSelectIngredient }) => {
    // Derive Stock and Metrics
    const { stockItems, metrics } = useMemo(() => {
        const stock = propStockItems || buildStockFromPurchases(purchases);
        const meta = calculateInventoryMetrics(stock);
        return { stockItems: stock, metrics: meta };
    }, [purchases, propStockItems]);

    return (
        <div className="h-full flex flex-col p-6 overflow-y-auto custom-scrollbar">
            {/* Header Metrics */}
            <div className="flex gap-6 mb-8 shrink-0">
                <div className="flex-1 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icon svg={ICONS.dollarSign} className="w-32 h-32" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-widest mb-1">Valor Inventario</h4>
                        <div className="flex items-baseline gap-1 relative z-10">
                            <span className="text-3xl lg:text-5xl font-bold tracking-tighter text-emerald-900 dark:text-emerald-100 truncate">
                                €{metrics.totalValue.toFixed(2)}
                            </span>
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded-full">
                            +12% vs mes anterior
                        </span>
                    </div>
                </div>

                <div className="flex-1 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Icon svg={ICONS.box} className="w-32 h-32" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-200 uppercase tracking-widest mb-1">Items en Stock</h4>
                        <div className="flex items-baseline gap-1 relative z-10">
                            <span className="text-4xl lg:text-6xl font-black tracking-tighter text-indigo-900 dark:text-indigo-100">
                                {metrics.totalItems}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Grid */}
            {/* Inventory Grid */}
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <Icon svg={ICONS.layers} className="w-5 h-5 text-slate-400" />
                    Existencias Reales
                </h3>
                <span className="text-xs font-medium text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                    Actualizado en tiempo real
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                {stockItems.map((item) => (
                    <div
                        key={item.ingredientId}
                        onClick={() => onSelectIngredient && onSelectIngredient(item.ingredientId)}
                        className="bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-xl hover:scale-[1.02] hover:border-emerald-500/50 transition-all cursor-pointer group relative z-10 flex flex-col justify-between min-h-[160px]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="opacity-30 group-hover:opacity-100 transition-opacity">
                                <Icon svg={ICONS.box} className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                            </div>
                            {/* Status Dot */}
                            <div className={`w-2.5 h-2.5 rounded-full ${item.quantityAvailable > 5 ? 'bg-emerald-500' : 'bg-red-500'} shadow-lg shadow-emerald-500/50`}></div>
                        </div>

                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase leading-snug mb-3 pr-2 break-words">
                            {item.ingredientName}
                        </h4>

                        <div className="mt-auto">
                            <div className="flex items-end gap-1 mb-4">
                                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tighter">
                                    {Number.isInteger(item.quantityAvailable) ? item.quantityAvailable : item.quantityAvailable?.toFixed(1) || '0'}
                                </span>
                                <span className="text-xs font-bold text-slate-400 mb-1">{item.unit}</span>
                            </div>

                            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Proveedor</span>
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]" title={item.providerName}>
                                        {item.providerName ? item.providerName : 'N/A'}
                                    </span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Valor Total</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        €{(item.totalValue || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-2xl"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};
