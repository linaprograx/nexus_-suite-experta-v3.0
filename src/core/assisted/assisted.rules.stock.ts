import { AssistedInsight, InsightDomainContext } from './assisted.types';
import { Signal } from '../signals/signal.types';
import { STOCK_MISSING_PRICE } from '../signals/signal.rules.stock';

export const STOCK_IMPACT_ON_RECIPES = 'STOCK_IMPACT_ON_RECIPES';

export const evaluateStockAssistedRules = (
    input: { signals: Signal[], domain: InsightDomainContext }
): AssistedInsight[] => {
    const { signals, domain } = input;
    const insights: AssistedInsight[] = [];

    // Rule: Impact on Recipes
    // If we have a Critical "Missing Price" signal, we check how many recipes use this item.
    // Domain context should ideally provide this, or we infer from the signal context if populated.
    // For Phase 6.1, we'll keep it simple: if the signal exists, we warn about downstream blockage.

    const missingPriceSignal = signals.find(s => s.id === STOCK_MISSING_PRICE);

    if (missingPriceSignal) {
        insights.push({
            id: STOCK_IMPACT_ON_RECIPES,
            scope: 'stock',
            severity: 'warning',
            title: 'Bloqueo de Costes',
            summary: 'Este ítem sin precio impide el cálculo preciso del coste real en las recetas que lo utilizan.',
            impact: {
                metric: 'recipes_affected',
                value: 'Múltiples', // Placeholder
                format: 'count',
                direction: 'negative'
            },
            actions: [
                {
                    label: 'Ver Recetas Afectadas',
                    actionId: 'VIEW_AFFECTED_RECIPES',
                    variant: 'secondary'
                }
            ],
            confidence: 95,
            sourceSignalId: STOCK_MISSING_PRICE
        });
    }

    // Rule: Unlinked Items
    const unlinkedSignal = signals.find(s => s.id === 'STOCK_MISSING_LINK'); // Hardcoded ID matching signal rule
    if (unlinkedSignal) {
        insights.push({
            id: 'STOCK_UNLINKED_ITEMS',
            scope: 'stock',
            severity: 'info',
            title: 'Ítems No Vinculados',
            summary: 'Tienes ítems en stock que no están vinculados a la base de datos de ingredientes.',
            impact: {
                metric: 'data_quality',
                value: 'Baja',
                format: 'text',
                direction: 'negative'
            },
            actions: [
                {
                    label: 'Vincular Ahora',
                    actionId: 'LINK_STOCK_ITEMS',
                    variant: 'primary'
                }
            ],
            confidence: 100,
            sourceSignalId: 'STOCK_MISSING_LINK'
        });
    }

    return insights;
};
