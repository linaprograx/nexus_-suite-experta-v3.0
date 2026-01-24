import React from 'react';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { RecipeFinancialDashboard } from './RecipeFinancialDashboard';
import { IngredientFinancialDashboard } from './IngredientFinancialDashboard';
import { Recipe, Ingredient } from '../../types';
import { useApp } from '../../context/AppContext';

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

  // Filters
  ingredientSearchTerm?: string;
  onIngredientSearchChange?: (s: string) => void;
  ingredientFilters?: any;
  onIngredientFilterChange?: (k: string, v: any) => void;
  stats?: any;
  onOpenSuppliers?: () => void;
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
  onIngredientFilterChange,
  onOpenSuppliers,
}) => {
  const { db, userId } = useApp();

  return (
    <div className="h-full flex flex-col gap-0 border-r-0 border-transparent bg-transparent">

      {/* SECTION 1: TOP (Providers / Active Filters) - Only for Ingredients Tab */}
      {activeTab === 'ingredients' && (
        <div className="h-auto flex flex-col min-h-0">
          <div className="p-4">
            <button
              onClick={onOpenSuppliers}
              className="w-full text-left px-5 py-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 border border-white/10 transition-all group flex items-center justify-between relative overflow-hidden"
            >
              <div className="relative z-10 flex items-center gap-4">
                <span className="p-3 bg-white/20 rounded-xl backdrop-blur-md text-white">
                  <Icon svg={ICONS.user} className="w-6 h-6" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white mb-0.5">Proveedores</h3>
                  <p className="text-emerald-100/90 text-xs text-medium">Gestionar mercado</p>
                </div>
              </div>

              <div className="relative z-10 p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors">
                <Icon svg={ICONS.chevronRight} className="w-4 h-4 text-white" />
              </div>

              {/* Decorative */}
              <Icon svg={ICONS.grid} className="absolute -bottom-2 -right-2 w-24 h-24 text-white/10 -rotate-12 pointer-events-none" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 2: BOTTOM (Actions / Dashboards) */}
      <div className={`flex-1 flex flex-col min-h-0 ${activeTab === 'ingredients' ? 'h-1/2' : 'h-full'}`}>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 w-full max-w-full mx-auto">
          {activeTab === 'recipes' ? (
            <RecipeFinancialDashboard selectedRecipe={selectedRecipe} allRecipes={allRecipes} />
          ) : (
            <IngredientFinancialDashboard
              selectedIngredient={selectedIngredient}
              allIngredients={allIngredients}
              onFilterByStatus={(status) => onIngredientFilterChange && onIngredientFilterChange('status', status)}
            />
          )}
        </div>

        {/* Legacy Actions */}
        <div className="p-4 space-y-2">
          {activeTab === 'recipes' && (
            <>
              <Button variant="outline" className="w-full justify-start text-xs h-9" onClick={onImportPdf}>
                <Icon svg={ICONS.fileText} className="mr-2 h-3 w-3" />
                Importar PDF PRO
              </Button>
              <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 bg-white/40 dark:bg-slate-800/40" onClick={onImportRecipes}>
                <Icon svg={ICONS.upload} className="mr-2 h-3 w-3" /> Imp. TXT
              </Button>
            </>
          )}
          {/* Floating Action Button removed as per request */}
        </div>
      </div>
    </div>
  );
};

// Internal component to safely use the hook without cluttering the main component props if we want self-contained data fetching
// Or we could pass suppliers as props. For now, self-contained is easier for the refactor.
import { useSuppliers } from '../../features/suppliers/hooks/useSuppliers';

const SuppliersList = ({ db, userId }: { db: any, userId: string }) => {
  const { suppliers, loading } = useSuppliers({ db, userId });

  if (loading) return <div className="text-xs text-slate-400 p-2">Cargando proveedores...</div>;

  if (suppliers.length === 0) return (
    <div className="text-xs text-slate-400 p-2 italic border border-dashed border-slate-300 rounded-lg">
      No hay proveedores activos.
    </div>
  );

  return (
    <div className="space-y-2">
      {suppliers.map(s => (
        <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-white/40 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors cursor-pointer group">
          <div className="flex flex-wrap items-center gap-2 w-full">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.name}</span>
            <span className="text-[10px] text-slate-500">{s.category} • {s.contactName?.split(' ')[0]}</span>
          </div>
          {/* Status Dot */}
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
        </div>
      ))}
    </div>
  );
};
