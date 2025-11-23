import React from 'react';
import { Recipe, Ingredient } from '../../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useUI } from '../../context/UIContext';
import { RecipeActionsPanel } from '../../features/recipes/ui/RecipeActionsPanel';
import { RecipeCostCard } from '../../features/recipes/ui/RecipeCostCard';
import { ViewName } from '../../../types';

// Simple utility for class names if not available
const cnLocal = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

interface RecipeDetailPanelProps {
  recipe: Recipe | null;
  allIngredients: Ingredient[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onNavigate: (view: ViewName, data?: any) => void;
  onToolToggle?: (isOpen: boolean) => void;
}

export const RecipeDetailPanel: React.FC<RecipeDetailPanelProps> = ({
  recipe,
  allIngredients,
  onEdit,
  onDelete,
  onDuplicate,
  onNavigate,
  onToolToggle,
}) => {
  const { compactMode } = useUI();

  if (!recipe) {
    return (
      <Card className="h-full flex flex-col items-center justify-center bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 p-8 text-center">
        <Icon svg={ICONS.layout} className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
        <p className="text-slate-500 dark:text-slate-400">Selecciona una receta para ver los detalles</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col bg-white/60 dark:bg-slate-900/30 backdrop-blur-md border border-slate-200/70 dark:border-slate-800/70 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Large Image Header */}
        <div className="p-4 lg:p-6 pb-0">
             {recipe.imageUrl ? (
                <img 
                    src={recipe.imageUrl} 
                    alt={recipe.nombre} 
                    className="w-full h-56 rounded-3xl object-cover mb-4 shadow-sm"
                />
             ) : (
                <div className="w-full h-56 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 mb-4 flex items-center justify-center shadow-sm">
                    <span className="text-6xl font-bold text-white/50">{recipe.nombre.substring(0, 2).toUpperCase()}</span>
                </div>
             )}

             {/* Title & Actions Row */}
             <div className="flex flex-col gap-4 mb-6">
                <div className="flex justify-between items-start gap-4">
                    <div>
                        <h2 className={cnLocal("font-bold text-slate-900 dark:text-white", compactMode ? "text-xl" : "text-2xl")}>
                            {recipe.nombre}
                        </h2>
                         <div className="flex flex-wrap gap-2 mt-2">
                            {recipe.categorias?.map((cat, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700">
                                {cat}
                              </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => onEdit(recipe)}>
                    <Icon svg={ICONS.edit} className="mr-2 w-3.5 h-3.5" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(recipe)}>
                    <Icon svg={ICONS.trash} className="mr-2 w-3.5 h-3.5" />
                    Eliminar
                  </Button>
                </div>
             </div>
        </div>

        {/* Content */}
        <div className={`px-4 lg:px-6 pb-6 space-y-6`}>
            {/* Stats / Info */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
               <div>
                  {/* Ingredients */}
                  <h3 className={`font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 ${compactMode ? 'text-sm' : 'text-base'}`}>
                    <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                        <Icon svg={ICONS.flask} className="w-4 h-4" />
                    </div>
                    Ingredientes
                  </h3>
                  <div className="bg-white/40 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                      {recipe.ingredientes && recipe.ingredientes.length > 0 ? (
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                          {recipe.ingredientes.map((ing, i) => (
                            <li key={i} className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                              <span className="font-medium text-slate-700 dark:text-slate-200">{ing.nombre}</span>
                              <span className="text-slate-500 font-mono">{ing.cantidad} {ing.unidad}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-400 italic">
                            {recipe.ingredientesTexto ? 'Ver texto de ingredientes' : 'Sin ingredientes estructurados'}
                        </p>
                      )}
                      
                      {recipe.ingredientesTexto && (
                        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
                            {recipe.ingredientesTexto}
                        </div>
                      )}
                  </div>
               </div>

               <div>
                  <RecipeCostCard recipe={recipe} allIngredients={allIngredients} />
               </div>
            </div>

            {/* Ingredients section removed from here and moved up into grid layout */}

            {/* Preparacion */}
            {recipe.preparacion && (
                <div>
                    <h3 className={`font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2 ${compactMode ? 'text-sm' : 'text-base'}`}>
                        <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                            <Icon svg={ICONS.menu} className="w-4 h-4" />
                        </div>
                        Preparación
                    </h3>
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {recipe.preparacion}
                        </p>
                    </div>
                </div>
            )}
        </div>
      </div>
      
       {/* Footer Actions */}
       <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Acciones Avanzadas</h4>
            <RecipeActionsPanel 
              recipe={recipe} 
              allIngredients={allIngredients}
              onNavigate={onNavigate} 
              onDuplicate={onDuplicate} 
              onToolToggle={onToolToggle}
            />
        </div>

    </Card>
  );
};
