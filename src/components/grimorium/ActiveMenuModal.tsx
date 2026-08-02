import React from 'react';
import { Recipe } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import { useRecipes } from '../../hooks/useRecipes';
import { useIngredients } from '../../hooks/useIngredients';
import { computeMenuDrift, summarizeDrift, MenuDrift } from '../../utils/menuDrift';

const SEV: Record<string, { label: string; cls: string; dot: string }> = {
    ok: { label: 'Al día', cls: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500' },
    review: { label: 'Revisar', cls: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    critical: { label: 'Crítico', cls: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' },
    missing: { label: 'Sin receta', cls: 'text-slate-500 dark:text-slate-400', dot: 'bg-slate-400' },
};

/**
 * #20 · The active menu (carta) and its feedback loop with Grimorio: shows each
 * published recipe's cost drift since it was added, so a printed card never goes
 * stale without anyone noticing.
 */
export const ActiveMenuModal: React.FC<{
    onClose: () => void;
    onSelectRecipe?: (r: Recipe) => void;
}> = ({ onClose, onSelectRecipe }) => {
    const { menu, loading, removeFromMenu, refreshEntry } = useActiveMenu();
    const { recipes: allRecipes } = useRecipes();
    const { ingredients: allIngredients } = useIngredients();

    const drifts = React.useMemo(
        () => computeMenuDrift(menu, allRecipes, allIngredients),
        [menu, allRecipes, allIngredients]
    );
    const sum = summarizeDrift(drifts);

    const totals = React.useMemo(() => {
        const priced = drifts.filter(d => (d.entry.precioVenta || 0) > 0 && d.currentCost > 0);
        const avgMargin = priced.length
            ? priced.reduce((a, d) => a + d.currentMargin, 0) / priced.length
            : 0;
        return { avgMargin, priced: priced.length };
    }, [drifts]);

    const order: Record<string, number> = { critical: 0, review: 1, missing: 2, ok: 3 };
    const sorted = [...drifts].sort((a, b) => order[a.severity] - order[b.severity]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="relative px-5 py-4 shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 overflow-hidden flex items-center justify-between">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white"><Icon svg={ICONS.book} className="w-5 h-5" /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Carta activa</h2>
                            <p className="text-xs text-white/80">
                                {sum.total} receta(s){sum.needsAttention > 0 ? ` · ${sum.needsAttention} requieren atención` : ' · todo al día'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Summary */}
                {sum.total > 0 && (
                    <div className="grid grid-cols-3 gap-2 px-5 pt-4 shrink-0">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">En carta</p>
                            <p className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{sum.total}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Margen medio</p>
                            <p className={`text-xl font-black tabular-nums ${totals.avgMargin >= 70 ? 'text-emerald-600 dark:text-emerald-400' : totals.avgMargin >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                {totals.priced > 0 ? `${totals.avgMargin.toFixed(0)}%` : '—'}
                            </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">A revisar</p>
                            <p className={`text-xl font-black tabular-nums ${sum.needsAttention > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-slate-100'}`}>{sum.needsAttention}</p>
                        </div>
                    </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-4">
                    {loading ? (
                        <p className="text-center text-sm text-slate-400 py-10">Cargando carta…</p>
                    ) : sorted.length === 0 ? (
                        <div className="text-center py-12">
                            <Icon svg={ICONS.book} className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tu carta está vacía.</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Añade recetas desde su ficha con “Añadir a carta”.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {sorted.map((d: MenuDrift) => {
                                const s = SEV[d.severity];
                                return (
                                    <li key={d.entry.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <span className={`shrink-0 w-2 h-2 rounded-full ${s.dot}`} />
                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => d.recipe && onSelectRecipe?.(d.recipe)}
                                                className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate hover:underline text-left block max-w-full"
                                            >
                                                {d.entry.nombre}
                                            </button>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                                {d.severity === 'missing'
                                                    ? d.reason
                                                    : <>Coste €{d.currentCost.toFixed(2)} · PV €{(d.entry.precioVenta || 0).toFixed(2)} · Margen {d.currentMargin.toFixed(0)}%</>}
                                            </p>
                                            {d.reason && d.severity !== 'missing' && (
                                                <p className={`text-[11px] font-medium mt-0.5 ${s.cls}`}>⚠ {d.reason}</p>
                                            )}
                                        </div>

                                        <div className="shrink-0 flex items-center gap-1.5">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${s.cls}`}>{s.label}</span>
                                            {d.severity !== 'ok' && d.severity !== 'missing' && (
                                                <button
                                                    onClick={() => refreshEntry(d.entry.id, d.currentCost, d.currentMargin)}
                                                    title="Marcar como revisado (congela el coste actual)"
                                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-colors"
                                                >
                                                    <Icon svg={ICONS.check} className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removeFromMenu(d.entry.id)}
                                                title="Quitar de la carta"
                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 dark:text-slate-500 hover:text-rose-500 transition-colors"
                                            >
                                                <Icon svg={ICONS.trash} className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};
