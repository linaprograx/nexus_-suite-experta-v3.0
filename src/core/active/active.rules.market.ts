
import { ActiveSuggestion } from './active.types';
import { AssistedInsight } from '../assisted/assisted.types';

export const evaluateMarketActiveRules = (insights: AssistedInsight[]): ActiveSuggestion[] => {
    const suggestions: ActiveSuggestion[] = [];

    // Rule 1: Switch Provider Preview
    // Trigger: INSIGHT_MARKET_SAVINGS_HIGH_IMPACT
    const savingsInsight = insights.find(i => i.id === 'INSIGHT_MARKET_SAVINGS_HIGH_IMPACT');

    if (savingsInsight && savingsInsight.priorityScore >= 80) { // Higher threshold for Active
        // Parse evidence for values (fragile but fast for now)
        const bestPriceEv = savingsInsight.evidence.find(e => e.label === 'Mejor precio');
        const bestPrice = bestPriceEv ? parseFloat(bestPriceEv.value) : 0;

        // We assume we have access to "Current Price" via evidence or context.
        // Actually, we need the delta. 
        const deltaEv = savingsInsight.evidence.find(e => e.label === 'Diferencia');
        const delta = deltaEv ? parseFloat(deltaEv.value) : 0;

        suggestions.push({
            id: `SUGGEST_SWITCH_${Date.now()}`,
            type: 'SUGGEST_SWITCH_PROVIDER_PREVIEW',
            scope: 'market',
            title: 'Optimizar Proveedor',
            proposal: 'Simular cambio al proveedor más económico.',
            why: 'Existe una alternativa validada con impacto significativo en costes.',
            evidence: [
                { label: 'Ahorro potencial', value: `${Math.abs(delta).toFixed(2)}€ / ud` },
                { label: 'Nuevo precio', value: `${bestPrice.toFixed(2)}€` }
            ],
            expectedImpact: {
                deltaCostAbs: Math.abs(delta),
                recipesAffected: 0, // Need context for this, using 0 as safe default or parsing from insight
            },
            confidenceScore: 85, // Mocked high confidence based on Insight existence
            riskLevel: 'low',
            reversibility: 'instant',
            preview: {
                before: 'Precio actual: --',
                after: `Nuevo precio: ${bestPrice.toFixed(2)}€`
            },
            actions: {
                primary: 'Simular Impacto',
                secondary: 'Ignorar'
            },
            data: {
                // In a real scenario, these would come from the Insight's context or metadata.
                // For Phase 3.1 prototype, we might need to rely on the UI passing the ID, 
                // or ensure the Insight carries the Entity ID.
                ingredientId: 'UNKNOWN_ING_ID', // Placeholder, needs to be linked to actual context
                newPrice: bestPrice,
                supplierName: 'Nuevo Proveedor' // Should come from evidence
            }
        });
    }

    return suggestions;
};
