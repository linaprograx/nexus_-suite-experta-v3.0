import React from 'react';
import { Recipe, Ingredient, StockItem } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { Input } from '../ui/Input';
import { computeRecipeDepletion, DepletionLine } from '../../utils/recipeDepletion';
import { indicePorId, resolverMaestro } from '../../core/identity/masterProduct';

/**
 * Automatic stock depletion from a recipe: the user says how many servings were
 * produced/sold and each ingredient is deducted in its own stock unit
 * (sub-recipes and garnishes are expanded proportionally).
 */
export const ProduceRecipeModal: React.FC<{
    recipe: Recipe;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    stockItems: StockItem[];
    onClose: () => void;
    onConfirm: (lines: DepletionLine[], servings: number) => void;
}> = ({ recipe, allIngredients, allRecipes, stockItems, onClose, onConfirm }) => {
    const [servings, setServings] = React.useState('1');
    const n = Math.max(0, parseFloat(servings) || 0);

    const lines = React.useMemo(
        () => computeRecipeDepletion(recipe, n, allIngredients, stockItems, allRecipes),
        [recipe, n, allIngredients, stockItems, allRecipes]
    );

    const ok = lines.filter(l => l.resolved && l.quantity > 0);
    const failed = lines.filter(l => !l.resolved);

    // Warn when a deduction would leave stock negative.
    // Por maestro: el stock está consolidado ahí, así que cruzar por el id de
    // la línea daba «no tienes suficiente» de un producto lleno.
    const porIdIng = React.useMemo(() => indicePorId(allIngredients), [allIngredients]);
    const existencias = (id: string) => {
        const m = resolverMaestro(id, porIdIng);
        return stockItems.find(si => si.ingredientId === m)
            || stockItems.find(si => si.ingredientId === id);
    };
    const shortages = ok.filter(l => {
        const s = existencias(l.ingredientId);
        return s ? l.quantity > s.quantityAvailable : false;
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="relative px-5 py-4 shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 overflow-hidden flex items-center justify-between">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white"><Icon svg={ICONS.flask} className="w-5 h-5" /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Producir / Servir</h2>
                            <p className="text-xs text-white/80 truncate max-w-[280px]">{recipe.nombre}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Servings */}
                <div className="px-5 pt-4 shrink-0 flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Cantidad producida</span>
                    <Input
                        type="number"
                        min="0"
                        step="1"
                        value={servings}
                        onChange={e => setServings(e.target.value)}
                        className="w-24 text-center bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                        autoFocus
                    />
                    <span className="text-sm text-slate-500 dark:text-slate-400">servicio(s)</span>
                </div>

                {/* Preview */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 pt-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Se descontará del stock</p>

                    {ok.length === 0 && failed.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-8">Indica una cantidad para ver el descuento.</p>
                    ) : (
                        <ul className="space-y-1.5">
                            {ok.map(l => {
                                const s = existencias(l.ingredientId);
                                const short = s ? l.quantity > s.quantityAvailable : false;
                                return (
                                    <li key={l.ingredientId} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{l.ingredientName}</p>
                                            <p className="text-[11px] text-slate-400">
                                                usa {l.usedBaseQty.toFixed(1)} {l.usedBase !== 'unknown' ? l.usedBase : ''}
                                                {s ? ` · quedan ${(s.quantityAvailable - l.quantity).toFixed(2)} ${l.unit}` : ''}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-bold tabular-nums shrink-0 ${short ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
                                            −{l.quantity} {l.unit}
                                        </span>
                                    </li>
                                );
                            })}

                            {failed.map(l => (
                                <li key={l.ingredientId} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{l.ingredientName}</p>
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400">{l.note} — no se descontará</p>
                                    </div>
                                    <Icon svg={ICONS.alertCircle} className="w-4 h-4 text-amber-500 shrink-0" />
                                </li>
                            ))}
                        </ul>
                    )}

                    {shortages.length > 0 && (
                        <p className="mt-3 text-[11px] text-amber-600 dark:text-amber-400">
                            ⚠ {shortages.length} ingrediente(s) no tienen stock suficiente; quedarán a 0.
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200/60 dark:border-white/10 shrink-0 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                        {ok.length > 0 ? `${ok.length} ingrediente(s) a descontar` : 'Nada que descontar'}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                        <button
                            onClick={() => { onConfirm(ok, n); onClose(); }}
                            disabled={ok.length === 0}
                            className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors ${ok.length === 0 ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                        >
                            Descontar del stock
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
