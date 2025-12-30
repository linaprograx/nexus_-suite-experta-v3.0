import React from 'react';
import { StockItem } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface StockItemDetailPanelProps {
    stockItem: StockItem | null;
    onEdit: (item: StockItem) => void;
    onDelete: (item: StockItem) => void;
    onClose: () => void;
}

export const StockItemDetailPanel: React.FC<StockItemDetailPanelProps> = ({
    stockItem,
    onEdit,
    onDelete,
    onClose
}) => {
    if (!stockItem) {
        return (
            <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center">
                <Icon svg={ICONS.box} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Selecciona un ítem del inventario para ver detalles</p>
            </Card>
        );
    }

    return (
        <Card className="h-full min-h-0 flex flex-col bg-transparent backdrop-blur-xl border-0 shadow-none rounded-2xl overflow-hidden relative">
            <Button size="icon" variant="ghost" onClick={onClose} className="absolute top-2 right-2 z-10 lg:hidden">
                <Icon svg={ICONS.x} />
            </Button>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-8 w-full max-w-[95%] mx-auto">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-inner bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        <Icon svg={ICONS.box} className="w-10 h-10 opacity-80" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{stockItem.ingredientName}</h2>
                    <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Stock Item
                    </span>
                </div>

                <div className="space-y-6">
                    {/* KEY METRICS */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Cantidad</p>
                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {stockItem.quantityAvailable} <span className="text-sm font-normal text-slate-400">{stockItem.unit}</span>
                            </p>
                        </div>
                        <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider">Valor Total</p>
                            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                €{stockItem.totalValue.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* DETAILS TABLE */}
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Información Operativa</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Costo Promedio</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                    €{stockItem.averageUnitCost.toFixed(2)} / {stockItem.unit}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Última Compra</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                    {new Date(stockItem.lastPurchaseDate).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                <span className="text-slate-600 dark:text-slate-400 text-sm">Proveedor</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                                    {stockItem.providerName}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => onEdit(stockItem)}>
                    <Icon svg={ICONS.edit} className="mr-2 w-4 h-4" /> <span className="hidden sm:inline">Editar</span>
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => onDelete(stockItem)}>
                    <Icon svg={ICONS.trash} className="mr-2 w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span>
                </Button>
            </div>
        </Card>
    );
};
