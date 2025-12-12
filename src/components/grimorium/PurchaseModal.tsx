import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal'; // Adjust path if needed
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Ingredient } from '../../types';

interface PurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    ingredient: Ingredient | null;
    onConfirm: (data: { quantity: number; totalCost: number; unit: string }) => void;
    suppliers: any[]; // Added suppliers prop
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
    isOpen,
    onClose,
    ingredient,
    onConfirm,
    suppliers = []
}) => {
    const [quantity, setQuantity] = useState<number>(1);
    const [unit, setUnit] = useState<string>('Und'); // Default fallback

    useEffect(() => {
        if (isOpen && ingredient) {
            setQuantity(1); // Reset qty on open
            setUnit(ingredient.unidadCompra || ingredient.unidad || 'Und');
        }
    }, [isOpen, ingredient]);

    // Resolve Supplier Name (Moved up safely)
    const supplierName = React.useMemo(() => {
        if (!ingredient?.proveedor) return 'Sin Proveedor';
        const sup = suppliers.find(s => s.id === ingredient.proveedor);
        return sup ? sup.name : ingredient.proveedor;
    }, [ingredient?.proveedor, suppliers]);

    if (!ingredient) return null;

    const price = ingredient.precioCompra || 0;
    const totalCost = quantity * price;

    const handleConfirm = () => {
        if (quantity <= 0) return;
        onConfirm({ quantity, totalCost, unit });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </div>
                    <span>Comprar Ingrediente</span>
                </div>
            }
            className="!max-w-md"
        >
            <div className="space-y-6 pt-2">
                {/* Header Info */}
                <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{ingredient.nombre}</h3>
                    <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono capitalize">
                            {supplierName}
                        </span>
                    </p>
                </div>

                {/* Inputs Row */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">Cantidad a pedir</Label>
                        <div className="relative">
                            <Input
                                type="number"
                                min="0.01"
                                step="any"
                                value={quantity}
                                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                                className="text-2xl font-bold text-slate-800 dark:text-slate-100 h-14 pl-4 text-center border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="w-24 space-y-2">
                        <Label className="text-xs uppercase text-slate-400 font-bold tracking-wider">Unidad</Label>
                        <div className="h-14 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-bold">
                            {unit}
                        </div>
                    </div>
                </div>

                {/* Calculation Card */}
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-emerald-600/70 font-bold uppercase tracking-wider mb-1">Coste Estimado</p>
                        <p className="text-xs text-emerald-600/50">€{price.toFixed(2)} / {unit}</p>
                    </div>
                    <div className="text-right">
                        <span className="block text-3xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                            €{totalCost.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="h-12 border-slate-200 hover:bg-slate-50 text-slate-500"
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleConfirm}
                        disabled={quantity <= 0}
                        className="h-12 !bg-emerald-50 !text-emerald-700 border border-emerald-200 hover:!bg-emerald-600 hover:!text-white shadow-lg shadow-emerald-500/10 font-bold text-lg transition-all duration-300"
                    >
                        Confirmar
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
