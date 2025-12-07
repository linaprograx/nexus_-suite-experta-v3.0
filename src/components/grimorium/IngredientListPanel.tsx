import React, { useState, useMemo } from 'react';
import { Ingredient } from '../../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AromaticFamily } from '../../modules/ingredients/families';

const cnLocal = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

const FAMILY_COLORS: { [key in AromaticFamily]: string } = {
  'Citrus': 'bg-yellow-200 text-yellow-800', 'Fruits': 'bg-pink-200 text-pink-800',
  'Herbs': 'bg-green-200 text-green-800', 'Spices': 'bg-orange-200 text-orange-800',
  'Floral': 'bg-purple-200 text-purple-800', 'Vegetal': 'bg-teal-200 text-teal-800',
  'Toasted': 'bg-amber-300 text-amber-900', 'Umami': 'bg-gray-300 text-gray-800',
  'Sweeteners': 'bg-rose-200 text-rose-800', 'Fermented': 'bg-indigo-200 text-indigo-800',
  'Alcohol Base': 'bg-red-200 text-red-800', 'Bitters': 'bg-stone-300 text-stone-800',
  'Syrups': 'bg-cyan-200 text-cyan-800', 'Cordials': 'bg-lime-200 text-lime-800',
  'Infusions': 'bg-blue-200 text-blue-800', 'Unknown': 'bg-slate-200 text-slate-800',
};

interface IngredientListPanelProps {
  ingredients: Ingredient[];
  selectedIngredientIds: string[];
  viewingIngredientId?: string | null;
  onToggleSelection: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  onImportCSV: () => void;
  onEditIngredient: (ingredient: Ingredient) => void;
  onNewIngredient: () => void;
}

export const IngredientListPanel: React.FC<IngredientListPanelProps> = ({
  ingredients,
  selectedIngredientIds,
  viewingIngredientId,
  onToggleSelection,
  onSelectAll,
  onDeleteSelected,
  onImportCSV,
  onEditIngredient,
  onNewIngredient,
}) => {
  const { compactMode } = useUI();
  const [familyFilter, setFamilyFilter] = useState<AromaticFamily | 'all'>('all');

  const filteredIngredients = useMemo(() => {
    if (familyFilter === 'all') return ingredients;
    return ingredients.filter(ing => ing.categoria === familyFilter);
  }, [ingredients, familyFilter]);

  const allSelected = filteredIngredients.length > 0 && selectedIngredientIds.length === filteredIngredients.length;
  const someSelected = selectedIngredientIds.length > 0 && selectedIngredientIds.length < filteredIngredients.length;

  return (
    <div className="h-full flex flex-col bg-transparent border-none shadow-none overflow-hidden">
      <div className="p-4 pb-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {selectedIngredientIds.length > 0
              ? `${selectedIngredientIds.length} seleccionados`
              : `${filteredIngredients.length} de ${ingredients.length} ingredientes`
            }
          </p>
          <Select value={familyFilter} onChange={(e) => setFamilyFilter(e.target.value as any)} className="text-xs h-8">
            <option value="all">Todas las Familias</option>
            {Object.keys(FAMILY_COLORS).map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onImportCSV}>
            <Icon svg={ICONS.upload} className="mr-2 h-3.5 w-3.5" /> Importar CSV
          </Button>
          <Button variant="destructive" size="sm" disabled={selectedIngredientIds.length === 0} onClick={onDeleteSelected}>
            <Icon svg={ICONS.trash} className="mr-2 h-3.5 w-3.5" /> Eliminar
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 mt-2 grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="flex items-center justify-center w-8">
          <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
            checked={allSelected}
            ref={input => { if (input) input.indeterminate = someSelected; }}
            onChange={(e) => onSelectAll(e.target.checked)}
          />
        </div>
        <div>Detalles</div>
        <div>Familia</div>
        <div className="text-right">Precio / Unidad</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2 custom-scrollbar">
        {filteredIngredients.map((ingredient) => {
          const isChecked = selectedIngredientIds.includes(ingredient.id);
          const isActive = viewingIngredientId === ingredient.id;
          const familyColor = FAMILY_COLORS[ingredient.categoria as AromaticFamily] || FAMILY_COLORS.Unknown;

          // Extract bg color class for the strip (hacky but works if classes are simple 'bg-color-200...')
          // Or just use the familyColor class directly on a badge. 
          // Let's use a colored left border strip.

          return (
            <div key={ingredient.id} onClick={() => onEditIngredient(ingredient)}
              className={cnLocal("relative grid grid-cols-[auto_1fr_auto] gap-4 items-center rounded-2xl px-4 py-3 transition-all duration-300 cursor-pointer group mb-2 overflow-hidden",
                isActive
                  ? "bg-emerald-600 shadow-emerald-500/30 shadow-lg scale-[1.01] ring-0"
                  : "bg-white/30 dark:bg-slate-900/30 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:shadow-lg backdrop-blur-md border border-white/10"
              )}>

              {/* Category Strip (only if not active, to preserve clean look? or always?) */}
              {!isActive && (
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${familyColor.split(' ')[0]}`} />
              )}

              <div className="flex items-center justify-center w-8 z-10" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" className="rounded-md border-slate-300 text-emerald-600 focus:ring-emerald-500 h-5 w-5 cursor-pointer bg-white/50"
                  checked={isChecked} onChange={() => onToggleSelection(ingredient.id)}
                />
              </div>

              <div className="flex flex-col min-w-0 z-10">
                <div className="flex items-center gap-2">
                  <span className={cnLocal("font-bold text-base truncate transition-colors", isActive ? "text-white" : "text-slate-800 dark:text-slate-200")}>
                    {ingredient.nombre}
                  </span>
                  {!isActive && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${familyColor} bg-opacity-50`}>
                      {ingredient.categoria}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs mt-0.5">
                  <span className={cnLocal("transition-colors", isActive ? "text-emerald-100" : "text-slate-500")}>
                    {ingredient.marca || 'Generico'}
                  </span>
                  {isActive && (
                    <span className="text-emerald-100">• {ingredient.categoria}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end z-10">
                <span className={cnLocal("font-bold text-lg tabular-nums transition-colors", isActive ? "text-white" : "text-slate-800 dark:text-slate-100")}>
                  {ingredient.precioCompra > 0 ? `€${ingredient.precioCompra.toFixed(2)}` : '-'}
                </span>
                <span className={cnLocal("text-xs font-medium transition-colors", isActive ? "text-emerald-200" : "text-slate-400 capitalize")}>
                  {ingredient.unidadCompra}
                </span>
              </div>
            </div>
          );
        })}

        {ingredients.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            <p>No hay ingredientes.</p>
            <Button variant="link" onClick={onImportCSV}>Importar desde CSV</Button>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-200/70 dark:border-slate-800/70 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <Button variant="outline" size="sm" onClick={onNewIngredient} className="w-full">
          <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" /> Nuevo ingrediente
        </Button>
      </div>
    </div>
  );
};
