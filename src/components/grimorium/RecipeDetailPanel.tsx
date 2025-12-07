import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';
import { RecipeActionsPanel } from '../../features/recipes/ui/RecipeActionsPanel';
import { ViewName } from '../../../types';

import { calculateRecipeCost, CostedIngredient } from '../../modules/costing/costCalculator';
import { calculatePricing } from '../../modules/costing/pricingEngine';
import { formatCost, getMarginBgColor, getMarginTextColor } from '../../modules/costing/costFormatter';


export const RecipeDetailPanel: React.FC<{
  recipe: Recipe | null;
  allIngredients: Ingredient[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onNavigate: (view: ViewName, data?: any) => void;
  onToolToggle?: (isOpen: boolean) => void;
  onEscandallo?: () => void;
  onBatcher?: () => void;
}> = ({ recipe, allIngredients, onEdit, onDelete, onDuplicate, onNavigate, onToolToggle, onEscandallo, onBatcher }) => {
  const { compactMode } = useUI();

  const costData = React.useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeCost(recipe, allIngredients);
  }, [recipe, allIngredients]);

  const pricingData = React.useMemo(() => {
    if (!costData) return null;
    return calculatePricing(costData.costoTotal, recipe?.precioVenta);
  }, [costData, recipe?.precioVenta]);

  if (!recipe || !costData || !pricingData) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center">
        <Icon svg={ICONS.layout} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Selecciona una receta para ver los detalles</p>
      </Card>
    );
  }

  const margin = recipe.precioVenta ? ((recipe.precioVenta - costData.costoTotal) / recipe.precioVenta) * 100 : 0;

  return (
    <Card className="h-full min-h-0 flex flex-col bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 lg:p-6">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.nombre} className="w-full h-56 rounded-2xl object-cover mb-4 shadow-sm" />
        ) : (
          <div className="w-full h-56 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 mb-4 flex items-center justify-center shadow-sm">
            <span className="text-6xl font-bold text-white/50">{recipe.nombre.substring(0, 2).toUpperCase()}</span>
          </div>
        )}

        <div className="flex justify-between items-start">
          <div>
            <h2 className={`font-bold text-slate-900 dark:text-white ${compactMode ? "text-xl" : "text-2xl"}`}>{recipe.nombre}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              {recipe.categorias?.map((cat) => <span key={cat} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">{cat}</span>)}
            </div>
          </div>
          <div className="flex gap-2">
            {onEscandallo && <Button variant="ghost" size="sm" onClick={onEscandallo} title="Escandallar"><Icon svg={ICONS.chart} className="w-4 h-4" /></Button>}
            {onBatcher && <Button variant="ghost" size="sm" onClick={onBatcher} title="Crear Batch"><Icon svg={ICONS.layers} className="w-4 h-4" /></Button>}
            <Button variant="outline" size="sm" onClick={() => onEdit(recipe)}><Icon svg={ICONS.edit} className="mr-2 w-3.5 h-3.5" /> Editar</Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(recipe)}><Icon svg={ICONS.trash} className="mr-2 w-3.5 h-3.5" /> Eliminar</Button>
          </div>
        </div>

        <div className="space-y-6 mt-6">
          {/* Cost & Pricing Section */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Análisis de Costos y Precios</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500">Costo Total</p>
                <p className="text-2xl font-bold">{formatCost(costData.costoTotal)}</p>
              </div>
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500">Margen Actual</p>
                <p className={`text-2xl font-bold ${getMarginTextColor(margin)}`}>{margin.toFixed(1)}%</p>
              </div>
            </div>
            <div className="mt-4 bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Precios Sugeridos</p>
              <div className="flex justify-between items-center text-xs">
                <span>Rentable (x3) <br /><strong className="text-sm">{formatCost(pricingData.precioMinimoRentable)}</strong></span>
                <span>Recomendado (x4) <br /><strong className="text-sm">{formatCost(pricingData.precioRecomendado)}</strong></span>
                <span>Premium (x5) <br /><strong className="text-sm">{formatCost(pricingData.precioPremium)}</strong></span>
              </div>
            </div>
          </div>

          {/* Ingredient Breakdown */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Desglose de Ingredientes</h3>
            <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="p-3 text-left font-medium text-slate-500">Ingrediente</th>
                    <th className="p-3 text-right font-medium text-slate-500">Cantidad</th>
                    <th className="p-3 text-right font-medium text-slate-500">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.costoPorIngrediente.map((ing, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{ing.nombre}</td>
                      <td className="p-3 text-right text-slate-500 font-mono">{ing.cantidad} {ing.unidad}</td>
                      <td className="p-3 text-right font-medium text-slate-700 dark:text-slate-200">{formatCost(ing.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {recipe.preparacion && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Preparación</h3>
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {recipe.preparacion}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Acciones Avanzadas</h4>
        <RecipeActionsPanel recipe={recipe} allIngredients={allIngredients} onNavigate={onNavigate} onDuplicate={onDuplicate} onToolToggle={onToolToggle} />
      </div>
    </Card>
  );
};
