import { useMemo } from 'react';
import { useIngredients } from './useIngredients';
import { useRecipes } from './useRecipes';
import { useCapabilities } from '../context/AppContext';
import { useUserIntelProfile } from '../features/learning/hooks/useUserIntelProfile';
import { evaluateMarketSignals } from '../core/signals/signal.engine';
import { generateAssistedInsights } from '../core/assisted/assisted.engine';
import { generateActiveSuggestions } from '../core/active/active.engine';
import { ActiveSuggestion } from '../core/active/active.types';

/**
 * #19 · Runs the intelligence ladder across the WHOLE catalog instead of a single
 * selected ingredient, so suggestions can surface (and be executed) outside Grimorio.
 * Only ingredients with 2+ priced suppliers can produce a savings signal, so we
 * pre-filter to keep this cheap on large catalogs.
 */
export const useGlobalSuggestions = (limit = 5) => {
    const { ingredients } = useIngredients();
    const { recipes } = useRecipes();
    const { profile } = useUserIntelProfile();
    const { hasLayer } = useCapabilities();
    const canActive = hasLayer('active_intelligence');

    const suggestions = useMemo<ActiveSuggestion[]>(() => {
        if (!canActive || !ingredients?.length) return [];

        // Candidates: multi-supplier ingredients with real prices
        const candidates = ingredients.filter(ing => {
            const sd = ing.supplierData;
            if (!sd) return false;
            const priced = Object.values(sd).filter((s: any) => Number(s?.price) > 0);
            return priced.length >= 2;
        });

        const out: ActiveSuggestion[] = [];
        for (const ing of candidates) {
            try {
                const supplierMap: Record<string, any> = {};
                for (const [sid, data] of Object.entries(ing.supplierData || {})) {
                    const d = data as any;
                    if (!(Number(d?.price) > 0)) continue;
                    supplierMap[sid] = {
                        price: Number(d.price),
                        formatQty: Number(d.formatQty) || 1,
                        formatUnit: d.formatUnit || d.unit || 'units',
                        updatedAt: d.lastUpdated || Date.now(),
                    };
                }
                if (Object.keys(supplierMap).length < 2) continue;

                const signals = evaluateMarketSignals({
                    product: {
                        id: ing.id,
                        name: ing.nombre,
                        category: ing.categoria || null,
                        supplierData: supplierMap,
                        referencePrice: ing.standardPrice || ing.costo || null,
                        referenceSupplierId: null,
                        unitBase: (ing.standardUnit as any) || 'units',
                    },
                });
                if (!signals.length) continue;

                const insights = generateAssistedInsights({
                    signals,
                    contextHints: [],
                    domain: {
                        market: { ingredients, selectedIngredient: ing },
                        recipes: recipes || [],
                    },
                });
                if (!insights.length) continue;

                out.push(...generateActiveSuggestions(insights, profile));
            } catch (err) {
                // A bad row must never break the whole scan
                console.error('[useGlobalSuggestions] failed on', ing?.nombre, err);
            }
        }

        // Highest economic impact first
        return out
            .sort((a, b) => (b.expectedImpact?.deltaCostAbs || 0) - (a.expectedImpact?.deltaCostAbs || 0))
            .slice(0, limit);
    }, [ingredients, recipes, profile, canActive, limit]);

    return { suggestions, enabled: canActive };
};
