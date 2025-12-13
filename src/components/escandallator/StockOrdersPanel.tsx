import React, { useMemo, useState } from 'react';
import { PurchaseEvent } from '../../hooks/usePurchaseIngredient';
import { Order } from '../../hooks/useOrders';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';

interface StockOrdersPanelProps {
    purchases: PurchaseEvent[];
    orders: Order[]; // Drafts
    onCreateOrder?: () => void;
    onLaunchOrder: (order: Order) => void;
    onDeleteOrder: (orderId: string) => void;
    onDeleteHistoryGroup?: (providerName: string) => void;
    onDeleteHistoryItem?: (id: string) => void;
    onEditOrder?: (order: Order) => void; // New
}

interface OrderGroup {
    providerName: string;
    items: PurchaseEvent[];
    totalValue: number;
    lastDate: Date;
}

export const StockOrdersPanel: React.FC<StockOrdersPanelProps> = ({
    purchases,
    orders = [],
    onCreateOrder,
    onLaunchOrder,
    onDeleteOrder,
    onDeleteHistoryGroup,
    onDeleteHistoryItem,
    onEditOrder
}) => {

    const [activeTab, setActiveTab] = useState<'drafts' | 'history'>('drafts');

    const ordersByProvider = useMemo(() => {
        const groups: Record<string, OrderGroup> = {};
        purchases.forEach(p => {
            const key = p.providerName || 'Desconocido';
            if (!groups[key]) {
                groups[key] = {
                    providerName: key,
                    items: [],
                    totalValue: 0,
                    lastDate: p.createdAt
                };
            }
            groups[key].items.push(p);
            groups[key].totalValue += p.totalCost;
            if (p.createdAt > groups[key].lastDate) {
                groups[key].lastDate = p.createdAt;
            }
        });
        return Object.values(groups).sort((a, b) => b.lastDate.getTime() - a.lastDate.getTime());
    }, [purchases]);

    const handleDownloadCSV = (order: OrderGroup) => {
        const headers = ['Ingrediente', 'Cantidad', 'Unidad', 'Costo Total', 'Fecha'];
        const rows = order.items.map(item => [
            item.ingredientName,
            item.quantity,
            item.unit,
            item.totalCost.toFixed(2),
            item.createdAt.toLocaleDateString()
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pedido_${order.providerName}_${new Date().toISOString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="h-full flex flex-col bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border-l border-white/20 dark:border-white/5">
            {/* Toolbar Header */}
            {/* ... */}

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                {/* DRAFTS VIEW */}
                {activeTab === 'drafts' && (
                    <>
                        {orders.filter(o => o.status === 'draft').length === 0 ? (
                            <div className="text-center py-10 opacity-60">
                                <p className="text-sm text-slate-500">No hay borradores pendientes.</p>
                            </div>
                        ) : (
                            orders.filter(o => o.status === 'draft').map(order => (
                                <div
                                    key={order.id}
                                    className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border border-indigo-100 dark:border-indigo-900/30 p-3 shadow-sm relative group cursor-pointer hover:border-indigo-300 transition-all"
                                    onClick={() => onEditOrder && onEditOrder(order)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">{order.name}</span>
                                            <span className="text-[10px] text-slate-500">{order.createdAt.toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-full border border-indigo-100">
                                            €{order.totalEstimatedCost.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="mb-3 max-h-24 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50 rounded p-2">
                                        {order.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 border-b border-slate-100 last:border-0 py-1">
                                                <span>{item.ingredientName}</span>
                                                <span>x{item.quantity} {item.unit}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            size="sm"
                                            onClick={(e) => { e.stopPropagation(); onLaunchOrder(order); }}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7"
                                        >
                                            <Icon svg={ICONS.check} className="w-3 h-3 mr-1" />
                                            Lanzar Pedido
                                        </Button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownloadCSV(ordersByProvider.find(g => g.providerName === order.providerName) as any || { providerName: 'Unknown', items: order.items, totalValue: 0, lastDate: new Date() }); }}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Descargar CSV"
                                        >
                                            <Icon svg={ICONS.fileText} className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                            title="Eliminar Borrador"
                                        >
                                            <Icon svg={ICONS.trash} className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {/* HISTORY VIEW */}
                {activeTab === 'history' && (
                    <>
                        {ordersByProvider.length === 0 ? (
                            <div className="text-center py-10 opacity-60">
                                <p className="text-sm text-slate-500">No hay historial de compras.</p>
                            </div>
                        ) : (
                            ordersByProvider.map((order) => (
                                <div key={order.providerName} className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden group">
                                    <div className="p-3 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 text-xs block">{order.providerName}</span>
                                            <span className="text-[10px] text-slate-500">{order.lastDate.toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleDownloadCSV(order)} className="text-slate-400 hover:text-emerald-500"><Icon svg={ICONS.download} className="w-4 h-4" /></button>
                                            {onDeleteHistoryGroup && (
                                                <button onClick={() => onDeleteHistoryGroup(order.providerName)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icon svg={ICONS.trash} className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-2">
                                        {/* Summarized View or Detailed? The user requested 'Edit/Delete' on 'Historical Order Cards'. */}
                                        {/* Since we group by Provider, let's list items and allow deleting them individually. */}
                                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                                            {order.items.map(item => (
                                                <div key={item.id} className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 last:border-0 py-1 group/item">
                                                    <div className="flex-1 truncate pr-2">
                                                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.ingredientName}</span>
                                                        <span className="ml-1 text-slate-400">x{item.quantity} {item.unit}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono">€{item.totalCost.toFixed(2)}</span>
                                                        {onDeleteHistoryItem && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item.id!); }}
                                                                className="opacity-0 group-hover/item:opacity-100 text-slate-300 hover:text-red-500 transition-opacity"
                                                            >
                                                                <Icon svg={ICONS.trash} className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700">
                                            <span className="text-[10px] text-slate-500">{order.items.length} items</span>
                                            <span className="text-xs font-bold text-emerald-600">€{order.totalValue.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
