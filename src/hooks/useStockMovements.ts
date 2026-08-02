import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { StockMovement } from '../types';

const path = (userId: string) => `users/${userId}/stock_movements`;

/**
 * Stock OUT ledger (consumption / waste / physical-count adjustments).
 * Additive to the purchases-based stock: it never mutates purchases.
 */
export const useStockMovements = () => {
    const { db, userId } = useApp();
    const [movements, setMovements] = useState<StockMovement[]>([]);

    useEffect(() => {
        if (!db || !userId) return;
        const q = query(collection(db, path(userId)), orderBy('createdAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setMovements(snap.docs.map(d => {
                const data = d.data() as any;
                return { ...data, id: d.id, createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date() } as StockMovement;
            }));
        }, err => console.error('[useStockMovements] snapshot error:', err));
        return () => unsub();
    }, [db, userId]);

    /** Record one or more stock-out movements (consumption, waste, or adjustment). */
    const addMovements = useCallback(async (items: Omit<StockMovement, 'id' | 'createdAt'>[]) => {
        if (!db || !userId || items.length === 0) return;
        await Promise.all(items.map(m => {
            // Strip undefined (Firestore rejects them)
            const clean = Object.fromEntries(Object.entries(m).filter(([, v]) => v !== undefined));
            return addDoc(collection(db, path(userId)), { ...clean, createdAt: serverTimestamp() });
        }));
    }, [db, userId]);

    return { movements, addMovements };
};
