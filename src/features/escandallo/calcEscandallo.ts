import { Recipe, Ingredient } from '../../../types';
import { calculateRecipeCost } from '../../utils/costCalculator';

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
  const ingredientMap = allIngredients.reduce((acc, ing) => {
    acc[ing.id] = ing;
    return acc;
  }, {} as Record<string, Ingredient>);

  const singleRecipeCost = calculateRecipeCost(recipe.ingredientes || [], ingredientMap);
  const totalCost = singleRecipeCost * batchSize;
  
  const ingredientRequirements = (recipe.ingredientes || []).map(item => {
    // If we have the ingredient, we can try to normalize units or just multiply quantity
    const totalQty = item.cantidad * batchSize;
    const ing = item.ingredientId ? ingredientMap[item.ingredientId] : null;
    
    // Cost for this specific ingredient in the batch
    // We reuse calculateRecipeCost logic but for single item
    let itemCost = 0;
    if (ing && ing.standardPrice) {
       // Ideally we reuse the conversion logic from costCalculator
       // But calculateRecipeCost takes an array.
       // Let's just use it for single item array
       itemCost = calculateRecipeCost([item], ingredientMap) * batchSize;
    }

    return {
      name: item.nombre,
      totalQuantity: totalQty,
      unit: item.unidad,
      cost: itemCost
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
