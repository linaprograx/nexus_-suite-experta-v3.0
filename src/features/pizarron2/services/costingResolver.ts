/**
 * Phase 6.1: Escandallator Integration - Costing Data Resolver
 * 
 * This module provides READ-ONLY resolution of costing data from Escandallator engine.
 * 
 * CRITICAL CONTRACT:
 * - NO cost calculations happen here
 * - NO data persistence
 * - ONLY resolves references to canonical calculateEscandallo()
 */

import { calculateEscandallo, EscandalloResult } from '../../../core/finance/cost.engine';
import { Recipe, Ingredient } from '../../../types';

/**
 * Costing data structure for single recipe costing nodes
 */
export interface CostingData {
    recipeName: string;
    totalCost: number;
    recommendedPrice: number;
    margin: number;
    profitability: number;
    alerts: string[];
}

/**
 * Scenario data structure for multi-recipe comparison
 */
export interface ScenarioData {
    scenarioName: string;
    recipeCount: number;
    totalCost: number;
    averageMargin: number;
    totalRevenue: number;
    warnings: string[];
}

/**
 * Resolves costing data for a single recipe from Escandallator engine
 * 
 * @param recipeId - Reference to recipe (ONLY identifier, no cached data)
 * @param salePrice - Current or override sale price
 * @param allRecipes - Recipe catalog (source of truth)
 * @param allIngredients - Ingredient catalog (source of truth)
 * @returns Calculated costing data or null if recipe not found
 */
export function resolveCostingData(
    recipeId: string,
    salePrice: number,
    allRecipes: Recipe[],
    allIngredients: Ingredient[]
): CostingData | null {
    // Find the recipe
    const recipe = allRecipes.find(r => r.id === recipeId);

    if (!recipe) {
        // Don't log error on every frame - just return null silently
        return null;
    }

    // Use recipe's sale price if no override provided
    const effectivePrice = salePrice > 0 ? salePrice : (recipe.precioVenta || 0);

    // Call canonical Escandallator engine
    const result: EscandalloResult | null = calculateEscandallo(recipe, effectivePrice, allIngredients);

    if (!result) {
        console.warn(`[CostingResolver] Escandallo calculation failed for recipe: ${recipeId}`);
        return null;
    }

    // Generate alerts based on business rules
    const alerts: string[] = [];

    if (result.report.rentabilidad < 20) {
        alerts.push('⚠️ Critical: Margin below 20%');
    } else if (result.report.rentabilidad < 30) {
        alerts.push('⚡ Warning: Margin below 30%');
    }

    if (result.signals.missingCount > 0) {
        alerts.push(`📦 ${result.signals.missingCount} missing ingredient${result.signals.missingCount > 1 ? 's' : ''}`);
    }

    if (result.signals.realCost !== null && Math.abs(result.signals.realCost - result.report.costo) > result.report.costo * 0.1) {
        alerts.push('💰 Real cost variance > 10%');
    }

    // Return resolved data (NOT persisted anywhere)
    return {
        recipeName: recipe.nombre,
        totalCost: result.report.costo,
        recommendedPrice: result.report.precioVenta,
        margin: result.report.margenBruto,
        profitability: result.report.rentabilidad,
        alerts
    };
};

/**
 * Resolves aggregated costing data for multiple recipes (scenario analysis)
 * 
 * @param recipeIds - Array of recipe references
 * @param allRecipes - Recipe catalog
 * @param allIngredients - Ingredient catalog
 * @param scenarioName - Optional name for the scenario
 * @returns Aggregated scenario data or null if no valid recipes
 */
export const resolveScenarioData = (
    recipeIds: string[],
    allRecipes: Recipe[],
    allIngredients: Ingredient[],
    scenarioName: string = 'Untitled Scenario'
): ScenarioData | null => {
    if (!recipeIds || recipeIds.length === 0) {
        return null;
    }

    // Calculate escandallo for each recipe
    const costings = recipeIds
        .map(id => {
            const recipe = allRecipes.find(r => r.id === id);
            if (!recipe) return null;

            const salePrice = recipe.precioVenta || 0;
            const result = calculateEscandallo(recipe, salePrice, allIngredients);

            return result ? { recipe, result } : null;
        })
        .filter(Boolean) as Array<{ recipe: Recipe; result: EscandalloResult }>;

    if (costings.length === 0) {
        return null;
    }

    // Aggregate metrics
    const totalCost = costings.reduce((sum, c) => sum + c.result.report.costo, 0);
    const totalRevenue = costings.reduce((sum, c) => sum + c.result.report.precioVenta, 0);
    const totalMargin = costings.reduce((sum, c) => sum + c.result.report.margenBruto, 0);
    const averageMargin = totalMargin / costings.length;

    // Generate warnings
    const warnings: string[] = [];

    const lowMarginCount = costings.filter(c => c.result.report.rentabilidad < 30).length;
    if (lowMarginCount > 0) {
        warnings.push(`${lowMarginCount} recipe${lowMarginCount > 1 ? 's' : ''} with margin < 30%`);
    }

    const totalMissing = costings.reduce((sum, c) => sum + c.result.signals.missingCount, 0);
    if (totalMissing > 0) {
        warnings.push(`${totalMissing} total missing ingredients`);
    }

    return {
        scenarioName,
        recipeCount: costings.length,
        totalCost,
        averageMargin,
        totalRevenue,
        warnings
    };
};
