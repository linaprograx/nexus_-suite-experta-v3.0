import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { PurchaseEvent } from './usePurchaseIngredient';

export interface OrderItem {
    ingredientId: string;
    ingredientName: string; // Cached for display
    quantity: number;
    unit: string;
    estimatedCost: number;
}

export interface Order {
    id: string;
    providerId: string; // Group orders by provider typically? Or mixed?
    // If mixed, items need provider info. Let's assume mixed for now or user creates generic order.
    // The previous mockup had "Order Sheet" which seemed mixed.
    items: OrderItem[];
    totalEstimatedCost: number;
    status: 'draft' | 'completed' | 'cancelled';
    createdAt: Date;
    name?: string; // e.g. "Pedido Semanal"
}

export const useOrders = () => {
    const { db, userId } = useApp();
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (!userId || !db) return;

        const q = query(collection(db, `users/${userId}/orders`), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
            })) as Order[];
            setOrders(loadedOrders);
        });
        return () => unsubscribe();
    }, [db, userId]);

    const createOrder = async (items: OrderItem[], name?: string) => {
        if (!userId || !db) return;
        const totalEstimatedCost = items.reduce((acc, item) => acc + item.estimatedCost, 0);

        await addDoc(collection(db, `users/${userId}/orders`), {
            items,
            totalEstimatedCost,
            status: 'draft',
            createdAt: serverTimestamp(),
            name: name || `Pedido ${new Date().toLocaleDateString()}`
        });
    };

    const deleteOrder = async (orderId: string) => {
        if (!userId || !db) return;
        await deleteDoc(doc(db, `users/${userId}/orders`, orderId));
    };

    const updateOrderStatus = async (orderId: string, status: 'completed' | 'cancelled') => {
        if (!userId || !db) return;
        await updateDoc(doc(db, `users/${userId}/orders`, orderId), { status });
    };

    return {
        orders,
        createOrder,
        deleteOrder,
        updateOrderStatus
    };
};
