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
    onSendOrder: (order: Order) => void;    // draft → sent (enviado al proveedor)
    onReceiveOrder: (order: Order) => void; // sent → completed (recibido: suma stock)
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


/** Cuántas líneas se ven sin desplegar. Suficiente para reconocer el pedido. */
const LINEAS_VISIBLES = 6;

/**
 * Una lista larga sin barra de desplazamiento propia.
 *
 * Las líneas de un pedido vivían en una caja de 96 px con su propio scroll,
 * dentro de un panel que también scrollea. Revisar un pedido de 300 líneas por
 * esa ventana era inviable, y una rueda dentro de otra siempre mueve la que no
 * querías — en el historial, además, el botón de borrar una línea quedaba
 * escondido tras ese scroll interior.
 *
 * Aquí se ven las primeras y el resto se despliega **hacia abajo**, que es donde
 * el panel ya sabe desplazarse. Ver «Una lista de más de 15 elementos se agrupa
 * y se pliega» en CONTEXT.md.
 */
function ListaConMas<T>({ items, pinta, visibles = LINEAS_VISIBLES }: {
    items: T[];
    pinta: (item: T, idx: number) => React.ReactNode;
    visibles?: number;
}) {
    const [abierta, setAbierta] = React.useState(false);
    const restantes = items.length - visibles;

    return (
        <>
            {(abierta ? items : items.slice(0, visibles)).map(pinta)}
            {restantes > 0 && (
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setAbierta(a => !a); }}
                    aria-expanded={abierta}
                    className="w-full mt-1 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1"
                >
                    <Icon svg={ICONS.chevronDown} className={`w-3 h-3 transition-transform ${abierta ? 'rotate-180' : ''}`} />
                    {abierta ? 'Ver menos' : `Ver las ${restantes} restantes`}
                </button>
            )}
        </>
    );
}

/**
 * Una tarjeta de pedido.
 *
 * Era una función de render dentro del panel. Ahora es un componente porque
 * **cada pedido necesita recordar si sus líneas están desplegadas**, y una
 * función de render no puede tener estado propio: o lo compartían todos los
 * pedidos, o había que subir un mapa de identificadores al panel para algo que
 * solo le importa a la tarjeta.
 */
