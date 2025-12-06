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
        {recipes.map((recipe) => {
          const mainCategory = recipe.categorias?.[0] || 'General';
          const isIdea = recipe.categorias?.includes('Idea');
          const isTesting = recipe.categorias?.includes('Pruebas') || recipe.categorias?.includes('En pruebas');
          const isDone = recipe.categorias?.includes('Carta') || recipe.categorias?.includes('Terminado');

          let statusLabel = 'Borrador';
          let statusColor = 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

          if (isDone) { statusLabel = 'Activa'; statusColor = 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'; }
          else if (isTesting) { statusLabel = 'En pruebas'; statusColor = 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'; }
          else if (isIdea) { statusLabel = 'Idea'; statusColor = 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'; }

          const isSelected = selectedRecipeId === recipe.id;

          return (
            <div
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              draggable={!!onDragStart}
              onDragStart={(e) => onDragStart && onDragStart(e, recipe)}
              className={cn(
                "flex items-center gap-4 rounded-2xl border bg-white/40 dark:bg-slate-900/40 backdrop-blur-md px-4 py-3 mb-3 cursor-pointer shadow-sm hover:shadow-md hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all",
                isSelected ? "border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/30" : "border-white/10 dark:border-white/5"
              )}
            >
              {/* Thumbnail */}
              <div className="relative shrink-0">
                {recipe.imageUrl ? (
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.nombre}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover shadow-sm bg-slate-100 dark:bg-slate-800"
                  />
                ) : (
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-sm text-white font-bold text-lg">
                    {recipe.nombre.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={cn("font-bold text-slate-900 dark:text-white truncate", compactMode ? "text-sm" : "text-base")}>
                  {recipe.nombre}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {mainCategory} • {statusLabel}
                </p>
              </div>

              {/* Status Badge */}
              <span className={cn(
                "hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium shrink-0",
                statusColor
              )}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
