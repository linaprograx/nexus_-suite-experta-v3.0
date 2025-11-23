import React from 'react';
import { Ingredient } from '../../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';
import { Input } from '../ui/Input';

// Simple utility for class names if not available
const cnLocal = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
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

  const allSelected = ingredients.length > 0 && selectedIngredientIds.length === ingredients.length;
  const someSelected = selectedIngredientIds.length > 0 && selectedIngredientIds.length < ingredients.length;

  return (
    <Card className="h-full flex flex-col bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
      
      {/* Toolbar */}
      <div className="p-4 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedIngredientIds.length > 0 
                    ? `${selectedIngredientIds.length} seleccionados` 
                    : `${ingredients.length} ingredientes`
                }
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onImportCSV}>
                <Icon svg={ICONS.upload} className="mr-2 h-3.5 w-3.5" />
                Importar CSV
            </Button>
            <Button 
                variant="destructive" 
                size="sm" 
                disabled={selectedIngredientIds.length === 0}
                onClick={onDeleteSelected}
            >
                <Icon svg={ICONS.trash} className="mr-2 h-3.5 w-3.5" />
                Eliminar
            </Button>
          </div>
      </div>

      {/* Header Row */}
      <div className="px-4 py-2 mt-2 grid grid-cols-[auto_1fr_auto] gap-4 items-center border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
         <div className="flex items-center justify-center w-8">
            <input 
                type="checkbox" 
                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                checked={allSelected}
                ref={input => {
                    if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll(e.target.checked)}
            />
         </div>
         <div>Detalles</div>
         <div className="text-right">Precio / Unidad</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2 custom-scrollbar">
        {ingredients.map((ingredient) => {
            const isSelected = selectedIngredientIds.includes(ingredient.id);
            return (
              <div
                key={ingredient.id}
                onClick={() => onEditIngredient(ingredient)}
                className={cnLocal(
                    "grid grid-cols-[auto_1fr_auto] gap-4 items-center rounded-xl border px-4 py-3 transition-all cursor-pointer group",
                    isSelected 
                        ? "bg-primary/5 border-primary/30" 
                        : "bg-white/60 dark:bg-slate-900/60 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:shadow-md hover:-translate-y-0.5"
                )}
              >
                <div className="flex items-center justify-center w-8" onClick={(e) => e.stopPropagation()}>
                    <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                        checked={isSelected}
                        onChange={() => onToggleSelection(ingredient.id)}
                    />
                </div>
                
                <div className="flex flex-col min-w-0">
                  <span className={cnLocal("font-semibold truncate", isSelected ? "text-primary dark:text-primary-foreground" : "text-slate-800 dark:text-slate-200")}>
                    {ingredient.nombre}
                  </span>
                  <span className="text-xs text-slate-500 truncate">{ingredient.categoria}</span>
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
          <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" />
          Nuevo ingrediente
        </Button>
      </div>
    </Card>
  );
};