const TarjetaPedido: React.FC<{
    order: Order;
    mode: 'draft' | 'sent';
    onSendOrder: (order: Order) => void;
    onReceiveOrder: (order: Order) => void;
    onDeleteOrder: (orderId: string) => void;
    onEditOrder?: (order: Order) => void;
    onDescargarCSV: (data: { providerName: string; items: any[]; totalValue: number }) => void;
}> = ({ order, mode, onSendOrder, onReceiveOrder, onDeleteOrder, onEditOrder, onDescargarCSV }) => {
    return (
        <div
            className={`bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-xl border p-3 shadow-sm relative group transition-all ${mode === 'sent' ? 'border-amber-200 dark:border-amber-900/40' : 'border-emerald-100 dark:border-emerald-900/30 cursor-pointer hover:border-emerald-300'}`}
            onClick={() => mode === 'draft' && onEditOrder && onEditOrder(order)}
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{order.name || 'Pedido'}</span>
                        {mode === 'sent' && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                <Icon svg={ICONS.clock} className="w-2.5 h-2.5" /> En camino
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-500">{order.createdAt instanceof Date ? order.createdAt.toLocaleDateString() : 'Fecha desc.'}</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-100">
                    €{order.totalEstimatedCost.toFixed(2)}
                </span>
            </div>

            {/* Las líneas, sin scroll propio.
                Vivían en una caja de 96 px con su propia barra, dentro de un
                panel que también scrollea: revisar un pedido de 300 líneas por
                esa ventana era inviable, y una rueda dentro de otra siempre
                mueve la que no querías. Ahora se ven las primeras y el resto se
                despliega hacia abajo, que es donde el panel ya sabe desplazarse.
                Ver «Una lista de más de 15 elementos se agrupa y se pliega» en
                CONTEXT.md. */}
            <div className="mb-3 bg-slate-50/50 dark:bg-slate-900/50 rounded p-2">
                <ListaConMas
                    items={order.items}
                    pinta={(item, idx) => (
                        <div key={idx} className="flex justify-between gap-2 text-[10px] text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 last:border-0 py-1">
                            <span className="min-w-0 truncate">{item.ingredientName}</span>
                            <span className="shrink-0 tabular-nums">x{item.quantity} {item.unit}</span>
                        </div>
                    )}
                />
            </div>

            <div className="flex gap-2 mt-2">
                {mode === 'draft' ? (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onSendOrder(order); }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7"
                    >
                        <Icon svg={ICONS.send} className="w-3 h-3 mr-1" />
                        Enviar Pedido
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onReceiveOrder(order); }}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-7"
                    >
                        <Icon svg={ICONS.check} className="w-3 h-3 mr-1" />
                        Marcar Recibido
                    </Button>
                )}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDescargarCSV({ providerName: order.name || 'Pedido', items: order.items, totalValue: order.totalEstimatedCost });
                    }}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                    title="Descargar CSV"
                >
                    <Icon svg={ICONS.fileText} className="w-4 h-4" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDeleteOrder(order.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Eliminar Pedido"
                >
                    <Icon svg={ICONS.trash} className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export const StockOrdersPanel: React.FC<StockOrdersPanelProps> = ({
    purchases,
    orders = [],
    onCreateOrder,
    onSendOrder,
    onReceiveOrder,
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

    const handleDownloadCSV = (data: { providerName: string; items: any[], totalValue?: number, lastDate?: Date }) => {
        const headers = ['Ingrediente', 'Cantidad', 'Unidad', 'Costo', 'Fecha'];
        const rows = data.items.map(item => [
            item.ingredientName,
            item.quantity,
            item.unit,
            (item.totalCost || item.estimatedCost || 0).toFixed(2),
            (item.createdAt instanceof Date ? item.createdAt : new Date()).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `pedido_${data.providerName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const draftOrders = orders.filter(o => o.status === 'draft');
    const sentOrders = orders.filter(o => o.status === 'sent');

    const renderOrderCard = (order: Order, mode: 'draft' | 'sent') => (
        <TarjetaPedido
            key={order.id}
            order={order}
            mode={mode}
            onSendOrder={onSendOrder}
            onReceiveOrder={onReceiveOrder}
            onDeleteOrder={onDeleteOrder}
            onEditOrder={onEditOrder}
            onDescargarCSV={handleDownloadCSV}
        />
    );


    return (
        <div className="h-full flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/30 dark:border-white/5 rounded-3xl overflow-hidden shadow-premium">
            {/* Toolbar Header */}
            <div className="p-4 border-b border-white/10 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Icon svg={ICONS.list} className="w-4 h-4" />
                        Gestión Pedidos
                    </h3>
                    {onCreateOrder && (
                        <Button size="sm" onClick={onCreateOrder} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3 rounded-lg shadow-sm">
                            <Icon svg={ICONS.plus} className="w-3 h-3 mr-1.5" />
                            Nuevo
                        </Button>
                    )}
                </div>

                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                    <button
                        onClick={() => setActiveTab('drafts')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'drafts' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Pedidos ({draftOrders.length + sentOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Historial
                    </button>
                </div>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

                {/* DRAFTS + SENT VIEW */}
                {activeTab === 'drafts' && (
                    <>
                        {draftOrders.length === 0 && sentOrders.length === 0 ? (
                            <div className="text-center py-10 opacity-60">
                                <p className="text-sm text-slate-500">No hay pedidos pendientes.</p>
                            </div>
                        ) : (
                            <>
                                {/* En camino (enviados al proveedor) */}
                                {sentOrders.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500 px-1">En camino ({sentOrders.length})</p>
                                        {sentOrders.map(order => renderOrderCard(order, 'sent'))}
                                    </div>
                                )}

                                {/* Borradores */}
                                {draftOrders.length > 0 && (
                                    <div className="space-y-3">
                                        {sentOrders.length > 0 && <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 px-1">Borradores ({draftOrders.length})</p>}
                                        {draftOrders.map(order => renderOrderCard(order, 'draft'))}
                                    </div>
                                )}
                            </>
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
                                            <button onClick={() => handleDownloadCSV(order)} className="text-slate-400 hover:text-emerald-500"><Icon svg={ICONS.fileText} className="w-4 h-4" /></button>
                                            {onDeleteHistoryGroup && (
                                                <button onClick={() => onDeleteHistoryGroup(order.providerName)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Icon svg={ICONS.trash} className="w-4 h-4" /></button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-2 space-y-2">
                                        <div>
                                            <ListaConMas items={order.items} pinta={(item) => (
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
                                            )} />
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
