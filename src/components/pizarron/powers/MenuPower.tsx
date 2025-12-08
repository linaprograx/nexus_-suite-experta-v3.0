import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe, PizarronTask } from '../../../types';
import { Icon } from '../../ui/Icon';
import { ICONS } from '../../ui/icons';
import { Button } from '../../ui/Button';
import DesignerControls from '../../make-menu/DesignerControls';
import DesignerResults from '../../make-menu/DesignerResults';
import { MenuLayout } from '../../../types';
import { Spinner } from '../../ui/Spinner';

interface MenuPowerProps {
    db: Firestore;
    appId: string;
    userId: string;
    allRecipes: Recipe[];
    allPizarronTasks: PizarronTask[];
    currentTaskId?: string;
}

export const MenuPower: React.FC<MenuPowerProps> = ({ db, appId, userId, allRecipes, allPizarronTasks, currentTaskId }) => {
    // We reuse DesignerControls but maybe we pre-select the current task if compatible
    const [selectedRecipeIds, setSelectedRecipeIds] = React.useState<string[]>([]);
    const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>(currentTaskId ? [currentTaskId] : []);
    const [loading, setLoading] = React.useState(false);
    const [results, setResults] = React.useState<MenuLayout[]>([]);

    // Simple state to toggle between selection and results if space is tight
    // But DesignerResults usually stacks below.

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1">
            <div className="bg-pink-50 dark:bg-pink-900/10 p-4 rounded-xl border border-pink-100 dark:border-pink-800/20 mb-6">
                <h4 className="font-bold text-pink-700 dark:text-pink-300 mb-2 flex items-center gap-2">
                    <Icon svg={ICONS.menu} className="w-4 h-4" /> Diseñador Rápido
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                    Selecciona recetas o ideas para generar propuestas de diseño de menú instantáneas.
                </p>
                <DesignerControls
                    allRecipes={allRecipes}
                    allPizarronTasks={allPizarronTasks}
                    selectedRecipeIds={selectedRecipeIds}
                    selectedTaskIds={selectedTaskIds}
                    loading={loading}
                    onSelectionChange={(id, type) => {
                        if (type === 'recipe') {
                            setSelectedRecipeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                        } else {
                            setSelectedTaskIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
                        }
                    }}
                    onGenerate={async () => {
                        // We need to implement the generate logic here or import it if extracted
                        // For now we do a simple mock or we'd need to duplicate logic from MakeMenuView
                        // Let's prompt user that full view is better for this, OR implement a simple stub
                        alert("Para diseños complejos, usa la vista completa de Make Menu. (Funcionalidad rápida en proceso)");
                    }}
                />
            </div>

            {loading && <div className="p-8 flex justify-center"><Spinner className="text-pink-500 w-8 h-8" /></div>}

            <DesignerResults
                results={results}
                loading={loading}
                error={null}
                db={db}
                userId={userId}
                appId={appId}
            />
        </div>
    );
};
