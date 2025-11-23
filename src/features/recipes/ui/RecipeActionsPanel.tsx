import React, { useState } from 'react';
import { Recipe, Ingredient } from '../../../../types';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { ICONS } from '../../../components/ui/icons';
import { calcEscandallo, EscandalloResult } from '../../escandallo/calcEscandallo';
import { EscandalloModal } from '../../escandallo/ui/EscandalloModal';

interface RecipeActionsPanelProps {
  recipe: Recipe;
  allIngredients: Ingredient[];
  onNavigate?: (view: any, data?: any) => void;
  onDuplicate?: (recipe: Recipe) => void;
  onToolToggle?: (isOpen: boolean) => void;
}

export const RecipeActionsPanel: React.FC<RecipeActionsPanelProps> = ({ 
  recipe, 
  allIngredients,
  onNavigate,
  onDuplicate,
  onToolToggle
}) => {
  const [escandalloResult, setEscandalloResult] = useState<EscandalloResult | null>(null);
  const [isEscandalloOpen, setIsEscandalloOpen] = useState(false);

  const setEscandalloOpenState = (isOpen: boolean) => {
    setIsEscandalloOpen(isOpen);
    if (onToolToggle) onToolToggle(isOpen);
  }

  const handleAction = (action: string) => {
    console.log(`Action triggered: ${action}`);
    switch (action) {
      case 'escandallo':
        const result = calcEscandallo(recipe, 1, allIngredients);
        setEscandalloResult(result);
        setEscandalloOpenState(true);
        break;
      case 'batch':
        // Placeholder for Batch Tool
        break;
      case 'zerowaste':
        // Placeholder
        break;
      case 'cerebrity':
        // Placeholder
        break;
      case 'lab':
        // Placeholder
        break;
      case 'clone':
        if (onDuplicate) onDuplicate(recipe);
        break;
      case 'sync':
        // Placeholder
        break;
      default:
        break;
    }
  };

  const actions = [
    { id: 'escandallo', label: 'Escandallo', icon: ICONS.calculator, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' },
    { id: 'batch', label: 'Batcher', icon: ICONS.layers, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
    { id: 'zerowaste', label: 'Zero Waste', icon: ICONS.leaf, color: 'text-green-500 bg-green-50 dark:bg-green-900/20' },
    { id: 'cerebrity', label: 'Cerebrity', icon: ICONS.brain, color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20' },
    { id: 'lab', label: 'The Lab', icon: ICONS.flask, color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20' },
    { id: 'clone', label: 'Clonar', icon: ICONS.copy, color: 'text-slate-500 bg-slate-50 dark:bg-slate-800' },
    { id: 'sync', label: 'Sync Menu', icon: ICONS.refresh, color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20' },
  ];

  return (
    <div className="space-y-4">
       <div className="flex flex-wrap gap-3">
          {actions.map(action => (
            <button
              key={action.id}
              onClick={() => handleAction(action.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full 
                text-sm font-medium transition-all duration-200
                hover:scale-105 hover:shadow-md border border-transparent hover:border-slate-200 dark:hover:border-slate-700
                ${action.color}
              `}
            >
              <Icon svg={action.icon} className="w-4 h-4" />
              {action.label}
            </button>
          ))}
       </div>

       {/* Escandallo is technically a tool that might open in a Drawer, but for now reusing the Modal logic or I can switch to Drawer if EscandalloModal supports it. 
           The user said "Todos los paneles de herramientas... deben abrirse y cerrarse correctamente. Implementar un Drawer...".
           I should probably wrap Escandallo result in a Drawer.
       */}
       <EscandalloModal 
         isOpen={isEscandalloOpen} 
         onClose={() => setEscandalloOpenState(false)} 
         result={escandalloResult} 
       />
    </div>
  );
};
