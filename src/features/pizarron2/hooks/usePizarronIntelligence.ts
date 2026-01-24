import { useMemo } from 'react';
import { useRecipes } from '../../../hooks/useRecipes';
import { useIngredients } from '../../../hooks/useIngredients';
import { BoardNode } from '../engine/types';
import { evaluateCostSignals, evaluateMarketSignals, evaluateStockSignals } from '../../../core/signals/signal.engine';
import { Signal, CostSignalInput, MarketSignalInput, StockSignalInput } from '../../../core/signals/signal.types';
import { calculateRecipeCost } from '../../../core/costing/costCalculator';

export interface PlanningHint {
    type: 'cost' | 'market' | 'stock';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    icon: string;
}

export const usePizarronIntelligence = (nodes: Record<string, BoardNode>) => {
    const { recipes } = useRecipes();
    const { ingredients } = useIngredients();

    const planningHints = useMemo(() => {
        const hints: Record<string, PlanningHint[]> = {};

        Object.values(nodes).forEach(node => {
            if (node.collapsed) return;
            // Support Card and Text nodes (often used as labels)
            if (node.type !== 'card' && node.type !== 'text') return;

            const title = node.content.title?.trim();
            if (!title) return;

            const nodeHints: PlanningHint[] = [];

            // 1. Check Recipe
            const recipe = recipes.find(r => r.nombre.toLowerCase() === title.toLowerCase());
            if (recipe) {
                // Calculate Cost Data for Signal Engine
                const costData = calculateRecipeCost(recipe, ingredients);

                const costInput: CostSignalInput = {
                    theoreticalCost: costData.costoTotal || 0,
                    realCost: costData.costoTotal || 0, // Simplified: usually real cost is separate, but for planning we use what we have
                    missingStockIngredients: 0 // Placeholder: would need deep check
                };

                const costSignals: Signal[] = evaluateCostSignals(costInput);
                if (costSignals.some(s => s.severity === 'critical')) {
                    nodeHints.push({ type: 'cost', severity: 'critical', message: 'High Cost Impact', icon: '€' });
                }
            }

            // 2. Check Ingredient
            const ingredient = ingredients.find(i => i.nombre.toLowerCase() === title.toLowerCase());
            if (ingredient) {
                // Market Signals
                // Map Ingredient to MarketSignalInput
                const marketInput: MarketSignalInput = {
                    product: {
                        id: ingredient.id,
                        name: ingredient.nombre,
                        category: ingredient.categoria || null,
                        supplierData: (ingredient as any).supplierData || {},
                        referencePrice: ingredient.costo || 0,
                        referenceSupplierId: null
                    }
                };

                const marketSignals: Signal[] = evaluateMarketSignals(marketInput);
                if (marketSignals.some(s => s.severity === 'critical')) {
                    nodeHints.push({ type: 'market', severity: 'critical', message: 'Market Volatility', icon: 'M' });
                }

                // Stock Signals
                const stockInput: StockSignalInput = {
                    stockItem: {
                        ingredientId: ingredient.id,
                        averageUnitCost: ingredient.costo || 0,
                        quantityAvailable: ingredient.stock || 0,
                        lastPurchaseDate: undefined // Not tracked in Ingredient type
                    }
                };

                const stockSignals: Signal[] = evaluateStockSignals(stockInput);

                if (stockSignals.some(s => s.severity === 'critical')) {
                    nodeHints.push({ type: 'stock', severity: 'critical', message: 'Low Stock', icon: 'S' });
                }
            }

            if (nodeHints.length > 0) {
                hints[node.id] = nodeHints;
            }
        });

        return hints;
    }, [nodes, recipes, ingredients]);

    return planningHints;
};
