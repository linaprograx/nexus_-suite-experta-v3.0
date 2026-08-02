import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';

const toMillis = (v: any): number => {
    if (!v) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return new Date(v).getTime();
    if (v.seconds) return v.seconds * 1000;
    if (v instanceof Date) return v.getTime();
    if (typeof v.toMillis === 'function') return v.toMillis();
    return 0;
};

const STALE_DAYS = 90;
const CRITICAL_MARGIN = 20; // %

/**
 * #13 · Recipe-level signals (read-only): surfaces recipes that need attention —
 * no linked ingredients, not updated in 90 days, or critical margin. Extends the
 * intelligence ladder to Recipe as an entity.
 */
export const RecipeAlertsPanel: React.FC<{ allRecipes: Recipe[]; allIngredients: Ingredient[]; onSelectRecipe?: (r: Recipe) => void }> = ({ allRecipes, allIngredients, onSelectRecipe }) => {
    const groups = React.useMemo(() => {
        const now = Date.now();
        const orphan: Recipe[] = [];
        const stale: Recipe[] = [];
        const critical: Recipe[] = [];

        for (const r of allRecipes) {
            const lines = (r.ingredientes as any[]) || [];
            const hasLinked = lines.some(li => li?.ingredientId || li?.subItems?.length || li?.subRecipeId);
            if (lines.length === 0 || !hasLinked) { orphan.push(r); continue; }

            const updated = toMillis((r as any).updatedAt || (r as any).createdAt);
            if (updated > 0 && (now - updated) / 86400000 > STALE_DAYS) stale.push(r);

            const venta = r.precioVenta || 0;
            if (venta > 0) {
                const cost = calculateRecipeCost(r, allIngredients).costoTotal || r.costoReceta || r.costoTotal || 0;
                const margin = ((venta - cost) / venta) * 100;
                if (cost > 0 && margin < CRITICAL_MARGIN) critical.push(r);
            }
        }
        return { orphan, stale, critical };
    }, [allRecipes, allIngredients]);

    const total = groups.orphan.length + groups.stale.length + groups.critical.length;
    if (total === 0) return null;

    const Row = ({ icon, tone, label, recipes }: { icon: string; tone: string; label: string; recipes: Recipe[] }) => {
        if (recipes.length === 0) return null;
        return (
            <div className="mb-2 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                    <Icon svg={icon} className={`w-3.5 h-3.5 ${tone}`} />
                    <span className={`text-[11px] font-bold ${tone}`}>{recipes.length} {label}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {recipes.slice(0, 6).map(r => (
                        <button
                            key={r.id}
                            onClick={() => onSelectRecipe?.(r)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors truncate max-w-[130px]"
                            title={r.nombre}
                        >
                            {r.nombre}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="rounded-2xl border border-rose-200/60 dark:border-rose-500/20 bg-rose-50/40 dark:bg-rose-500/5 p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400"><Icon svg={ICONS.shield} className="w-4 h-4" /></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-400">Recetas que requieren atención</h4>
            </div>
            <Row icon={ICONS.flask} tone="text-amber-600 dark:text-amber-400" label="sin ingredientes vinculados" recipes={groups.orphan} />
            <Row icon={ICONS.clock} tone="text-slate-500 dark:text-slate-400" label={`sin actualizar en ${STALE_DAYS} días`} recipes={groups.stale} />
            <Row icon={ICONS.chart} tone="text-rose-600 dark:text-rose-400" label={`con margen crítico (<${CRITICAL_MARGIN}%)`} recipes={groups.critical} />
        </div>
    );
};
