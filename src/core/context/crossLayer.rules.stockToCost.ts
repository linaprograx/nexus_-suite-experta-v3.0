
import { CrossLayerRule, ContextHint } from './crossLayer.types';

/**
 * CROSS_LAYER_STOCK_DRIVES_COST — when an escandallo is active AND there is real stock,
 * the recipe's "real" cost is derived from the weighted average purchase cost. Surface that
 * so the user knows the cost figure reflects actual purchases, not just market list price.
 */
export const evaluateStockToCost: CrossLayerRule = (input) => {
    const hints: ContextHint[] = [];
    const esc = input.costs?.activeEscandallo;
    if (!esc) return hints;

    const stockItems = input.stock?.items || [];
    const hasStock = stockItems.some((s: any) => (s?.quantityAvailable ?? s?.quantity ?? 0) > 0);
    if (!hasStock) return hints;

    hints.push({
        id: 'CROSS_LAYER_STOCK_DRIVES_COST',
        message: 'El coste real de esta receta se basa en el coste medio ponderado de tus compras en stock.',
        type: 'info',
        relevance: 0.5,
        metadata: { recipeId: esc.recipeId, recipeName: esc.recipeName },
    });

    return hints;
};
