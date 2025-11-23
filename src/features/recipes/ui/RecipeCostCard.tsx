import React, { useMemo } from 'react';
import { Recipe, Ingredient } from '../../../../types';
import { Card } from '../../../components/ui/Card';
import { calculateRecipeCost, calculateMargin, calculateRecommendedPrice, calculateGrossProfit } from '../../../utils/costCalculator';

interface RecipeCostCardProps {
  recipe: Recipe;
  allIngredients: Ingredient[];
}

export const RecipeCostCard: React.FC<RecipeCostCardProps> = ({ recipe, allIngredients }) => {
  const ingredientMap = useMemo(() => {
    return allIngredients.reduce((acc, ing) => {
      acc[ing.id] = ing;
      return acc;
    }, {} as Record<string, Ingredient>);
  }, [allIngredients]);

  const costData = useMemo(() => {
    const cost = calculateRecipeCost(recipe.ingredientes || [], ingredientMap);
    // If recipe has a manual cost override or cached cost, we might want to use it?
    // But dynamic calculation is safer.
    // However, if the recipe stores `costoReceta` and we want to respect it if ingredients are missing?
    // Let's prefer calculated cost, fallback to stored cost.
    const finalCost = cost > 0 ? cost : (recipe.costoReceta || 0);
    
    // Assume sale price is stored in recipe
    const salePrice = recipe.precioVenta || 0;
    
    const margin = calculateMargin(finalCost, salePrice);
    const recommendedPrice = calculateRecommendedPrice(finalCost, 75); // Target 75% margin by default
    const grossProfit = calculateGrossProfit(finalCost, salePrice);

    return {
      cost: finalCost,
      margin,
      recommendedPrice,
      grossProfit,
      salePrice
    };
  }, [recipe, ingredientMap]);

  return (
    <Card className="p-4 bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Análisis de Costos</h3>
      
      <div className="space-y-3">
        {/* Costo */}
        <div className="flex justify-between items-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          <span className="text-xs text-slate-500 font-medium">Costo Total</span>
          <span className="font-bold text-slate-900 dark:text-white">€{costData.cost.toFixed(2)}</span>
        </div>

        {/* Margen */}
        <div className="flex justify-between items-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          <span className="text-xs text-slate-500 font-medium">Margen Actual</span>
          <span className={`font-bold ${costData.margin < 60 ? 'text-red-500' : 'text-green-500'}`}>
            {costData.margin.toFixed(1)}%
          </span>
        </div>

        {/* Ganancia */}
        <div className="flex justify-between items-center p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50">
          <span className="text-xs text-slate-500 font-medium">Ganancia Bruta</span>
          <span className="font-bold text-slate-900 dark:text-white">€{costData.grossProfit.toFixed(2)}</span>
        </div>

        {/* Recomendado */}
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
           <div className="flex justify-between items-center">
             <span className="text-xs text-slate-400">PV Recomendado (75%)</span>
             <span className="text-sm font-bold text-indigo-500">€{costData.recommendedPrice.toFixed(2)}</span>
           </div>
        </div>
      </div>
    </Card>
  );
};
