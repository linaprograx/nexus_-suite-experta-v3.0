
import { CrossLayerRule, CrossLayerContextInput, ContextHint } from './crossLayer.types';
import { evaluateMarketToRecipes } from './crossLayer.rules.marketToRecipes';
import { evaluateMarketToCost } from './crossLayer.rules.marketToCost';
import { evaluateStockToCost } from './crossLayer.rules.stockToCost';

// Registry of all active rules
const ALL_RULES: CrossLayerRule[] = [
    evaluateMarketToRecipes,
    evaluateMarketToCost,
    evaluateStockToCost
];

/**
 * Main entry point for generating cross-layer context hints.
 * It strictly aggregates results from deterministic rules.
 * Memoization is recommended at the call site (React component).
 */
export const evaluateCrossLayerContext = (input: CrossLayerContextInput): ContextHint[] => {
    let hints: ContextHint[] = [];

    // Evaluate all rules safely
    for (const rule of ALL_RULES) {
        try {
            const ruleHints = rule(input);
            hints = hints.concat(ruleHints);
        } catch (error) {
            console.error("CrossLayer Engine Error:", error);
            // Fail silently for individual rules to keep the UI stable
        }
    }

    // Sort by relevance (descending)
    return hints.sort((a, b) => b.relevance - a.relevance);
};
