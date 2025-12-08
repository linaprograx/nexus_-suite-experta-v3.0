import React from 'react';
import { Firestore } from 'firebase/firestore';
import { Recipe } from '../../../types';
import BatcherTab from '../../escandallator/BatcherTab';

interface BatcherPowerProps {
    db: Firestore;
    appId: string;
    allRecipes: Recipe[];
}

export const BatcherPower: React.FC<BatcherPowerProps> = ({ db, appId, allRecipes }) => {
    const [result, setResult] = React.useState<any>(null);

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1">
            <BatcherTab
                db={db}
                appId={appId}
                allRecipes={allRecipes}
                setBatchResult={setResult}
            />
            {result && (
                <div className="mt-8 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20 animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-emerald-800 dark:text-emerald-300 mb-4 text-center">Plan de Producción: {result.meta.targetQuantity} {result.meta.targetUnit}</h3>
                    <div className="space-y-3">
                        {result.data.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100/50 dark:border-emerald-800/10 shadow-sm">
                                <span className="font-medium text-slate-700 dark:text-slate-200">{item.ingredient}</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">{item.batchQty}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-4 opacity-70">
                        Basado en receta: {result.meta.recipeName}
                    </p>
                </div>
            )}
        </div>
    );
};
