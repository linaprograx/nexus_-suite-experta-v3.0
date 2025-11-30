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
    <Card className="h-full flex flex-col bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
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
            const isSelected = selectedIngredientIds.includes(ingredient.id);
            return (
              <div key={ingredient.id} onClick={() => onEditIngredient(ingredient)}
                className={cnLocal("grid grid-cols-[auto_1fr_1fr_auto] gap-4 items-center rounded-xl border px-4 py-3 transition-all cursor-pointer group",
                    isSelected ? "bg-primary/5 border-primary/30" : "bg-white/60 dark:bg-slate-900/60 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-md hover:-translate-y-0.5"
                )}>
                <div className="flex items-center justify-center w-8" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={isSelected} onChange={() => onToggleSelection(ingredient.id)}
                    />
                </div>
                
                <div className="flex flex-col min-w-0">
                  <span className={cnLocal("font-semibold truncate", isSelected ? "text-primary dark:text-primary-foreground" : "text-slate-800 dark:text-slate-200")}>
                    {ingredient.nombre}
                  </span>
                </div>

                <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${FAMILY_COLORS[ingredient.categoria as AromaticFamily] || FAMILY_COLORS.Unknown}`}>
                        {ingredient.categoria}
                    </span>
                </div>
                
                <div className="flex flex-col items-end text-sm">
                   <span className="font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                    {ingredient.precioCompra > 0 ? `€${ingredient.precioCompra.toFixed(2)}` : '-'}
                   </span>
                   <span className="text-xs text-slate-500">{ingredient.unidadCompra}</span>
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
    </Card>
  );
};
