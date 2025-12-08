import React from 'react';
import { PizarronTask } from '../../../../types';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { ICONS } from '../../ui/icons';

interface ZeroWasteViewProps {
    task: PizarronTask;
    onBack: () => void;
}

export const ZeroWasteView: React.FC<ZeroWasteViewProps> = ({ task, onBack }) => {
    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-slate-500 hover:text-slate-800">
                    <Icon svg={ICONS.arrowLeft} className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-teal-700 dark:text-teal-400 flex items-center gap-2">
                        <Icon svg={ICONS.refreshCw} className="w-5 h-5" />
                        Zero Waste Analysis
                    </h3>
                </div>
            </div>

            <div className="p-6 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800/30 text-center">
                <Icon svg={ICONS.leaf} className="w-12 h-12 text-teal-300 mx-auto mb-4" />
                <h4 className="text-teal-800 dark:text-teal-300 font-bold mb-2">Análisis de Desperdicios</h4>
                <p className="text-sm text-teal-600 dark:text-teal-400 mb-4">
                    Esta herramienta analizará tu receta para sugerir formas de aprovechar los subproductos (cáscaras, tallos, etc.).
                </p>
                <div className="space-y-2 text-left bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm max-w-md mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500" />
                        <span className="text-sm text-slate-600">Ingredientes analizados: <strong>{task.recipe?.ingredients?.length || 0}</strong></span>
                    </div>
                </div>
                <Button className="mt-6 bg-teal-600 hover:bg-teal-700 text-white w-full max-w-xs">
                    Ejecutar Análisis AI
                </Button>
            </div>
        </div>
    );
};
