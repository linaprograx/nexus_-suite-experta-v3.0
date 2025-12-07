import React from 'react';
import { Recipe } from '../../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';

// Simple utility for class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface RecipeListProps {
  recipes: Recipe[];
  selectedRecipeId: string | null;
  onSelectRecipe: (recipe: Recipe) => void;
  onAddRecipe: () => void;
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  selectedRecipeId,
  onSelectRecipe,
  onAddRecipe,
  onDragStart,
}) => {
  const { compactMode } = useUI();

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/50 dark:bg-slate-900/20 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
          <Icon svg={ICONS.book} className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No hay recetas</h3>
        <p className="text-slate-500 dark:text-slate-400 mb-4 max-w-xs">
          No se encontraron recetas con los filtros actuales o aún no has creado ninguna.
        </p>
        <Button onClick={onAddRecipe}>Crear primera receta</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recipes.map((recipe) => {
            const mainCategory = recipe.categorias?.[0] || 'General';
            const isDone = recipe.categorias?.includes('Carta') || recipe.categorias?.includes('Terminado');

            let statusLabel = 'Borrador';
            let statusColor = 'bg-slate-100 text-slate-600';

            if (isDone) { statusLabel = 'Activa'; statusColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'; }

            const isSelected = selectedRecipeId === recipe.id;

            return (
              <div
                key={recipe.id}
                onClick={() => onSelectRecipe(recipe)}
                draggable={!!onDragStart}
                onDragStart={(e) => onDragStart && onDragStart(e, recipe)}
                className={cn(
                  "relative flex flex-col gap-3 rounded-2xl p-4 cursor-pointer transition-all duration-300 group overflow-hidden",
                  isSelected
                    ? "bg-indigo-600 shadow-xl shadow-indigo-900/20 scale-[1.02] ring-0 z-10"
                    : "bg-white/30 dark:bg-slate-900/30 border border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:shadow-lg hover:-translate-y-1 backdrop-blur-md"
                )}
              >
                {/* Header: Thumb + Title */}
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.nombre}
                        className="h-16 w-16 rounded-xl object-cover shadow-sm bg-slate-100 dark:bg-slate-800"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm text-white font-bold text-xl">
                        {recipe.nombre.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={cn("font-bold text-lg truncate leading-tight mb-1",
                      isSelected ? "text-white" : "text-slate-900 dark:text-white"
                    )}>
                      {recipe.nombre}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide",
                        isSelected ? "bg-white/20 text-indigo-100" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      )}>
                        {mainCategory}
                      </span>
                      {isDone && (
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide",
                          isSelected ? "bg-emerald-500/30 text-emerald-100" : "bg-emerald-100 text-emerald-700"
                        )}>Carta</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: Financials (Compact) */}
                <div className={cn("flex items-center justify-between pt-3 border-t mt-1",
                  isSelected ? "border-white/20" : "border-slate-100 dark:border-slate-800"
                )}>
                  <div className="flex flex-col">
                    <span className={cn("text-[10px] uppercase tracking-wider", isSelected ? "text-indigo-200" : "text-slate-400")}>Costo</span>
                    <span className={cn("font-bold font-mono", isSelected ? "text-white" : "text-slate-700 dark:text-slate-300")}>
                      €{(recipe.costoReceta || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className={cn("text-[10px] uppercase tracking-wider", isSelected ? "text-indigo-200" : "text-slate-400")}>Venta</span>
                    <span className={cn("font-bold font-mono", isSelected ? "text-white" : "text-slate-900 dark:text-white")}>
                      {recipe.precioVenta ? `€${recipe.precioVenta.toFixed(2)}` : '-'}
                    </span>
                  </div>
                </div>

                {/* Selection Indicator Icon */}
                {isSelected && (
                  <div className="absolute top-2 right-2 text-white/20">
                    <Icon svg={ICONS.check} className="w-12 h-12 -rotate-12" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
