import { useState, useMemo, useCallback, useEffect } from 'react';
import { Ingredient, PurchaseEvent } from '../../../types';
import { useApp } from '../../../context/AppContext';
import { doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';

export interface UnresolvedPurchase {
    purchase: PurchaseEvent;
    suggestedIngredient?: Ingredient;
    confidence: 'high' | 'none';
}

export const useStockResolver = (allIngredients: Ingredient[], purchases: PurchaseEvent[]) => {
    const { db, userId } = useApp();
    const [isResolving, setIsResolving] = useState(false);

    // Helper: Strict Normalization
    const normalize = (str: string) => {
        return str
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s]/g, "") // Remove special chars
            .replace(/\s+/g, " ") // Collapse spaces
            .trim();
    };

    // 1. Identify "Broken" Purchases and Prepare Fixes (Deferred to avoid blocking render)
    const [resolutionState, setResolutionState] = useState<{
        allBroken: UnresolvedPurchase[];
        autoFixable: UnresolvedPurchase[];
        manualFixable: UnresolvedPurchase[];
    }>({ allBroken: [], autoFixable: [], manualFixable: [] });

    useEffect(() => {
        // Use a timeout to unblock the main thread during mount/tab transitions
        const timer = setTimeout(() => {
            const broken: UnresolvedPurchase[] = [];
            const existingIds = new Set(allIngredients.map(i => i.id));
            const ingredientMap = new Map<string, Ingredient>();

            allIngredients.forEach(i => {
                const norm = normalize(i.nombre);
                if (norm) ingredientMap.set(norm, i);
            });

            purchases.forEach(p => {
                const isMissingId = !p.ingredientId;
                const isOrphanedId = p.ingredientId && !existingIds.has(p.ingredientId);

                if (isMissingId || isOrphanedId) {
                    const pNameNorm = normalize(p.ingredientName || '');
                    const match = ingredientMap.get(pNameNorm);

                    broken.push({
                        purchase: p,
                        suggestedIngredient: match,
                        confidence: match ? 'high' : 'none'
                    });
                }
            });

            setResolutionState({
                allBroken: broken,
                autoFixable: broken.filter(b => b.confidence === 'high'),
                manualFixable: broken.filter(b => b.confidence === 'none')
            });
        }, 300); // 300ms delay to allow UI to settle

        return () => clearTimeout(timer);
    }, [purchases, allIngredients]); // Dependencies likely stable enough or will re-trigger debounce


    // 2. Actions
    const applyAutoFixes = useCallback(async () => {
        if (!db || !userId || resolutionState.autoFixable.length === 0) return;
        setIsResolving(true);
        try {
            const batch = writeBatch(db);
            let count = 0;
            // Limit batch size if necessary (Firestore limit is 500)
            const candidates = resolutionState.autoFixable.slice(0, 450);

            candidates.forEach(({ purchase, suggestedIngredient }) => {
                if (!suggestedIngredient) return;
                const ref = doc(db, `users/${userId}/purchases`, purchase.id);
                batch.update(ref, {
                    ingredientId: suggestedIngredient.id,
                    // We optionally standardize the name to match the linked ingredient
                    ingredientName: suggestedIngredient.nombre,
                    updatedAt: serverTimestamp()
                });
                count++;
            });

            if (count > 0) {
                await batch.commit();
                console.log(`[StockResolver] Auto-fixed ${count} purchases.`);
            }
        } catch (error) {
            console.error("[StockResolver] Auto-fix failed:", error);
        } finally {
            setIsResolving(false);
        }
    }, [db, userId, resolutionState.autoFixable]);

    const resolveManual = useCallback(async (purchaseId: string, ingredientId: string) => {
        if (!db || !userId) return;
        setIsResolving(true);
        try {
            const ingredient = allIngredients.find(i => i.id === ingredientId);
            if (!ingredient) throw new Error("Ingredient not found");

            const ref = doc(db, `users/${userId}/purchases`, purchaseId);
            await updateDoc(ref, {
                ingredientId: ingredient.id,
                ingredientName: ingredient.nombre,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error("[StockResolver] Manual resolution failed:", error);
        } finally {
            setIsResolving(false);
        }
    }, [db, userId, allIngredients]);

    return {
        unresolvedCount: resolutionState.allBroken.length,
        autoFixCount: resolutionState.autoFixable.length,
        manualFixCandidates: resolutionState.manualFixable,
        applyAutoFixes,
        resolveManual,
        isResolving
    };
};
