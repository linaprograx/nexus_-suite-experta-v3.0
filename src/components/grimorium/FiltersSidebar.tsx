import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { RecipeFinancialDashboard } from './RecipeFinancialDashboard';
import { IngredientFinancialDashboard } from './IngredientFinancialDashboard';
import { Recipe, Ingredient } from '../../../types';

interface FiltersSidebarProps {
  activeTab: 'recipes' | 'ingredients';
  allRecipes: Recipe[];
  selectedRecipe: Recipe | null;
  allIngredients?: Ingredient[];
  selectedIngredient: Ingredient | null;

  // Actions
  onImportRecipes: () => void;
  onImportPdf: () => void;
  onOpenIngredients: () => void;
  onImportIngredients: () => void;

  // Unused but kept for interface compatibility if needed, or can be removed if parent doesn't complain.
  // Ideally parent GrimoriumView passes these no-ops or we make them optional.
  // For now, I'll keep them optional in interface or just ignore them.
  ingredientSearchTerm?: string;
  onIngredientSearchChange?: (s: string) => void;
  ingredientFilters?: any;
  onIngredientFilterChange?: (k: string, v: any) => void;
  stats?: any;
}

export const FiltersSidebar: React.FC<FiltersSidebarProps> = ({
  activeTab,
  allRecipes,
  selectedRecipe,
  allIngredients = [],
  selectedIngredient,
  onImportRecipes,
  onImportPdf,
  onImportIngredients,
}) => {

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        {activeTab === 'recipes' ? (
          <RecipeFinancialDashboard selectedRecipe={selectedRecipe} allRecipes={allRecipes} />
        ) : (
          <IngredientFinancialDashboard selectedIngredient={selectedIngredient} allIngredients={allIngredients} />
        )}
      </div>

      {/* Legacy Actions - kept as requested to "integrate" but mainly cleaned up */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
        {activeTab === 'recipes' && (
          <Button variant="outline" className="w-full justify-start" onClick={onImportPdf}>
            <Icon svg={ICONS.fileText} className="mr-2 h-4 w-4" />
            Importar PDF PRO
          </Button>
        )}

        {/* Small utilities at bottom */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
          <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={onImportRecipes}>
            <Icon svg={ICONS.upload} className="mr-2 h-3 w-3" /> Imp. TXT
          </Button>
          <Button variant="ghost" size="sm" className="justify-start text-xs" onClick={onImportIngredients}>
            <Icon svg={ICONS.upload} className="mr-2 h-3 w-3" /> Imp. CSV
          </Button>
        </div>
      </div>
    </div>
  );
};
