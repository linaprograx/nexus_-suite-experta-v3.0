import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';

/**
 * #16 · Business-level COGS real vs theoretical (read-only).
 * Theoretical = market/standard price; Real = weighted purchase cost. Aggregates the
 * per-recipe deviation the signal engine already computes, across the whole active menu.
 */
export const BusinessCogsPanel: React.FC<{ allRecipes: Recipe[]; allIngredients: Ingredient[] }> = ({ allRecipes, allIngredients }) => {
    const { purchaseHistory } = usePurchaseIngredient();

    const stats = React.useMemo(() => {
        let theo = 0, real = 0, deviating = 0, counted = 0;
        for (const r of allRecipes) {
            if (!r.ingredientes || (r.ingredientes as any[]).length === 0) continue;
            const t = calculateRecipeCost(r, allIngredients).costoTotal || 0;
            const re = calculateRecipeCost(r, allIngredients, purchaseHistory).costoTotal || 0;
            if (t <= 0 && re <= 0) continue;
            theo += t; real += re; counted++;
            const dev = t > 0 ? Math.abs((re - t) / t) * 100 : 0;
            if (dev > 5) deviating++;
        }
        const delta = real - theo;
        const deltaPct = theo > 0 ? (delta / theo) * 100 : 0;
        return { theo, real, delta, deltaPct, deviating, counted };
    }, [allRecipes, allIngredients, purchaseHistory]);

    if (stats.counted === 0) return null;
    const over = stats.delta > 0.005;
    const under = stats.delta < -0.005;
    const tone = over ? 'text-rose-600 dark:text-rose-400' : under ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500';

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/40 p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"><Icon svg={ICONS.chart || ICONS.trendingUp} className="w-4 h-4" /></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Coste real vs teórico</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Teórico (mercado)</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">€{stats.theo.toFixed(2)}</p>
                </div>
                <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Real (compras)</p>
                    <p className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">€{stats.real.toFixed(2)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/40 px-3 py-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Desviación</span>
                <span className={`text-sm font-black tabular-nums ${tone}`}>
                    {over ? '+' : ''}{stats.delta.toFixed(2)}€ ({stats.deltaPct >= 0 ? '+' : ''}{stats.deltaPct.toFixed(1)}%)
                </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                {stats.deviating > 0
                    ? `${stats.deviating} de ${stats.counted} recetas se desvían más de un 5% del coste teórico.`
                    : `Las ${stats.counted} recetas costeadas están alineadas con el coste teórico.`}
            </p>
        </div>
    );
};
