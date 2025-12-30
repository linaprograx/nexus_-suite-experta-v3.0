import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Ingredient } from '../../types';

interface BulkPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedIngredients: Ingredient[];
    onConfirm: (orders: { ingredientId: string; quantity: number; totalCost: number; unit: string }[]) => void;
    theme?: 'emerald' | 'blue';
    suppliers?: any[];
}

export const BulkPurchaseModal: React.FC<BulkPurchaseModalProps> = ({
    isOpen,
    onClose,
    selectedIngredients = [],
    onConfirm,
    suppliers = [],
    theme = 'emerald'
}) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Initialize quantities when ingredients change or modal opens
    useEffect(() => {
        if (isOpen && selectedIngredients.length > 0) {
            const initial: Record<string, number> = {};
            selectedIngredients.forEach(ing => {
                initial[ing.id] = 1;
            });
            setQuantities(initial);
        }
    }, [isOpen, selectedIngredients]);

    const handleQuantityChange = (id: string, val: number) => {
        setQuantities(prev => ({ ...prev, [id]: val }));
    };

    const calculateTotal = () => {
        return selectedIngredients.reduce((sum, ing) => {
            const qty = quantities[ing.id] || 0;
            const price = ing.precioCompra || 0;
            return sum + (qty * price);
        }, 0);
    };

    const handleConfirm = () => {
        const orders = selectedIngredients.map(ing => ({
            ingredientId: ing.id,
            quantity: quantities[ing.id] || 0,
            totalCost: (quantities[ing.id] || 0) * (ing.precioCompra || 0),
            unit: ing.unidadCompra || ing.unidad || 'Und'
        })).filter(o => o.quantity > 0);

        if (orders.length === 0) return;
        onConfirm(orders);
        onClose();
    };

    const getSupplierName = (ing: Ingredient) => {
        if (!ing.proveedor) return 'Sin Proveedor';
        const s = suppliers.find(sup => sup.id === ing.proveedor);
        return s ? s.name : ing.proveedor;
    };

    // Theme Config
    const isEmerald = theme === 'emerald';
    const accentBg = isEmerald ? 'bg-emerald-100' : 'bg-indigo-100';
    const accentText = isEmerald ? 'text-emerald-600' : 'text-indigo-600';
    const accentBorder = isEmerald ? 'border-emerald-200' : 'border-indigo-200';
    const ringColor = isEmerald ? 'focus:ring-emerald-500/10' : 'focus:ring-indigo-500/10';
    const focusBorder = isEmerald ? 'focus:border-emerald-500' : 'focus:border-indigo-500';
    const softBg = isEmerald ? 'bg-emerald-50/50' : 'bg-indigo-50/50';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${isEmerald ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-indigo-100 dark:bg-indigo-900/30'} ${accentText}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span>Lista de Compra ({selectedIngredients.length})</span>
                </div>
            }
            className="!max-w-3xl"
        >
            <div className="space-y-4 pt-2 max-h-[60vh] overflow-y-auto px-1 custom-scrollbar">
                <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider pl-2">
                    <div className="col-span-4">Ingrediente / Proveedor</div>
                    <div className="col-span-3 text-center">Cantidad</div>
                    <div className="col-span-2 text-center">Unidad</div>
                    <div className="col-span-3 text-right">Coste Est.</div>
                </div>

                {selectedIngredients.map(ing => (
                    <div key={ing.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        {/* Name & Supplier */}
                        <div className="col-span-4">
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate" title={ing.nombre}>{ing.nombre}</p>
                            <p className="text-[10px] text-slate-500 truncate">{getSupplierName(ing)}</p>
                        </div>

                        {/* Quantity */}
                        <div className="col-span-3">
                            <Input
                                type="number"
                                min="0"
                                step="any"
                                value={quantities[ing.id] || ''}
                                onChange={(e) => handleQuantityChange(ing.id, parseFloat(e.target.value))}
                                className={`h-9 text-center font-bold ${accentText} border-slate-200 ${focusBorder} ${ringColor}`}
                            />
                        </div>

                        {/* Unit */}
                        <div className="col-span-2 text-center">
                            <span className="text-xs font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-500">
                                {ing.unidadCompra || 'Und'}
                            </span>
                        </div>

                        {/* Cost */}
                        <div className="col-span-3 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                            €{((quantities[ing.id] || 0) * (ing.precioCompra || 0)).toFixed(2)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Total */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className={`flex justify-between items-center ${softBg} dark:bg-opacity-10 p-4 rounded-xl border ${isEmerald ? 'border-emerald-100' : 'border-indigo-100'} dark:border-opacity-30`}>
                    <span className={`text-sm font-bold ${isEmerald ? 'text-emerald-700' : 'text-indigo-700'} uppercase tracking-wider`}>Total Estimado</span>
                    <span className={`text-2xl font-bold ${accentText} dark:text-opacity-80`}>€{calculateTotal().toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="h-12 border border-slate-200 hover:bg-slate-50 text-slate-500 font-medium"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleConfirm}
                        className={`h-12 !bg-opacity-20 !text-opacity-100 border ${accentBorder} hover:!bg-opacity-100 hover:!text-white shadow-lg font-bold text-lg transition-all duration-300
                            ${isEmerald
                                ? '!bg-emerald-50 !text-emerald-700 hover:!bg-emerald-600 shadow-emerald-500/10'
                                : '!bg-indigo-50 !text-indigo-700 hover:!bg-indigo-600 shadow-indigo-500/10'}`}
                    >
                        Confirmar Pedido ({Object.values(quantities).filter(q => q > 0).length})
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
