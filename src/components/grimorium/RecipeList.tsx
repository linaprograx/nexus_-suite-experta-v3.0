import React from 'react';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FranjaFondo } from '../layout/FranjaFondo';
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
  <div className="w-full relative aspect-[4/5] rounded-2xl bg-slate-200 dark:bg-slate-800/60 overflow-hidden animate-pulse">
    <div className="absolute inset-x-0 bottom-0 p-3.5 space-y-2">
      <div className="h-3 w-16 bg-slate-300 dark:bg-slate-700/50 rounded-full" />
      <div className="h-4 w-3/4 bg-slate-300 dark:bg-slate-700/50 rounded" />
      <div className="flex justify-between pt-2">
        <div className="h-5 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
        <div className="h-5 w-12 bg-slate-300 dark:bg-slate-700/50 rounded" />
      </div>
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
  allIngredients,
  allRecipes = []
}: {
  recipe: Recipe,
  isViewing: boolean,
  isSelected: boolean,
  onSelect: (r: Recipe) => void,
  onToggleSelection: (id: string) => void,
  onDragStart?: (e: React.DragEvent, recipe: Recipe) => void,
  allIngredients: Ingredient[],
  allRecipes?: Recipe[]
}) => {
  const mainCategory = recipe.categorias?.[0] || 'General';
  const isDone = recipe.categorias?.includes('Carta') || recipe.categorias?.includes('Terminado');

  // Calculate cost dynamically to ensure consistency with Detail Panel (incl. sub-recipes)
  const costData = React.useMemo(() => {
    return calculateRecipeCost(recipe, allIngredients, undefined, allRecipes);
  }, [recipe, allIngredients, allRecipes]);

  const displayCost = costData?.costoTotal || recipe.costoTotal || recipe.costoReceta || 0;

  return (
    <div className="w-full relative group">
      <div
        onClick={() => onSelect(recipe)}
        draggable={!!onDragStart}
        onDragStart={(e) => onDragStart && onDragStart(e, recipe)}
        className={cn(
          "relative aspect-[4/5] rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden",
          "hover:-translate-y-1 hover:shadow-xl",
          isViewing
            ? "ring-2 ring-teal-400 shadow-xl shadow-teal-900/30 z-10"
            : "shadow-md ring-1 ring-black/5 dark:ring-white/5"
        )}
      >
        {/* Full-bleed image or gradient placeholder */}
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.nombre}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center">
            <span className="text-white font-black text-5xl opacity-40 tracking-tight">{recipe.nombre.substring(0, 2).toUpperCase()}</span>
          </div>
        )}

        {/* Readability gradient over the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />

        {/* Checkbox */}
        <div
          className="absolute top-2.5 right-2.5 z-20"
          onClick={(e) => { e.stopPropagation(); onToggleSelection(recipe.id); }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            readOnly
            className={cn(
              "w-5 h-5 rounded border-2 border-white/70 bg-black/20 backdrop-blur-sm text-teal-500 transition-all cursor-pointer",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
          />
        </div>

        {/* Content overlaid at the bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
          <div className="flex flex-wrap gap-1 mb-1.5">
            <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wide bg-white/20 backdrop-blur-sm border border-white/10">
              {mainCategory}
            </span>
            {isDone && (
              <span className="text-[9px] px-2 py-0.5 rounded-full uppercase font-black tracking-wide bg-emerald-500/40 text-emerald-50 border border-emerald-300/20">Carta</span>
            )}
          </div>
          <p className="font-black text-lg leading-tight tracking-tight line-clamp-2 drop-shadow-md">{recipe.nombre}</p>

          <div className="flex items-end justify-between mt-2.5 pt-2.5 border-t border-white/15">
            <div>
              <span className="text-[9px] uppercase tracking-wider text-white/60 block leading-none mb-0.5">Costo</span>
              <span className="font-bold font-mono text-sm">€{displayCost.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-white/60 block leading-none mb-0.5">Venta</span>
              <span className="font-bold font-mono text-sm text-emerald-300">{recipe.precioVenta ? `€${recipe.precioVenta.toFixed(2)}` : '—'}</span>
            </div>
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
    <div className="lg:h-full flex flex-col w-full max-w-full">
      {/* Toolbar Header */}
      <div
          className="py-4 flex flex-col gap-4 w-full sticky lg:static z-20"
          style={{ top: 'calc(env(safe-area-inset-top) + var(--franja-alto, 0px))' }}
        >
        <FranjaFondo />
        {/* Search Bar - Full Width */}
        <div className="relative w-full group">
          <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o ingrediente..."
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
            className="h-10 w-10 text-slate-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20"
            title="Importar Receta"
          >
            <Icon svg={ICONS.upload} className="w-4 h-4" />
          </Button>

          {/* NEW RECIPE BUTTON — brand gradient, prominent */}
          <button
            onClick={onAddRecipe}
            className="group flex items-center gap-2 h-10 pl-3 pr-4 ml-1 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
            title="Nueva Receta"
          >
            <Icon svg={ICONS.plus} className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="hidden sm:inline">Nueva</span>
          </button>
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

      {/* El scroll interno solo en escritorio. En móvil scrollea la página: un
          contenedor de scroll intermedio se convierte en el ancla del `sticky`
          de la barra de filtros y, como nunca llega a scrollear, el `sticky`
          no se activaba. Es la regla que ya seguían los otros dos paneles. */}
      <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar p-0 w-full">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 px-0.5 pb-20">
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
          <div className="grid grid-cols-2 gap-4 px-0.5 pb-20">
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
                allRecipes={recipes}
              />
            ))}
          </div>
        )}
      </div>
    </div >
  );
};
