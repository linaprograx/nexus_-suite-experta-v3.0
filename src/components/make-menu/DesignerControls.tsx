import React from 'react';
import { Recipe, PizarronTask } from '../../../types';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

interface DesignerControlsProps {
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
    selectedRecipeIds: string[];
    selectedTaskIds: string[];
    loading: boolean;
    onSelectionChange: (id: string, type: 'recipe' | 'task') => void;
    onGenerate: () => void;
    onApplyIntention?: () => void;
    pizarronDraft?: any;
}

const DesignerControls: React.FC<DesignerControlsProps> = ({
    allRecipes,
    allPizarronTasks,
    selectedRecipeIds,
    selectedTaskIds,
    loading,
    onSelectionChange,
    onGenerate,
    onApplyIntention,
    pizarronDraft
}) => {
    const pizarronAprobado = allPizarronTasks.filter(task => task.status === 'aprobado');

    return (
        <div className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 border border-white/20 shadow-lg rounded-2xl h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Creative Studio</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Configura tu diseño</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {/* Recipes */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Recetas ({selectedRecipeIds.length})</Label>
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-2 border border-white/10 max-h-48 overflow-y-auto custom-scrollbar">
                        {allRecipes.map(r => (
                            <label key={r.id} className="flex items-center gap-2 p-1.5 hover:bg-white/40 dark:hover:bg-slate-700/40 rounded-lg cursor-pointer transition-colors group">
                                <Checkbox
                                    id={`menu-r-${r.id}`}
                                    checked={selectedRecipeIds.includes(r.id)}
                                    onChange={() => onSelectionChange(r.id, 'recipe')}
                                    className="data-[state=checked]:bg-rose-500 border-slate-300 dark:border-slate-600"
                                />
                                <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                    {r.nombre}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Ideas */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500 font-bold">Conceptos Aprobados ({selectedTaskIds.length})</Label>
                    <div className="bg-white/40 dark:bg-slate-800/40 rounded-xl p-2 border border-white/10 max-h-48 overflow-y-auto custom-scrollbar">
                        {pizarronAprobado.length === 0 ? (
                            <p className="text-xs text-slate-400 p-2">No tienes ideas aprobadas en el Pizarrón.</p>
                        ) : (
                            pizarronAprobado.map(t => (
                                <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-white/40 dark:hover:bg-slate-700/40 rounded-lg cursor-pointer transition-colors group">
                                    <Checkbox
                                        id={`menu-t-${t.id}`}
                                        checked={selectedTaskIds.includes(t.id)}
                                        onChange={() => onSelectionChange(t.id, 'task')}
                                        className="data-[state=checked]:bg-rose-500 border-slate-300 dark:border-slate-600"
                                    />
                                    <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate">
                                        {t.texto}
                                    </span>
                                </label>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/30 dark:bg-slate-900/20">
                <Button
                    onClick={onGenerate}
                    disabled={loading || (selectedRecipeIds.length + selectedTaskIds.length < 1)}
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-lg"
                >
                    {loading ? <Spinner className="w-4 h-4 mr-2" /> : <Icon svg={ICONS.menu} className="w-4 h-4 mr-2" />}
                    {loading ? 'Ejecutando diseño...' : 'Ejecutar Diseño'}
                </Button>
            </div>
        </div>
    );
};

export default DesignerControls;
