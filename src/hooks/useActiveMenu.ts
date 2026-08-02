import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

/**
 * A recipe published on the active menu. `costSnapshot` / `marginSnapshot` freeze the
 * economics at the moment it was added, so we can later detect drift when the recipe's
 * real cost moves (ingredient prices, recipe edits…).
 */
export interface MenuEntry {
    id: string;
    recipeId: string;
    nombre: string;
    precioVenta: number;
    costSnapshot: number;
    marginSnapshot: number;
    section?: string;
    addedAt: Date | any;
}

const path = (userId: string) => `users/${userId}/menu_items`;

export const useActiveMenu = () => {
    const { db, userId } = useApp();
    const [menu, setMenu] = useState<MenuEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !userId) { setLoading(false); return; }
        const q = query(collection(db, path(userId)), orderBy('addedAt', 'desc'));
        const unsub = onSnapshot(q, snap => {
            setMenu(snap.docs.map(d => {
                const data = d.data() as any;
                return { ...data, id: d.id, addedAt: data.addedAt?.toDate ? data.addedAt.toDate() : new Date() } as MenuEntry;
            }));
            setLoading(false);
        }, err => { console.error('[useActiveMenu] snapshot error:', err); setLoading(false); });
        return () => unsub();
    }, [db, userId]);

    const addToMenu = useCallback(async (entry: Omit<MenuEntry, 'id' | 'addedAt'>) => {
        if (!db || !userId) return;
        const clean = Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined));
        await addDoc(collection(db, path(userId)), { ...clean, addedAt: serverTimestamp() });
    }, [db, userId]);

    const removeFromMenu = useCallback(async (id: string) => {
        if (!db || !userId) return;
        await deleteDoc(doc(db, path(userId), id));
    }, [db, userId]);

    /** Re-freezes the snapshot to today's economics ("ya lo he revisado"). */
    const refreshEntry = useCallback(async (id: string, costSnapshot: number, marginSnapshot: number, precioVenta?: number) => {
        if (!db || !userId) return;
        const update: Record<string, any> = { costSnapshot, marginSnapshot, reviewedAt: serverTimestamp() };
        if (precioVenta !== undefined) update.precioVenta = precioVenta;
        await updateDoc(doc(db, path(userId), id), update);
    }, [db, userId]);

    return { menu, loading, addToMenu, removeFromMenu, refreshEntry };
};
