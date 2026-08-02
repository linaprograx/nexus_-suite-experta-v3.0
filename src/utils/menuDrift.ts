import { Recipe, Ingredient } from '../types';
import { MenuEntry } from '../hooks/useActiveMenu';
import { calculateRecipeCost } from '../core/costing/costCalculator';

/** Cost increase (%) above which a menu item is flagged for review. */
export const DRIFT_COST_PCT = 5;
/** Margin (%) below which a menu item is flagged as critical regardless of drift. */
export const DRIFT_MARGIN_MIN = 20;

export interface MenuDrift {
    entry: MenuEntry;
    recipe: Recipe | null;
    currentCost: number;
    currentMargin: number;
    costDeltaPct: number;      // vs the snapshot taken when it was published
    /** 'missing' = the recipe no longer exists. */
    severity: 'ok' | 'review' | 'critical' | 'missing';
    reason?: string;
}

/**
 * #20 · Closes the loop between Grimorio and the active menu: recomputes each published
 * recipe's real cost and compares it against the snapshot frozen when it was added,
 * so a card never silently goes stale after ingredient prices move.
 */
export const computeMenuDrift = (
    menu: MenuEntry[],
    allRecipes: Recipe[],
    allIngredients: Ingredient[]
): MenuDrift[] => {
    return menu.map(entry => {
        const recipe = allRecipes.find(r => r.id === entry.recipeId) || null;

        if (!recipe) {
            return {
                entry, recipe: null, currentCost: 0, currentMargin: 0, costDeltaPct: 0,
                severity: 'missing' as const,
                reason: 'La receta ya no existe en el recetario',
            };
        }

        const currentCost = calculateRecipeCost(recipe, allIngredients, undefined, allRecipes).costoTotal || 0;
        const price = entry.precioVenta || recipe.precioVenta || 0;
        const currentMargin = price > 0 ? ((price - currentCost) / price) * 100 : 0;
        const base = entry.costSnapshot || 0;
        const costDeltaPct = base > 0 ? ((currentCost - base) / base) * 100 : 0;

        let severity: MenuDrift['severity'] = 'ok';
        let reason: string | undefined;

        if (price > 0 && currentCost > 0 && currentMargin < DRIFT_MARGIN_MIN) {
            severity = 'critical';
            reason = `Margen actual ${currentMargin.toFixed(0)}% (por debajo del ${DRIFT_MARGIN_MIN}%)`;
        } else if (costDeltaPct > DRIFT_COST_PCT) {
            severity = 'review';
            reason = `El coste subió ${costDeltaPct.toFixed(0)}% desde que se publicó`;
        }

        return { entry, recipe, currentCost, currentMargin, costDeltaPct, severity, reason };
    });
};

/** Convenience summary for badges / notifications. */
export const summarizeDrift = (drifts: MenuDrift[]) => ({
    total: drifts.length,
    review: drifts.filter(d => d.severity === 'review').length,
    critical: drifts.filter(d => d.severity === 'critical').length,
    missing: drifts.filter(d => d.severity === 'missing').length,
    needsAttention: drifts.filter(d => d.severity !== 'ok').length,
});
