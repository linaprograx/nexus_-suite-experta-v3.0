import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Ingredient } from '../../types';

/** Number of distinct supply sources an ingredient has. */
const sourceCount = (ing: Ingredient): number => {
    if (ing.supplierData && Object.keys(ing.supplierData).length) return Object.keys(ing.supplierData).length;
    if (ing.proveedores && ing.proveedores.length) return ing.proveedores.length;
    return ing.proveedor ? 1 : 0;
};

/**
 * #17 · Single-supplier risk map (read-only): aggregates the per-ingredient
 * "single supplier" signal into a business-level view.
 */
export const SupplierRiskPanel: React.FC<{ allIngredients: Ingredient[]; onSelectIngredient?: (id: string) => void }> = ({ allIngredients, onSelectIngredient }) => {
    const { single, none, total } = React.useMemo(() => {
        let single = 0, none = 0;
        for (const ing of allIngredients) {
            const c = sourceCount(ing);
            if (c === 0) none++;
            else if (c === 1) single++;
        }
        return { single, none, total: allIngredients.length };
    }, [allIngredients]);

    const singleList = React.useMemo(
        () => allIngredients.filter(i => sourceCount(i) === 1).slice(0, 8),
        [allIngredients]
    );

    if (total === 0) return null;
    const pct = total > 0 ? Math.round((single / total) * 100) : 0;

    return (
        <div className="rounded-2xl border border-amber-200/60 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 p-4 mb-3">
            <div className="flex items-center gap-2 mb-3">
                <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400"><Icon svg={ICONS.shield} className="w-4 h-4" /></span>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Riesgo de proveedor único</h4>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-amber-600 dark:text-amber-400 tabular-nums">{single}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">de {total} ingredientes ({pct}%)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">dependen de un solo proveedor{none > 0 ? ` · ${none} sin proveedor asignado` : ''}.</p>

            {/* Risk bar */}
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
                <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${pct}%` }} />
            </div>

            {singleList.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {singleList.map(ing => (
                        <button
                            key={ing.id}
                            onClick={() => onSelectIngredient?.(ing.id)}
                            className="text-[10px] px-2 py-1 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-amber-200/50 dark:border-amber-500/20 text-slate-600 dark:text-slate-300 hover:border-amber-400 transition-colors truncate max-w-[130px]"
                            title={ing.nombre}
                        >
                            {ing.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
