
import { CrossLayerRule, ContextHint } from './crossLayer.types';

export const evaluateStockToCost: CrossLayerRule = (input) => {
    const hints: ContextHint[] = [];
    if (!input.costs?.activeEscandallo) return hints;

    // Rule: "CROSS_LAYER_STOCK_DRIVES_COST"
    // Check if active recipe uses "Real" cost derived from stock averages
    // This would require access to the computation mode (Theoretical vs Real)

    return hints;
};
