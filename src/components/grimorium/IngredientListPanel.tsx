import React from 'react';
import { Ingredient } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Button } from '../ui/Button';

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

  return (
    <Card className="h-full flex flex-col bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Unique Integrated Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-nowrap items-center gap-3">
        {/* 1. Search Bar - Expands */}
        <div className="relative flex-1 group min-w-[120px]">
          <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 group-focus-within:text-emerald-500 transition-colors" />
          <input
            type="text"
            value={ingredientSearchTerm}
            onChange={(e) => onIngredientSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/20 transition-all text-sm font-bold text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400/70"
          />
        </div>

        {/* 2. Family Filter */}
        <div className="relative shrink-0">
          <select
            value={ingredientFilters.category}
            onChange={(e) => onIngredientFilterChange('category', e.target.value)}
            className="appearance-none w-32 pl-3 pr-8 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
          >
            <option value="all">Familia</option>
            <option value="Alcohol Base">Bases</option>
            <option value="Citrus">Cítricos</option>
            <option value="Fruits">Frutas</option>
            <option value="Herbs">Hierbas</option>
            <option value="Sweeteners">Dulces</option>
            <option value="Spices">Especias</option>
            <option value="General">Otros</option>
          </select>
          <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-emerald-500 pointer-events-none" />
        </div>

        {/* 3. Stock Filter */}
        <div className="relative shrink-0 hidden sm:block">
          <select
            value={ingredientFilters.status}
            onChange={(e) => onIngredientFilterChange('status', e.target.value)}
            className="appearance-none w-28 pl-3 pr-8 py-2 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800/50 text-teal-700 dark:text-teal-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-900/30 transition-colors"
          >
            <option value="all">Stock</option>
            <option value="ok">Alto</option>
            <option value="low">Bajo</option>
            <option value="out">Agotado</option>
          </select>
          <Icon svg={ICONS.chevronDown} className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-teal-500 pointer-events-none" />
        </div>

        {/* 4. Delete Action */}
        {selectedIngredientIds.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDeleteSelected}
            className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 shrink-0 w-9 h-9 rounded-lg"
            title="Eliminar seleccionados"
          >
            <Icon svg={ICONS.trash} className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* List Header (Column Names) */}
      <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        <div className="w-8 shrink-0 flex justify-center">
          <input
            type="checkbox"
            checked={selectedIngredientIds.length === ingredients.length && ingredients.length > 0}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="rounded border-slate-300 text-emerald-500 focus:ring-emerald-500/50"
          />
        </div>
        <div className="flex-1 px-4">Detalles</div>
        <div className="w-32 hidden sm:block">Familia</div>
        <div className="w-24 text-right">Precio / Unidad</div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {ingredients.map((ing, index) => (
          <div
            key={ing.id}
            onClick={() => onEditIngredient(ing)}
            className={`group relative flex items-center p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md
                            ${viewingIngredientId === ing.id
                ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                : 'bg-white border-transparent hover:border-emerald-100 dark:bg-slate-800 dark:hover:border-emerald-900'
              }
                        `}
          >
            {/* Selection Checkbox (Stop propagation to prevent opening details when selecting) */}
            <div className="w-8 shrink-0 flex justify-center z-10" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedIngredientIds.includes(ing.id)}
                onChange={() => onToggleSelection(ing.id)}
                className="rounded border-slate-200 dark:border-slate-700 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
              />
            </div>

            {/* Content */}
            <div className="flex-1 px-4 min-w-0">
              <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{ing.nombre}</div>
              <div className="text-xs text-slate-400 truncate">{ing.categoria}</div>
            </div>

            {/* Family Badge */}
            <div className="w-32 hidden sm:block">
              <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 uppercase">
                {ing.categoria.slice(0, 10)}
              </span>
            </div>

            {/* Price */}
            <div className="w-24 text-right">
              <div className="font-bold text-slate-700 dark:text-slate-300">€{ing.precioCompra.toFixed(2)}</div>
              <div className="text-[10px] text-slate-400 uppercase">{ing.unidadCompra || 'Und'}</div>
            </div>

            {/* Viewing Indicator Bar */}
            {viewingIngredientId === ing.id && (
              <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />
            )}
          </div>
        ))}

        {/* Empty State */}
        {ingredients.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center opacity-60">
            <Icon svg={ICONS.search} className="w-12 h-12 mb-2" />
            <p>No se encontraron ingredientes</p>
          </div>
        )}

        <div className="h-12" /> {/* Bottom spacer for FAB */}
      </div>

      {/* Floating Action Button for New Ingredient */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <Button onClick={onNewIngredient} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/20">
          <Icon svg={ICONS.plus} className="mr-2 h-4 w-4" />
          Nuevo Ingrediente
        </Button>
      </div>
    </Card>
  );
};
