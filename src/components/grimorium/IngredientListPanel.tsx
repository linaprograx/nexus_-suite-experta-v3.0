import React, { useRef } from 'react';
import { Ingredient } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useProveedores } from '../../hooks/useProveedores';
import { useApp } from '../../context/AppContext';
import { CatalogoItem } from '../../types';

interface IngredientListPanelProps {
  ingredients: Ingredient[];
  selectedIngredientIds: string[];
  viewingIngredientId: string | null;
  onToggleSelection: (id: string) => void;
  onSelectAll: (select: boolean) => void;
  onDeleteSelected: () => void;
  onImportCSV: () => void;
  onEditIngredient: (ingredient: Ingredient) => void; // Used for "viewing"
  onNewIngredient: () => void;

  // Search & Filter Props
  ingredientSearchTerm: string;
  onIngredientSearchChange: (val: string) => void;
  ingredientFilters: { category: string; status: string };
  onIngredientFilterChange: (key: string, value: string) => void;
}

export const IngredientListPanel: React.FC<IngredientListPanelProps> = ({
  ingredients,
  selectedIngredientIds,
  viewingIngredientId,
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onImportCSV,
  onEditIngredient,
  onNewIngredient,

  ingredientSearchTerm,
  onIngredientSearchChange,
  ingredientFilters,
  onIngredientFilterChange
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null); // Added useRef

  // Extract unique categories for the filter dropdown
  const uniqueCategories = Array.from(new Set(ingredients.map(ing => ing.categoria)));

  // Providers Hook
  const { db, userId } = useApp();
  const { proveedores, getCatalogoForProveedor } = useProveedores({ db, userId });

  // Providers State
  const [selectedProveedorId, setSelectedProveedorId] = React.useState<string>('all');
  const [currentCatalogo, setCurrentCatalogo] = React.useState<CatalogoItem[]>([]);

  // Effect to load catalog when provider changes
  React.useEffect(() => {
    if (selectedProveedorId === 'all') {
      setCurrentCatalogo([]);
      return;
    }
    const loadCatalog = async () => {
      const data = await getCatalogoForProveedor(selectedProveedorId);
      setCurrentCatalogo(data);
    };
    loadCatalog();
  }, [selectedProveedorId, getCatalogoForProveedor]);

  // Combined Filter Logic
  const filteredIngredients = React.useMemo(() => {
    let result = ingredients;

    // A. Provider Filter (Double Validation)
    if (selectedProveedorId !== 'all') {
      result = result.filter(ing => {
        const isLinked = ing.proveedores?.includes(selectedProveedorId);
        const isInCatalog = currentCatalogo.some(item => item.ingredienteId === ing.id);
        return isLinked && isInCatalog;
      });
    }

    return result;
  }, [ingredients, selectedProveedorId, currentCatalogo]);

  return (
    <div className="h-full flex flex-col bg-transparent border-0 shadow-none w-full max-w-[97%] px-8">
      {/* Unique Integrated Header */}
      <div className="py-4 flex flex-col gap-4 w-full justify-start">
        {/* 1. Search Bar - Expands */}
        <div className="relative w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon svg={ICONS.search} className="h-4 w-4 text-emerald-500/50 group-focus-within:text-emerald-600 transition-colors" />
          </div>
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Buscar ingrediente..."
            className="pl-10 h-10 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-emerald-500/50 focus:border-emerald-500 rounded-xl w-full transition-all"
            value={ingredientSearchTerm}
            onChange={(e) => onIngredientSearchChange(e.target.value)}
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 w-full text-xs">
          <select
            className="h-10 pl-3 pr-8 bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-emerald-500/50 min-w-[120px]"
            value={ingredientFilters.category || 'all'}
            onChange={(e) => onIngredientFilterChange('category', e.target.value)}
          >
            <option value="all">Categoría</option>
            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <div className="h-6 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

          <div className="flex gap-1">
            <Button variant="outline" size="icon" onClick={onImportCSV} title="Importar CSV">
              <Icon svg={ICONS.upload} className="w-4 h-4" />
            </Button>
            {selectedIngredientIds.length > 0 && (
              <Button variant="destructive" size="icon" onClick={onDeleteSelected} title="Eliminar Seleccionados">
                <Icon svg={ICONS.trash} className="w-4 h-4" />
              </Button>
            )}

            {/* Provider Selector - Custom Premium Style */}
            <div className="relative group/prov">
              <select
                className="h-10 pl-3 pr-8 bg-white/20 hover:bg-white/30 backdrop-blur-xl rounded-xl text-slate-800 dark:text-slate-100 border-none focus:ring-2 focus:ring-emerald-500/50 transition-all cursor-pointer text-sm font-medium appearance-none min-w-[140px]"
                value={selectedProveedorId}
                onChange={(e) => setSelectedProveedorId(e.target.value)}
              >
                <option value="all" className="text-slate-800">Todos los productos</option>
                {proveedores.map(prov => (
                  <option key={prov.id} value={prov.id} className="text-slate-800">{prov.nombre}</option>
                ))}
              </select>
              {/* Custom Arrow because appearance-none removes default */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/prov:text-slate-800 dark:group-hover/prov:text-slate-200 transition-colors">
                <Icon svg={ICONS.chevronDown} className="w-3 h-3" />
              </div>
            </div>

            <Button onClick={onNewIngredient} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 h-10 w-10 p-0 rounded-xl transition-all hover:scale-105 active:scale-95">
              <Icon svg={ICONS.plus} className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* List Header (Column Names) */}
      <div className="px-4 py-2 bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 w-full">
        <div className="flex items-center">
          <div className="w-8 shrink-0 flex justify-center">
            <input
              type="checkbox"
              checked={selectedIngredientIds.length === filteredIngredients.length && filteredIngredients.length > 0}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-white/30 bg-white/20 text-emerald-500 focus:ring-emerald-500/50"
            />
          </div>
          <div className="flex-1 px-4">Detalles</div>
          <div className="w-32 hidden sm:block">Familia</div>
          <div className="w-24 text-right">Precio / Unidad</div>
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 w-full">
        {filteredIngredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-60">
            <Icon svg={ICONS.flask} className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">No hay ingredientes</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 pb-20">
            {filteredIngredients.map((ing) => {
              const isSelected = selectedIngredientIds.includes(ing.id);
              const isViewing = viewingIngredientId === ing.id;

              return (
                <div
                  key={ing.id}
                  onClick={() => onEditIngredient(ing)}
                  className={`group relative flex items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer w-full
                            ${isViewing
                      ? 'bg-emerald-600 shadow-lg shadow-emerald-900/20 scale-[1.02] border-emerald-500 z-10'
                      : 'bg-white/30 dark:bg-slate-900/30 backdrop-blur-md border-white/10 dark:border-white/5 hover:bg-white/50 hover:shadow-md hover:-translate-y-0.5'
                    }
                        `}
                >
                  {/* Selection Checkbox */}
                  <div className="w-8 shrink-0 flex justify-center z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(ing.id)}
                      className={`rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500 transition-colors cursor-pointer ${isSelected ? 'bg-emerald-500 border-emerald-500' : 'bg-white/50'}`}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 px-4 min-w-0">
                    <div className={`font-bold truncate ${isViewing ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{ing.nombre}</div>
                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${isViewing ? 'bg-white/20 text-emerald-100' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {ing.categoria}
                      </span>
                      {/* Stock Status Badge */}
                      {((ing as any).stockActual !== undefined && (ing as any).stockActual <= 0) && (
                        <span className="px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold tracking-tight flex items-center gap-1">
                          <Icon svg={ICONS.alertCircle} className="w-3 h-3" /> AGOTADOS
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price Column */}
                  <div className="w-24 text-right shrink-0 flex flex-col justify-center">
                    <div className={`font-bold font-mono text-sm ${isViewing ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      €{ing.precioCompra?.toFixed(2)}{ing.unidadCompra === 'kg' || ing.unidadCompra === 'Lt' ? `/${ing.unidadCompra}` : ''}
                    </div>
                    <div className={`text-[10px] uppercase tracking-wider ${isViewing ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {ing.unidadCompra || 'Und'}
                    </div>
                  </div>

                  {/* Viewing Indicator Bar */}
                  {isViewing && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20">
                      <Icon svg={ICONS.check} className="w-8 h-8 -rotate-12" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="h-12" /> {/* Bottom spacer for FAB */}
      </div>

      {/* Floating Action Button for New Ingredient */}
      {/* Floating Action Button removed as per request */}
    </div >
  );
};
