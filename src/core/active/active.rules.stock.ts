
import { ActiveSuggestion } from './active.types';
import { AssistedInsight } from '../assisted/assisted.types';

export const evaluateStockActiveRules = (insights: AssistedInsight[]): ActiveSuggestion[] => {
    const suggestions: ActiveSuggestion[] = [];

    // Rule 1: Resolve Stock Links
    // Trigger: INSIGHT_DATA_QUALITY
    const qualityInsight = insights.find(i => i.id === 'INSIGHT_DATA_QUALITY');

    if (qualityInsight) {
        suggestions.push({
            id: `SUGGEST_RESOLVE_LINKS_${Date.now()}`,
            type: 'SUGGEST_RESOLVE_STOCK_LINKS',
            scope: 'stock',
            title: 'Sanear Datos',
            proposal: 'Vincular entradas de stock pendientes.',
            why: 'Datos incompletos impiden el cálculo de costes reales.',
            evidence: [],
            expectedImpact: {
                recipesAffected: 0
            },
            confidenceScore: 90,
            riskLevel: 'low',
            reversibility: 'simple',
            preview: {
                before: 'Datos pendientes',
                after: 'Costes actualizados'
            },
            actions: {
                primary: 'Resolver Vinculaciones',
                secondary: 'Más tarde'
            }
        });
    }

    return suggestions;
};
