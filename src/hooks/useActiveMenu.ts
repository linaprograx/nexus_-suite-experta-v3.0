import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useCartas } from './useCartas';
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
    /**
     * A qué carta pertenece. La pertenencia vive AQUÍ y no dentro de la receta,
     * porque una misma receta puede estar en varias cartas a la vez.
     * Opcional por compatibilidad: las entradas anteriores a las cartas no lo
     * tienen hasta que `useCartas.migrarSiHaceFalta()` se lo añade.
     */
    cartaId?: string;
    addedAt: Date | any;
}

const path = (userId: string) => `users/${userId}/menu_items`;

export const useActiveMenu = () => {
    const { db, userId } = useApp();
    const { cartaActiva } = useCartas();
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
        // Se sella a qué carta pertenece. Sin esto, al cambiar de carta la
        // receta añadida aparecería en todas.
        //
        // Si la llamada trae `cartaId` explícito, manda ese: es lo que permite
        // asignar una receta a VARIAS cartas al crearla, sin tener que ir
        // cambiando cuál está activa.
        const cartaId = (entry as any).cartaId ?? cartaActiva?.id;
        await addDoc(collection(db, path(userId)), { ...clean, cartaId, addedAt: serverTimestamp() });
    }, [db, userId, cartaActiva?.id]);

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

    /**
     * Solo las entradas de la carta activa.
     *
     * Sin esto, al tener varias cartas se mezclarían todas: el panel mostraría
     * los cócteles de la de verano junto a los de la actual. Las entradas sin
     * `cartaId` —anteriores a la migración— se dan por de la carta activa, para
     * que nada desaparezca si la migración aún no ha corrido.
     */
    const menuDeLaCarta = cartaActiva
        ? menu.filter(m => !m.cartaId || m.cartaId === cartaActiva.id)
        : menu;

    return {
        menu: menuDeLaCarta,
        /** Todas las entradas, de cualquier carta. Rara vez hace falta. */
        menuCompleto: menu,
        cartaActivaId: cartaActiva?.id,
        loading, addToMenu, removeFromMenu, refreshEntry,
    };
};
