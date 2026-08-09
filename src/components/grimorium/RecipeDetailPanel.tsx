import React from 'react';
import { Recipe, Ingredient } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';
import { RecipeActionsPanel } from '../../features/recipes/ui/RecipeActionsPanel';
import { ViewName } from '../../types';

import { calculateRecipeCost, CostedIngredient } from '../../core/costing/costCalculator';
import { printRecipeCard } from './printRecipeCard';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import { formatCost, getMarginBgColor } from '../../core/costing/costFormatter';
import { calculateRecipeProfitability } from '../../core/costing/profitabilityEngine';
import { ETIQUETA_NIVEL } from '../../core/costing/businessCostSettings';
import { useBusinessCostSettings } from '../../hooks/useBusinessCostSettings';


export const RecipeDetailPanel: React.FC<{
  recipe: Recipe | null;
  allIngredients: Ingredient[];
  allRecipes?: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onNavigate: (view: ViewName, data?: any) => void;
  onClose: () => void;
  onToolToggle?: (isOpen: boolean) => void;
  onEscandallo?: () => void;
  onBatcher?: () => void;
  onProduce?: (recipe: Recipe) => void;
}> = ({ recipe, allIngredients, allRecipes = [], onEdit, onDelete, onDuplicate, onNavigate, onClose, onToolToggle, onEscandallo, onBatcher, onProduce }) => {
  const { compactMode } = useUI();
  const { menu, addToMenu, removeFromMenu } = useActiveMenu();
  const { ajustes } = useBusinessCostSettings();

  // Coste de ingredientes. Se conserva porque lo necesitan el desglose por
  // líneas y el EXPORTADOR (`printRecipeCard`), que espera esta forma exacta.
  const costData = React.useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeCost(recipe, allIngredients, undefined, allRecipes);
  }, [recipe, allIngredients, allRecipes]);

  /**
   * Rentabilidad. **Fuente única de las cifras económicas de la ficha.**
   *
   * Antes esta pantalla calculaba el margen a mano —(precio − coste de
   * ingredientes) / precio—, coloreaba con umbrales propios (75/67) y sugería
   * precio multiplicando el coste por 3, 4 y 5. Tres criterios inventados aquí,
   * que discrepaban de Escandallo sobre la misma receta en cuanto el negocio
   * configuraba merma, comisiones, mano de obra o impuestos.
   */
  const p = React.useMemo(() => {
    if (!recipe) return null;
    return calculateRecipeProfitability({ recipe, allIngredients, allRecipes, settings: ajustes });
  }, [recipe, allIngredients, allRecipes, ajustes]);

  if (!recipe || !costData || !p) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center w-full max-w-[95%] mx-auto">
        <Icon svg={ICONS.layout} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Selecciona una receta para ver los detalles</p>
      </Card>
    );
  }

  const margin = p.grossMarginPercentage;
  const nivel = ETIQUETA_NIVEL[p.nivel];
  const margenObjetivo = 100 - ajustes.targetBeverageCostPercentage;

  return (
    <Card className="h-full min-h-0 flex flex-col bg-transparent backdrop-blur-md border-0 shadow-none overflow-hidden">
      {/* Reduced padding from p-8 to p-4/p-6 to fit better in sidebar */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 md:p-6 w-full mx-auto">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.nombre} className="w-full h-48 rounded-2xl object-cover mb-4 shadow-sm" />
        ) : (
          <div className="w-full h-48 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 mb-4 flex items-center justify-center shadow-sm">
            <span className="text-6xl font-bold text-white/50">{recipe.nombre.substring(0, 2).toUpperCase()}</span>
          </div>
        )}
        <div className="flex justify-between items-start gap-3 mb-6">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white leading-tight drop-shadow-sm flex-1 min-w-0">{recipe.nombre}</h2>
          <button onClick={onClose} className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <Icon svg={ICONS.x} className="w-4 h-4" />
          </button>
        </div>

        {/* Primary actions — clear, balanced buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => onEdit(recipe)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-teal-900/20 transition-all hover:-translate-y-0.5"
          >
            <Icon svg={ICONS.edit} className="w-4 h-4" /> Editar
          </button>
          {(() => {
            const onMenu = menu.find(m => m.recipeId === recipe.id);
            return (
              <button
                onClick={() => onMenu
                  ? removeFromMenu(onMenu.id)
                  : addToMenu({
                    recipeId: recipe.id,
                    nombre: recipe.nombre,
                    precioVenta: recipe.precioVenta || 0,
                    // OJO: el snapshot va en COSTE DE INGREDIENTES a propósito.
                    // `utils/menuDrift.ts:42` compara este valor contra
                    // `calculateRecipeCost(...).costoTotal`. Guardar aquí el
                    // coste servido haría que toda la carta apareciese desviada
                    // el día del cambio, sin que nada hubiera cambiado.
                    // Migrar menuDrift al motor es trabajo aparte: exige volver
                    // a congelar los snapshots ya guardados.
                    costSnapshot: costData.costoTotal || 0,
                    marginSnapshot: recipe.precioVenta
                      ? ((recipe.precioVenta - costData.costoTotal) / recipe.precioVenta) * 100
                      : 0,
                  })}
                title={onMenu ? 'Quitar de la carta' : 'Añadir a la carta activa'}
                className={`shrink-0 px-3.5 py-2.5 rounded-xl border transition-colors ${onMenu
                  ? 'bg-teal-600 border-teal-600 text-white hover:bg-teal-700'
                  : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'}`}
              >
                <Icon svg={ICONS.book} className="w-4 h-4" />
              </button>
            );
          })()}
          {onProduce && (
            <button
              onClick={() => onProduce(recipe)}
              title="Producir / servir — descuenta del stock"
              className="shrink-0 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <Icon svg={ICONS.flask} className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => printRecipeCard(recipe, costData, allRecipes)}
            title="Imprimir ficha técnica"
            className="shrink-0 px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Icon svg={ICONS.fileText} className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDuplicate(recipe)}
            title="Duplicar receta"
            className="shrink-0 px-3.5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Icon svg={ICONS.copy || ICONS.layout} className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(recipe)}
            title="Eliminar receta"
            className="shrink-0 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
          >
            <Icon svg={ICONS.trash} className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 mt-6">
          {/* Cost & Pricing Section */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Análisis de Costos y Precios</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500">Costo Total</p>
                <p className="text-xl font-bold">{formatCost(p.realServedCost)}</p>
                {(recipe.porciones || 1) > 1 && (
                  <p className="text-[11px] text-slate-400 mt-0.5">{formatCost(p.realServedCost / (recipe.porciones || 1))} · {recipe.porciones} porciones</p>
                )}
              </div>
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500">Margen Actual</p>
                <p className={`text-xl font-bold ${nivel.clase}`}>{margin.toFixed(1)}%</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{nivel.texto} · objetivo {margenObjetivo}%</p>
              </div>
            </div>
            <div className="mt-3 bg-white/40 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Precios Sugeridos</p>
              <div className="flex justify-between items-center text-[10px] sm:text-xs">
                {/* Los tres precios de antes eran el coste × 3, × 4 y × 5: unos
                    multiplicadores que nadie había elegido y que ignoraban el
                    objetivo del negocio, el redondeo y los impuestos. Ahora la
                    referencia es el precio objetivo del motor. */}
                <div className="text-center">
                  <span className="text-slate-400 block mb-0.5">Objetivo ({ajustes.targetBeverageCostPercentage}%)</span>
                  <strong className="text-slate-700 dark:text-slate-200">{formatCost(p.precioObjetivoCliente)}</strong>
                </div>
                <div className="bg-slate-200 dark:bg-slate-700 w-px h-6 mx-1"></div>
                <div className="text-center">
                  <span className="text-slate-400 block mb-0.5">Actual</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{formatCost(p.precioFinalCliente)}</strong>
                </div>
                <div className="bg-slate-200 dark:bg-slate-700 w-px h-6 mx-1"></div>
                <div className="text-center">
                  <span className="text-slate-400 block mb-0.5">Beneficio/ud</span>
                  <strong className="text-purple-600 dark:text-purple-400">{formatCost(p.grossProfit)}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredient Breakdown */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Desglose de Ingredientes</h3>
            <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="p-2 text-left font-medium text-slate-500 w-1/2">Ingrediente</th>
                    <th className="p-2 text-right font-medium text-slate-500 w-1/4">Cant.</th>
                    <th className="p-2 text-right font-medium text-slate-500 w-1/4">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {costData.costoPorIngrediente.map((ing: any, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-2 font-medium text-slate-700 dark:text-slate-200 truncate max-w-[120px]" title={ing.nombre}>{ing.nombre}</td>
                      <td className="p-2 text-right text-slate-500 font-mono whitespace-nowrap">{ing.cantidad} {ing.unidad}</td>
                      <td className="p-2 text-right font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{formatCost(ing.costo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coctelería specs — technique / glassware / ice / garnish / ABV */}
          {(recipe.technique || recipe.glassware || recipe.ice || recipe.garnish || recipe.abv != null) && (
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Técnica', value: recipe.technique },
                { label: 'Cristalería', value: recipe.glassware },
                { label: 'Hielo', value: recipe.ice },
                { label: 'Garnish', value: recipe.garnish },
                { label: 'ABV', value: recipe.abv != null ? `${recipe.abv}%` : '' },
              ].filter(s => s.value).map(s => (
                <div key={s.label} className="flex flex-col px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{s.label}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {(recipe as any).preparacion && (
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Preparación</h3>
              <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {(recipe as any).preparacion}
              </div>
            </div>
          )}

          {/* Tools & customizations (escandallo, batch…) */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Herramientas</h3>
            <RecipeActionsPanel
              recipe={recipe}
              allIngredients={allIngredients}
              onNavigate={onNavigate}
              onDuplicate={onDuplicate}
              onToolToggle={onToolToggle}
            />
          </div>
        </div>
      </div >


    </Card >
  );
};
