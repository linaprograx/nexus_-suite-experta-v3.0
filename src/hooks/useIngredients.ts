import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useApp } from '../context/AppContext';
import { Ingredient } from '../types';

/**
 * Master ingredient catalog ("Mercado"), enriched with the real weighted-average
 * cost derived from the purchase history when an ingredient has no usable price
 * stored on its own document.
 *
 * Pack-size normalization happens at INGEST time (CSV import / manual form, via
 * src/utils/packNormalization.ts), so most ingredients already carry canonical
 * `standardUnit` + `standardQuantity` + `standardPrice`. This enrichment is only
 * a fallback for legacy rows imported before normalization existed.
 */
export const useIngredients = () => {
    const { db, userId, appId } = useApp();
    const enabled = !!db && !!userId && !!appId;

    const { data: ingredients, isLoading, error } = useQuery({
        queryKey: ['ingredients', appId, userId],
        queryFn: async () => {
            if (!db || !userId || !appId) return [];

            // 1. Master catalog
            const q = query(collection(db, `artifacts/${appId}/users/${userId}/grimorio-ingredients`), orderBy('nombre'));
            const snap = await getDocs(q);
            const masters = snap.docs.map(d => ({ ...d.data(), id: d.id } as Ingredient));

            // 2. Purchases → weighted-average unit cost, indexed by id AND name
            type Agg = { totalCost: number; totalQty: number; unit?: string };
            const byId = new Map<string, Agg>();
            const byName = new Map<string, Agg>();
            const norm = (s: string) => (s || '').trim().toLowerCase();
            try {
                const psnap = await getDocs(collection(db, `users/${userId}/purchases`));
                psnap.docs.forEach(p => {
                    const d: any = p.data();
                    const cost = Number(d.totalCost) || 0;
                    const qty = Number(d.quantity) || 0;
                    if (qty <= 0 || cost <= 0) return;
                    const add = (map: Map<string, Agg>, key: string) => {
                        if (!key) return;
                        const cur = map.get(key) || { totalCost: 0, totalQty: 0, unit: d.unit };
                        cur.totalCost += cost;
                        cur.totalQty += qty;
                        if (!cur.unit && d.unit) cur.unit = d.unit;
                        map.set(key, cur);
                    };
                    add(byId, d.ingredientId);
                    add(byName, norm(d.ingredientName));
                });
            } catch { /* purchases collection optional */ }

            // 3. Fallback enrichment: only fill in a price when the catalog row lacks one
            const hasUsablePrice = (ing: any) =>
                Number(ing.standardPrice) > 0 || Number(ing.precioCompra) > 0;

            return masters.map(ing => {
                if (hasUsablePrice(ing)) return ing;
                const pc = byId.get(ing.id) || byName.get(norm(ing.nombre));
                if (pc && pc.totalQty > 0 && pc.totalCost > 0) {
                    const avgUnitCost = pc.totalCost / pc.totalQty;
                    return { ...ing, precioCompra: avgUnitCost, averageUnitCost: avgUnitCost } as Ingredient;
                }
                return ing;
            });
        },
        enabled,
        staleTime: 1000 * 60 * 5,
    });

    return {
        ingredients: ingredients || [],
        isLoading,
        error
    };
};
