import { useState, useCallback } from 'react';
import { Ingredient } from '../types';

export interface PurchaseEvent {
    id: string;
    ingredientId: string;
    ingredientName: string;
    providerId: string;
    providerName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    createdAt: Date;
    status: 'pending' | 'completed'; // For future extensions
}

export const usePurchaseIngredient = () => {
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [purchaseTarget, setPurchaseTarget] = useState<Ingredient | null>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseEvent[]>([]);

    const startPurchase = useCallback((ingredient: Ingredient) => {
        setPurchaseTarget(ingredient);
        setIsPurchaseModalOpen(true);
    }, []);

    const closePurchaseModal = useCallback(() => {
        setIsPurchaseModalOpen(false);
        setPurchaseTarget(null);
    }, []);

    const confirmPurchase = useCallback((data: { quantity: number; totalCost: number; unit: string }) => {
        if (!purchaseTarget) return;

        const newPurchase: PurchaseEvent = {
            id: crypto.randomUUID(),
            ingredientId: purchaseTarget.id,
            ingredientName: purchaseTarget.nombre,
            providerId: purchaseTarget.proveedor || purchaseTarget.proveedores?.[0] || 'generic_provider',
            providerName: purchaseTarget.proveedor || purchaseTarget.proveedores?.[0] || 'Proveedor Desconocido', // Ideally fetch name
            unit: data.unit,
            quantity: data.quantity,
            unitPrice: purchaseTarget.precioCompra || 0,
            totalCost: data.totalCost,
            createdAt: new Date(),
            status: 'pending'
        };

        console.log("🛒 PURCHASING EVENT GENERATED:", newPurchase);

        // In-memory storage only (Phase 1)
        setPurchaseHistory(prev => [newPurchase, ...prev]);
        closePurchaseModal();

        // Optional: Toast or Alert
        // alert(`Compra registrada: ${data.quantity} ${data.unit} de ${purchaseTarget.nombre}`);
    }, [purchaseTarget, closePurchaseModal]);

    return {
        purchaseTarget,
        isPurchaseModalOpen,
        startPurchase,
        closePurchaseModal,
        confirmPurchase,
        purchaseHistory
    };
};
