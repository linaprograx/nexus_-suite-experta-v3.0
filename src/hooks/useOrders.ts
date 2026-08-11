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
    /**
     * A quién se le pidió. **Opcional a propósito**: los pedidos creados antes
     * de M2 no lo tienen, y al recibirlos hay que seguir deduciéndolo del
     * ingrediente como se hacía entonces.
     *
     * Cuando está, manda. Es el dato de cuando se hizo el pedido, y no cambia
     * porque después se le cambie el proveedor por defecto al ingrediente.
     */
    providerId?: string;
    /** Nombre en el momento del pedido, para no depender de que el proveedor siga existiendo. */
    providerName?: string;
    items: OrderItem[];
    totalEstimatedCost: number;
    // draft → sent (enviado al proveedor, sin tocar stock) → completed (recibido: crea compras y suma stock)
    status: 'draft' | 'sent' | 'completed' | 'cancelled';
    createdAt: Date;
    sentAt?: Date;
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

    /**
     * `proveedor` queda registrado en el pedido, no solo en su nombre.
     *
     * Antes se perdía: la hoja se agrupaba por proveedor y de esa agrupación
     * solo sobrevivía el texto «Pedido - Fulano». Al recibir había que
     * deducirlo otra vez del ingrediente, así que si entretanto le habías
     * cambiado el proveedor por defecto, la compra se apuntaba al que no era.
     */
    const createOrder = async (
        items: OrderItem[],
        name?: string,
        status: 'draft' | 'completed' = 'draft',
        proveedor?: { id?: string; nombre?: string },
    ) => {
        if (!userId || !db) return;

        // Chunk items to prevent document size limits (max 1MB per doc, safe limit ~500 items)
        const CHUNK_SIZE = 500;
        const chunks = [];
        for (let i = 0; i < items.length; i += CHUNK_SIZE) {
            chunks.push(items.slice(i, i + CHUNK_SIZE));
        }

        const baseName = name || `Pedido ${new Date().toLocaleDateString()}`;

        // Create an order doc for each chunk
        const promises = chunks.map(async (chunk, index) => {
            const totalEstimatedCost = chunk.reduce((acc, item) => acc + item.estimatedCost, 0);
            const chunkName = chunks.length > 1 ? `${baseName} (Parte ${index + 1}/${chunks.length})` : baseName;

            return addDoc(collection(db, `users/${userId}/orders`), {
                items: chunk,
                totalEstimatedCost,
                status: status,
                createdAt: serverTimestamp(),
                name: chunkName,
                // Solo si de verdad hay proveedor. «unknown» es el centinela que
                // usa la hoja de reposición para «sin asignar»: guardarlo sería
                // convertir una ausencia en un dato, y al recibir se atribuiría
                // la compra a un proveedor que no existe.
                ...(proveedor?.id && proveedor.id !== 'unknown'
                    ? { providerId: proveedor.id, providerName: proveedor.nombre || '' }
                    : {}),
            });
        });

        await Promise.all(promises);
    };

    const deleteOrder = async (orderId: string) => {
        if (!userId || !db) return;
        await deleteDoc(doc(db, `users/${userId}/orders`, orderId));
    };

    const updateOrderStatus = async (orderId: string, status: 'sent' | 'completed' | 'cancelled') => {
        if (!userId || !db) return;
        const extra = status === 'sent' ? { sentAt: serverTimestamp() } : {};
        await updateDoc(doc(db, `users/${userId}/orders`, orderId), { status, ...extra });
    };

    return {
        orders,
        createOrder,
        deleteOrder,
        updateOrderStatus
    };
};
