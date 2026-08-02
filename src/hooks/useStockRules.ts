import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { collection, onSnapshot, setDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { StockRule } from '../types';

/**
 * Persistent stock alert rules (min stock + reorder qty per ingredient).
 * Stored at users/{uid}/stock-rules so alerts survive reloads.
 * The document id is the ingredientId (one rule per ingredient).
 */
export const useStockRules = () => {
    const { db, userId } = useApp();
    const [rules, setRules] = useState<StockRule[]>([]);

    useEffect(() => {
        if (!userId || !db) return;
        const colRef = collection(db, `users/${userId}/stock-rules`);
        const unsubscribe = onSnapshot(colRef, (snapshot) => {
            setRules(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StockRule)));
        });
        return () => unsubscribe();
    }, [db, userId]);

    const saveRule = useCallback(async (rule: Omit<StockRule, 'id'> & { id?: string }) => {
        if (!userId || !db) return;
        const id = rule.ingredientId; // one rule per ingredient
        await setDoc(
            doc(db, `users/${userId}/stock-rules`, id),
            { ...rule, id, updatedAt: serverTimestamp() },
            { merge: true }
        );
    }, [db, userId]);

    const deleteRule = useCallback(async (ruleId: string) => {
        if (!userId || !db) return;
        await deleteDoc(doc(db, `users/${userId}/stock-rules`, ruleId));
    }, [db, userId]);

    /** Create a default rule for an ingredient if none exists yet. */
    const ensureRule = useCallback(async (ingredientId: string, ingredientName: string) => {
        if (!userId || !db) return;
        if (rules.some(r => r.ingredientId === ingredientId)) return;
        await saveRule({
            ingredientId,
            ingredientName,
            minStock: 1,
            reorderQuantity: 1,
            active: true,
        });
    }, [db, userId, rules, saveRule]);

    return { rules, saveRule, deleteRule, ensureRule };
};
