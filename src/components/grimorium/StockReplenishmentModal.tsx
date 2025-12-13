import React, { useState, useMemo, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ingredient } from '../../types';
import { Order } from '../../hooks/useOrders'; // Import Order type

interface OrderItem {
    ingredientId: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    providerId: string;
    providerName: string;
}

interface StockReplenishmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    ingredients: Ingredient[];
    onConfirm: (orders: { providerId: string; providerName: string; items: OrderItem[] }[]) => void;
    suppliers: any[];
    initialOrder?: Order | null; // Support editing
}

export const StockReplenishmentModal: React.FC<StockReplenishmentModalProps> = ({
    isOpen,
    onClose,
    ingredients = [],
    onConfirm,
    suppliers = [],
    initialOrder
}) => {
    // Selection & Quantities
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [searchQuery, setSearchQuery] = useState('');

    // Pre-fill Logic
    useEffect(() => {
        if (isOpen && initialOrder) {
            const ids: string[] = [];
            const qtys: Record<string, number> = {};

            initialOrder.items.forEach(item => {
                ids.push(item.ingredientId);
                qtys[item.ingredientId] = item.quantity;
            });

            setSelectedIds(ids);
            setQuantities(qtys);
        } else if (isOpen && !initialOrder) {
            // Reset if opening new
            setSelectedIds([]);
            setQuantities({});
        }
    }, [isOpen, initialOrder]);

    // Derived Logic
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        if (!selectedIds.includes(id) && !quantities[id]) {
            setQuantities(prev => ({ ...prev, [id]: 1 })); // Default quantity
        }
    };

    const handleQuantityChange = (id: string, val: number) => {
        setQuantities(prev => ({ ...prev, [id]: val }));
    };

    // Grouping Logic
    const groupedIngredients = useMemo(() => {
        const filtered = ingredients.filter(i => i.nombre.toLowerCase().includes(searchQuery.toLowerCase()));

        const groups: Record<string, { providerName: string, items: Ingredient[] }> = {};

        filtered.forEach(ing => {
            // Find Provider
            const pid = ing.proveedor || 'unknown';
            const pname = suppliers.find(s => s.id === pid)?.name || (pid === 'unknown' ? 'Sin Proveedor Asignado' : pid);

            if (!groups[pid]) {
                groups[pid] = { providerName: pname, items: [] };
            }
            groups[pid].items.push(ing);
        });

        return groups;
    }, [ingredients, searchQuery, suppliers]);

    const handleCreateOrders = () => {
        // Build Orders Grouped by Provider
        const ordersToCreate: { providerId: string; providerName: string; items: OrderItem[] }[] = [];

        Object.entries(groupedIngredients).forEach(([providerId, group]) => {
            const selectedItemsInGroup = group.items.filter(ing => selectedIds.includes(ing.id));

            if (selectedItemsInGroup.length > 0) {
                const orderItems = selectedItemsInGroup.map(ing => ({
                    ingredientId: ing.id,
                    quantity: quantities[ing.id] || 0,
                    unit: ing.unidadCompra || ing.unidad || 'Und',
                    estimatedCost: (quantities[ing.id] || 0) * (ing.precioCompra || 0),
                    providerId,
                    providerName: group.providerName
                }));

                ordersToCreate.push({
                    providerId,
                    providerName: group.providerName,
                    items: orderItems
                });
            }
        });

        onConfirm(ordersToCreate);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span>Generar Pedidos por Proveedor</span>
                </div>
            }
            className="!max-w-5xl"
        >
            <div className="flex flex-col h-[70vh]">
                <div className="mb-4">
                    <Input
                        placeholder="Buscar ingrediente..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 border-slate-200"
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                    {/* Iterate Groups */}
                    {Object.entries(groupedIngredients).map(([providerId, group]) => (
                        <div key={providerId} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                            {/* Group Header */}
                            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                    {group.providerName}
                                </h4>
                                <span className="text-xs text-slate-400 font-mono">{group.items.length} productos</span>
                            </div>

                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-2 p-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-50">
                                <div className="col-span-1 text-center">Sel.</div>
                                <div className="col-span-6">Ingrediente</div>
                                <div className="col-span-3 text-center">Cantidad</div>
                                <div className="col-span-2 text-right">Coste</div>
                            </div>

                            {/* Items */}
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {group.items.map(ing => {
                                    const isSelected = selectedIds.includes(ing.id);
                                    return (
                                        <div key={ing.id} className={`grid grid-cols-12 gap-2 items-center p-2 text-xs transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                                            <div className="col-span-1 flex justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelection(ing.id)}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                                />
                                            </div>
                                            <div className="col-span-6 cursor-pointer" onClick={() => toggleSelection(ing.id)}>
                                                <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{ing.nombre}</span>
                                            </div>
                                            <div className="col-span-3 flex justify-center items-center gap-1">
                                                {isSelected && (
                                                    <>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={quantities[ing.id] || ''}
                                                            onChange={(e) => handleQuantityChange(ing.id, parseFloat(e.target.value))}
                                                            className="h-6 w-16 text-center text-xs font-bold p-1"
                                                        />
                                                        <span className="text-[10px] text-slate-400">{ing.unidadCompra || 'Ud'}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="col-span-2 text-right font-mono text-slate-600">
                                                {isSelected ? `€${((quantities[ing.id] || 0) * (ing.precioCompra || 0)).toFixed(2)}` : '-'}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 flex justify-between items-center">
                    <div className="text-xs text-slate-500">
                        {selectedIds.length} items seleccionados para pedido.
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleCreateOrders} disabled={selectedIds.length === 0} className="bg-indigo-600 text-white">
                            Generar Hojas de Pedido
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
