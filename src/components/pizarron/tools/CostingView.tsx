import React, { useMemo } from 'react';
import { PizarronTask } from '../../../../types';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { ICONS } from '../../ui/icons';
import { formatCurrency } from '../../../../utils/format'; // Assuming util exists or I'll implement inline

interface CostingViewProps {
    task: PizarronTask;
    onBack: () => void;
    ingredientsData: any[]; // We pass the full ingredient objects to calculate costs
}

export const CostingView: React.FC<CostingViewProps> = ({ task, onBack, ingredientsData }) => {
    const recipe = task.recipe;

    const calculations = useMemo(() => {
        if (!recipe?.ingredients) return { total: 0, rows: [] };

        const rows = recipe.ingredients.map(item => {
            const refIng = ingredientsData.find(i => i.id === item.id);
            // Fallback cost calculation (mock logic if cost not in ingredient)
            // Assuming ingredient has 'costo' and 'unidad'
            const unitCost = refIng?.costo || 0;
            const totalCost = unitCost * item.quantity; // Simplified: assumes units match or 1:1
            return {
                name: item.name,
                qty: item.quantity,
                unit: item.unit,
                unitCost,
                totalCost
            };
        });

        const total = rows.reduce((acc, row) => acc + row.totalCost, 0);
        return { total, rows };

    }, [recipe, ingredientsData]);

    const yieldAmount = recipe?.yield || 1;
    const costPerPortion = calculations.total / yieldAmount;

    return (
        <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-slate-500 hover:text-slate-800">
                    <Icon svg={ICONS.arrowLeft} className="w-5 h-5" />
                </Button>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <Icon svg={ICONS.calculator} className="w-5 h-5" />
                        Escandallo (Costeo)
                    </h3>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-8">
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Costo Total Receta</span>
                        <span className="text-3xl font-black text-slate-800 dark:text-slate-100">
                            ${calculations.total.toFixed(2)}
                        </span>
                    </div>
                    <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Costo por Porción</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                                ${costPerPortion.toFixed(2)}
                            </span>
                            <span className="text-sm text-slate-500">/ {yieldAmount} {recipe?.yieldUnit}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-0">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3">Ingrediente</th>
                                <th className="px-6 py-3 text-right">Cantidad</th>
                                <th className="px-6 py-3 text-right">Costo Unit.</th>
                                <th className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {calculations.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="px-6 py-3 font-medium text-slate-700 dark:text-slate-200">{row.name}</td>
                                    <td className="px-6 py-3 text-right text-slate-500">{row.qty} {row.unit}</td>
                                    <td className="px-6 py-3 text-right text-slate-500">${row.unitCost.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right font-bold text-slate-700 dark:text-slate-200">${row.totalCost.toFixed(2)}</td>
                                </tr>
                            ))}
                            {calculations.rows.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">
                                        No hay ingredientes en la receta para calcular costos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
