import { useState, useCallback, useEffect } from 'react';
import { Ingredient, PurchaseEvent } from '../types';
import { useApp } from '../context/AppContext';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';


export const usePurchaseIngredient = () => {
    const { db, userId } = useApp();
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [purchaseTarget, setPurchaseTarget] = useState<Ingredient | null>(null);
    const [purchaseHistory, setPurchaseHistory] = useState<PurchaseEvent[]>([]);

    // -- Real-time Sync from Firestore --
    useEffect(() => {
        if (!userId || !db) return;

        const q = query(
            collection(db, `users/${userId}/purchases`)
            // orderBy('createdAt', 'desc') removed to avoid index requirement for now
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const events: PurchaseEvent[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ingredientId: data.ingredientId,
                    ingredientName: data.ingredientName,
                    providerId: data.providerId,
                    providerName: data.providerName,
                    unit: data.unit,
                    quantity: data.quantity,
                    unitPrice: data.unitPrice,
                    totalCost: data.totalCost,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
                    status: data.status
                } as PurchaseEvent;
            });
            setPurchaseHistory(events);
        });

        return () => unsubscribe();
    }, [db, userId]);


    const startPurchase = useCallback((ingredient: Ingredient) => {
        setPurchaseTarget(ingredient);
        setIsPurchaseModalOpen(true);
    }, []);

    const closePurchaseModal = useCallback(() => {
        setIsPurchaseModalOpen(false);
        setPurchaseTarget(null);
    }, []);

    const addPurchase = useCallback(async (data: Omit<PurchaseEvent, 'id' | 'createdAt'> & { createdAt?: Date }) => {
        if (!userId || !db) throw new Error("Database not initialized");

        const purchaseData = {
            ...data,
            createdAt: data.createdAt ? data.createdAt : serverTimestamp(),
            status: data.status || 'completed'
        };

        await addDoc(collection(db, `users/${userId}/purchases`), purchaseData);
    }, [db, userId]);

    const confirmPurchase = useCallback(async (data: { quantity: number; totalCost: number; unit: string }) => {
        if (!purchaseTarget || !userId || !db) return;

        try {
            await addPurchase({
                ingredientId: purchaseTarget.id,
                ingredientName: purchaseTarget.nombre,
                providerId: purchaseTarget.proveedor || purchaseTarget.proveedores?.[0] || 'generic_provider',
                providerName: purchaseTarget.proveedor || purchaseTarget.proveedores?.[0] || 'Proveedor Desconocido',
                unit: data.unit,
                quantity: data.quantity,
                unitPrice: purchaseTarget.precioCompra || 0,
                totalCost: data.totalCost,
                status: 'completed'
            });

            // console.log("🛒 PURCHASE SAVED TO FIRESTORE");
            closePurchaseModal();
        } catch (error) {
            console.error("Error saving purchase:", error);
            alert("Error al registrar la compra. Ver consola.");
        }
    }, [purchaseTarget, userId, db, closePurchaseModal, addPurchase]);

    return {
        purchaseTarget,
        isPurchaseModalOpen,
        startPurchase,
        closePurchaseModal,
        confirmPurchase,
        addPurchase, // Exposed for Bulk Actions
        purchaseHistory
    };
};
