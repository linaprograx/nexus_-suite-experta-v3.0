import React from 'react';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../modules/costing/costCalculator';
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

  // Bulk Selection Props
  selectedRecipeIds: string[];
  onToggleSelection: (id: string, multi?: boolean) => void;
  onSelectAll: (select: boolean) => void;
  onDeleteSelected: () => void;
  onImport: () => void;
  isLoading?: boolean;
  allIngredients: Ingredient[]; // Add this
}

// Skeleton Component
const RecipeCardSkeleton = () => (
  <div className="w-full relative h-[140px] rounded-2xl p-4 bg-white/20 dark:bg-slate-900/20 border border-white/10 overflow-hidden animate-pulse">
    <div className="flex items-start gap-3">
      <div className="h-16 w-16 rounded-xl bg-slate-300 dark:bg-slate-700/50" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 bg-slate-300 dark:bg-slate-700/50 rounded w-3/4" />
        <div className="flex gap-1">
          <div className="h-3 w-12 bg-slate-300 dark:bg-slate-700/50 rounded-full" />
          <div className="h-3 w-10 bg-slate-300 dark:bg-slate-700/50 rounded-full" />
        </div>
      </div>
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 mt-3">
      <div className="h-8 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
      <div className="h-8 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
    </div>
  </div>
);

