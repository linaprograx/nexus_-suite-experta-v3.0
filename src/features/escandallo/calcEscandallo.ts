import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';

export interface EscandalloResult {
  recipeName: string;
  batchSize: number;
  totalCost: number;
  costPerUnit: number;
  productionTimeEstimado: string; // Placeholder
  ingredientRequirements: {
    name: string;
    totalQuantity: number;
    unit: string;
    cost: number;
  }[];
}

export function calcEscandallo(
  recipe: Recipe, 
  batchSize: number, 
  allIngredients: Ingredient[]
): EscandalloResult {
  // Unified costing engine (core/costing): returns total + per-line breakdown, aligned by index
  const costResult = calculateRecipeCost(recipe, allIngredients);
  const singleRecipeCost = costResult.costoTotal;
  const totalCost = singleRecipeCost * batchSize;

  const ingredientRequirements = (recipe.ingredientes || []).map((item: any, idx: number) => {
    const lineCost = costResult.costoPorIngrediente[idx]?.costo ?? 0;
    return {
      name: (item as any).nombre,
      totalQuantity: ((item as any).cantidad || 0) * batchSize,
      unit: (item as any).unidad,
      cost: lineCost * batchSize
    };
  });

  return {
    recipeName: recipe.nombre,
    batchSize,
    totalCost,
    costPerUnit: singleRecipeCost,
    productionTimeEstimado: `${Math.ceil(batchSize * 2)} mins`, // Dummy estimation logic
    ingredientRequirements
  };
}
