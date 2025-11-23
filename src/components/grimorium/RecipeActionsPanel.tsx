import React from 'react';
import { Recipe, ViewName } from '../../../types';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface RecipeActionsPanelProps {
  recipe: Recipe;
  onNavigate: (view: ViewName, data?: any) => void;
  onDuplicate: (recipe: Recipe) => void;
}

export const RecipeActionsPanel: React.FC<RecipeActionsPanelProps> = ({ recipe, onNavigate, onDuplicate }) => {
  
  const actions = [
    {
      label: 'Calcular Escandallo',
      icon: ICONS.calculator,
      onClick: () => onNavigate('escandallator'), // TODO: Pass data if possible
      variant: 'glass'
    },
    {
      label: 'Analizar en CerebrIty',
      icon: ICONS.sparkles,
      onClick: () => onNavigate('cerebrIty', { initialText: `Analiza esta receta: ${recipe.nombre}. Ingredientes: ${recipe.ingredientes?.map(i => `${i.cantidad} ${i.unidad} ${i.nombre}`).join(', ')}` }),
      variant: 'glass'
    },
    {
      label: 'Analizar en The Lab',
      icon: ICONS.flask,
      onClick: () => onNavigate('lab'),
      variant: 'glass'
    },
    {
      label: 'Optimizar con Zero Waste',
      icon: ICONS.leaf || ICONS.recycle, // Fallback if leaf not updated yet
      onClick: () => onNavigate('zeroWaste'),
      variant: 'glass'
    },
    {
      label: 'Batcher automático',
      icon: ICONS.beaker || ICONS.flask, // Fallback
      onClick: () => onNavigate('escandallator'), // Should open batcher tab
      variant: 'glass'
    },
    {
      label: 'Duplicar esta receta',
      icon: ICONS.copy || ICONS.plus, // Fallback
      onClick: () => onDuplicate(recipe),
      variant: 'glass'
    }
  ];

  return (
    <div className="backdrop-blur-md bg-white/20 dark:bg-white/5 shadow-xl rounded-2xl border border-white/20 p-4 grid grid-cols-2 gap-3">
      {actions.map((action, idx) => (
        <button
          key={idx}
          onClick={action.onClick}
          className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl transition-all hover:bg-white/30 dark:hover:bg-white/10 hover:scale-105 active:scale-95 text-center group"
        >
          <div className="p-2 rounded-full bg-white/30 dark:bg-white/10 text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
             <Icon svg={action.icon} className="w-5 h-5" />
          </div>
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-tight">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
};