// Memoized Recipe Card
const RecipeCard = React.memo(({
  recipe,
  isViewing,
  isSelected,
  onSelect,
  onToggleSelection,
  onDragStart,
  allIngredients
}: {
  recipe: Recipe,
  isViewing: boolean,
  isSelected: boolean,
  onSelect: (r: Recipe) => void,
  onToggleSelection: (id: string) => void,
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void,
  allIngredients: Ingredient[]
}) => {
  const mainCategory = recipe.categorias?.[0] || 'General';
  const isDone = recipe.categorias?.includes('Carta') || recipe.categorias?.includes('Terminado');

  // Calculate cost dynamically to ensure consistency with Detail Panel
  const costData = React.useMemo(() => {
    return calculateRecipeCost(recipe, allIngredients);
  }, [recipe, allIngredients]);

  const displayCost = costData?.costoTotal || recipe.costoTotal || recipe.costoReceta || 0;

  return (
    <div className="w-full relative group">
      <div
        onClick={() => onSelect(recipe)}
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart && onDragStart(e, recipe)}
        className={cn(
          "relative flex flex-col gap-3 rounded-2xl p-4 cursor-pointer transition-all duration-300 overflow-hidden h-full",
          isViewing
            ? "bg-indigo-600 shadow-xl shadow-indigo-900/20 scale-[1.02] ring-0 z-10"
            : "bg-white/30 dark:bg-slate-900/30 border border-white/10 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:shadow-lg hover:-translate-y-1 backdrop-blur-md"
        )}
      >
        {/* Checkbox Overlay */}
        <div
          className="absolute top-3 right-3 z-20"
          onClick={(e) => { e.stopPropagation(); onToggleSelection(recipe.id); }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className={cn(
              "w-5 h-5 rounded border-2 transition-all cursor-pointer",
              isViewing ? "border-white/50 text-indigo-600" : "border-slate-300 text-indigo-600",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>

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

          <div className="min-w-0 flex-1 pr-6"> {/* pr-6 for checkbox space */}
            <p className={cn("font-bold text-lg truncate leading-tight mb-1",
              isViewing ? "text-white" : "text-slate-900 dark:text-white"
            )}>
              {recipe.nombre}
            </p>
            <div className="flex flex-wrap gap-1">
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide",
                isViewing ? "bg-white/20 text-indigo-100" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              )}>
                {mainCategory}
              </span>
              {isDone && (
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide",
                  isViewing ? "bg-emerald-500/30 text-emerald-100" : "bg-emerald-100 text-emerald-700"
                )}>Carta</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Financials (Compact) */}
        <div className={cn("flex items-center justify-between pt-3 border-t mt-1",
          isViewing ? "border-white/20" : "border-slate-100 dark:border-slate-800"
        )}>
          <div className="flex flex-col">
            <span className={cn("text-[10px] uppercase tracking-wider", isViewing ? "text-indigo-200" : "text-slate-400")}>Costo</span>
            <span className={cn("font-bold font-mono", isViewing ? "text-white" : "text-slate-700 dark:text-slate-300")}>
              €{displayCost.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className={cn("text-[10px] uppercase tracking-wider", isViewing ? "text-indigo-200" : "text-slate-400")}>Venta</span>
            <span className={cn("font-bold font-mono", isViewing ? "text-white" : "text-slate-900 dark:text-white")}>
              {recipe.precioVenta ? `€${recipe.precioVenta.toFixed(2)}` : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export const RecipeList: React.FC<RecipeListProps> = ({
  recipes,
  selectedRecipeId, // Viewing
  onSelectRecipe, // Viewing
  onAddRecipe,
  onDragStart,

  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  availableCategories,
  selectedStatus,
  onStatusChange,

  selectedRecipeIds = [],
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  onImport,
  isLoading = false,
  allIngredients // Destructure
}) => {
  const { compactMode } = useUI();

  // Deduplicate recipes
  const uniqueRecipes = React.useMemo(() => {
    if (!recipes) return [];
    const seen = new Set();
    return recipes.filter(r => {
      const duplicate = seen.has(r.id);
      seen.add(r.id);
      return !duplicate;
    });
  }, [recipes]);

  return (
    <div className="h-full flex flex-col w-full max-w-full">
      {/* Toolbar Header */}
      <div className="py-4 flex flex-col gap-4 w-full">
        {/* Search Bar - Full Width */}
        <div className="relative w-full group">
          <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar receta..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 w-full">
          <select
            className="h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-emerald-500/50 flex-1 min-w-[120px]"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {Array.from(new Set(availableCategories)).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <select
            className="h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-emerald-500/50 flex-1 min-w-[120px]"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="Idea">Idea</option>
            <option value="Pruebas">Pruebas</option>
            <option value="Terminado">Carta</option>
            <option value="Archivada">Archivada</option>
          </select>

          {/* Delete Selected Button */}
          {selectedRecipeIds.length > 0 && (
            <Button
              variant="destructive"
              className="h-10 px-4 ml-auto whitespace-nowrap"
              onClick={onDeleteSelected}
              title="Eliminar seleccionadas"
            >
              <Icon svg={ICONS.trash} className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">({selectedRecipeIds.length})</span>
            </Button>
          )}

          {/* Import Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onImport}
            className="h-10 w-10 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            title="Importar Receta"
          >
            <Icon svg={ICONS.upload} className="w-4 h-4" />
          </Button>

          {/* NEW RECIPE BUTTON */}
          <Button
            onClick={onAddRecipe}
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/20 h-10 w-10 p-0 rounded-xl transition-all hover:scale-105 active:scale-95 ml-1"
            title="Nueva Receta"
          >
            <Icon svg={ICONS.plus} className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* List Header (Actions) */}
      <div className="px-1 py-2 flex items-center justify-between text-xs text-slate-500 mb-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={uniqueRecipes.length > 0 && selectedRecipeIds.length === uniqueRecipes.length}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>Seleccionar todo</span>
        </div>
        <span className="italic">{isLoading ? 'Cargando...' : `${uniqueRecipes.length} recetas`}</span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
            {Array.from({ length: 6 }).map((_, i) => (
              <RecipeCardSkeleton key={i} />
            ))}
          </div>
        ) : uniqueRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-60">
            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <Icon svg={ICONS.book} className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No se encontraron recetas</p>
            <p className="text-sm text-slate-400 mt-1">Intenta con otros filtros o crea una nueva</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
            {uniqueRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isViewing={selectedRecipeId === recipe.id}
                isSelected={selectedRecipeIds.includes(recipe.id)}
                onSelect={onSelectRecipe}
                onToggleSelection={onToggleSelection}
                onDragStart={onDragStart}
                allIngredients={allIngredients} // Pass it down
              />
            ))}
          </div>
        )}
      </div>
    </div >
  );
};
