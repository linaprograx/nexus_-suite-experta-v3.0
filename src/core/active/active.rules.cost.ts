
import { ActiveSuggestion } from './active.types';
import { AssistedInsight } from '../assisted/assisted.types';

export const evaluateCostActiveRules = (insights: AssistedInsight[]): ActiveSuggestion[] => {
    const suggestions: ActiveSuggestion[] = [];

    // Rule 1: Review Recipe Cost
    // Trigger: INSIGHT_COST_OVERRUN
    const overrunInsight = insights.find(i => i.id === 'INSIGHT_COST_OVERRUN');

    if (overrunInsight && overrunInsight.priorityScore >= 75) {
        suggestions.push({
            id: `SUGGEST_REVIEW_COST_${Date.now()}`,
            type: 'SUGGEST_REVIEW_RECIPE_COST',
            scope: 'cost',
            title: 'Revisión de Márgenes',
            proposal: 'Auditar composición para recuperar margen.',
            why: 'El desvío de coste supera el umbral de tolerancia.',
            evidence: overrunInsight.evidence,
            expectedImpact: {
                deltaCostAbs: 0, // Unknown without deeper analysis
                recipesAffected: 1
            },
            confidenceScore: 80,
            riskLevel: 'low',
            reversibility: 'manual', // "Review" is non-destructive
            preview: {
                before: 'Margen actual: --',
                after: 'Margen objetivo: --'
            },
            actions: {
                primary: 'Iniciar Auditoría',
                secondary: 'Descartar'
            }
        });
    }

    return suggestions;
};
