
import { ActiveSuggestion } from './active.types';
import { AssistedInsight } from '../assisted/assisted.types';

export const evaluateMarketActiveRules = (insights: AssistedInsight[]): ActiveSuggestion[] => {
    const suggestions: ActiveSuggestion[] = [];

    // Rule 1: Switch Provider Preview
    // Trigger: INSIGHT_MARKET_SAVINGS_HIGH_IMPACT
    const savingsInsight = insights.find(i => i.id === 'INSIGHT_MARKET_SAVINGS_HIGH_IMPACT');

    if (savingsInsight && (savingsInsight.priorityScore ?? 0) >= 80) { // Higher threshold for Active
        // Prefer the structured payload (real entity data); fall back to parsing evidence text.
        const payload = savingsInsight.payload || {};
        const bestPriceEv = savingsInsight.evidence?.find(e => e.label === 'Mejor precio');
        const bestPrice = payload.newPrice ?? (bestPriceEv ? parseFloat(bestPriceEv.value) : 0);

        const deltaEv = savingsInsight.evidence?.find(e => e.label === 'Diferencia');
        const delta = payload.deltaAbs ?? (deltaEv ? parseFloat(deltaEv.value) : 0);

        const ingredientId = payload.ingredientId ?? savingsInsight.related?.ingredientIds?.[0];
        const bestSupplierId = payload.bestSupplierId ?? savingsInsight.related?.supplierIds?.[0];

        // Without a real ingredient to act on, skip emitting an (unexecutable) suggestion.
        if (!ingredientId) return suggestions;

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
                // Real entity references carried from the signal → insight → suggestion chain
                ingredientId,
                supplierId: bestSupplierId,
                newPrice: bestPrice,
            }
        });
    }

    return suggestions;
};
