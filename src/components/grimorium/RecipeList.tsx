import React from 'react';
import { Recipe } from '../../types';
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

  // Toolbar Props
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  availableCategories: string[];
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  selectedRecipeId,
  onSelectRecipe,
  onAddRecipe,
  onDragStart,

  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedStatus,
  onStatusChange,
  onDelete
}) => {
  const { compactMode } = useUI();

  // If no recipes AND no search/filters active, show empty state? 
  // Actually, we want to show the toolbar even if empty, so user can clear filters or search.
  // We'll move the empty check inside the content area.

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar Header (Integrated) */}
      <div className="p-4 border-b border-white/10 flex flex-nowrap items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 group min-w-[120px]">
          <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar receta..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        {/* Category Filter */}
        <div className="relative shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="appearance-none w-32 pl-3 pr-8 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <option value="all">Categoría</option>
            {availableCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-indigo-500 pointer-events-none" />
        </div>

        {/* Status Filter */}
        <div className="relative shrink-0 hidden sm:block">
          <select
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
            className="appearance-none w-28 pl-3 pr-8 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/50 text-violet-700 dark:text-violet-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
          >
            <option value="all">Estado</option>
            <option value="Idea">Idea</option>
            <option value="Pruebas">Pruebas</option>
            <option value="Terminado">Carta</option>
            <option value="Archivada">Archivada</option>
          </select>
          <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-violet-500 pointer-events-none" />
        </div>

        {/* Delete Action (Square Icon) */}
        {selectedRecipeId && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shrink-0 w-9 h-9 rounded-lg"
            title="Eliminar receta"
          >
            <Icon svg={ICONS.trash} className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Icon svg={ICONS.book} className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No hay recetas</h3>
            <Button variant="ghost" className="text-indigo-500" onClick={onAddRecipe}>Crear una</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recipes.map((recipe, index) => {
              const mainCategory = recipe.categorias?.[0] || 'General';
              const isDone = recipe.categorias?.includes('Carta') || recipe.categorias?.includes('Terminado');

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
                        €{(recipe.costoTotal || 0).toFixed(2)}
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
        )}
      </div>
    </div>
  );
};
