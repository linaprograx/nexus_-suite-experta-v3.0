import { Signal, CostSignalInput } from './signal.types';

export const COST_REAL_HIGHER_THAN_THEORETICAL = 'COST_REAL_HIGHER_THAN_THEORETICAL';
export const COST_REAL_LOWER_THAN_THEORETICAL = 'COST_REAL_LOWER_THAN_THEORETICAL';
export const COST_REAL_INCOMPLETE = 'COST_REAL_INCOMPLETE';
export const COST_THEORETICAL_ZERO = 'COST_THEORETICAL_ZERO';

export const evaluateCostRules = (input: CostSignalInput): Signal[] => {
    const signals: Signal[] = [];
    const { theoreticalCost, realCost, missingStockIngredients } = input;

    // Rule 4: Theoretical Cost Zero
    if (theoreticalCost === 0) {
        signals.push({
            id: COST_THEORETICAL_ZERO,
            type: 'cost',
            severity: 'info',
            scope: 'recipe',
            message: 'Coste teórico no definido (Market incompleto)',
            explanation: 'No se puede calcular el costo porque faltan precios en los ingredientes.',
            context: {
                recipesAffected: 1
            },
            meta: { theoreticalCost },
            visible: true
        });
    }

    // Rule 3: Real Cost Incomplete
    if (realCost === null && missingStockIngredients > 0) {
        signals.push({
            id: COST_REAL_INCOMPLETE,
            type: 'cost',
            severity: 'warning',
            scope: 'recipe',
            message: 'Coste real incompleto: faltan ingredientes en stock',
            explanation: `El coste real no es preciso porque faltan ${missingStockIngredients} ingredientes en stock.`,
            context: {
                comparedSuppliers: 0,
                recipesAffected: 1
            },
            meta: { missingCount: missingStockIngredients },
            visible: true
        });
    }

    // Rules 1 & 2: Comparisons
    if (realCost !== null && theoreticalCost > 0) {
        const delta = realCost - theoreticalCost;
        // Rule 1: Real > Theoretical + 5%
        if (realCost > theoreticalCost * 1.05) {
            const percent = ((realCost / theoreticalCost) - 1) * 100;
            signals.push({
                id: COST_REAL_HIGHER_THAN_THEORETICAL,
                type: 'cost',
                severity: 'warning',
                scope: 'recipe',
                message: 'El coste real supera el coste teórico',
                explanation: 'El coste real es superior al teórico debido al precio de compra actual en stock.',
                context: {
                    deltaAbs: delta,
                    deltaPct: percent
                },
                meta: { theoreticalCost, realCost, deltaPercent: percent },
                visible: true
            });
        }
        // Rule 2: Real < Theoretical - 5%
        else if (realCost < theoreticalCost * 0.95) {
            const percent = (1 - (realCost / theoreticalCost)) * 100;
            signals.push({
                id: COST_REAL_LOWER_THAN_THEORETICAL,
                type: 'cost',
                severity: 'info', // Positive signal
                scope: 'recipe',
                message: 'El coste real es inferior al coste teórico',
                explanation: 'El coste real es inferior al teórico debido a una compra eficiente.',
                context: {
                    deltaAbs: Math.abs(delta),
                    deltaPct: percent
                },
                meta: { theoreticalCost, realCost, deltaPercent: percent },
                visible: true
            });
        }
    }

    return signals;
};
