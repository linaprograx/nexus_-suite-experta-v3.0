import React from 'react';
import { Recipe, Ingredient, IngredientLineItem } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { calculateRecipeCost } from '../../core/costing/costCalculator';

interface RecipeFinancialDashboardProps {
    selectedRecipe: Recipe | null;
    allRecipes: Recipe[];
    allIngredients?: Ingredient[];
    onSelectRecipe?: (r: Recipe) => void;
}

const STATES = ['Idea', 'En pruebas', 'Terminado', 'Archivada'];
const STATE_LABEL: Record<string, string> = { Idea: 'Idea', 'En pruebas': 'En pruebas', Terminado: 'En carta', Archivada: 'Archivada' };

export const RecipeFinancialDashboard: React.FC<RecipeFinancialDashboardProps> = ({ selectedRecipe, allRecipes, allIngredients = [], onSelectRecipe }) => {
    const costOf = React.useCallback((r: Recipe) =>
        calculateRecipeCost(r, allIngredients, undefined, allRecipes).costoTotal || r.costoReceta || r.costoTotal || 0,
        [allIngredients, allRecipes]);
    const marginOf = React.useCallback((r: Recipe) => {
        const v = r.precioVenta ?? 0;
        const c = costOf(r);
        return v > 0 ? ((v - c) / v) * 100 : 0;
    }, [costOf]);

    // --- Global analytics (real) ---
    const g = React.useMemo(() => {
        const total = allRecipes.length;
        const carta = allRecipes.filter(r => r.categorias?.includes('Carta') || r.categorias?.includes('Terminado')).length;
        const priced = allRecipes.filter(r => (r.precioVenta ?? 0) > 0);
        const costedList = allRecipes.filter(r => costOf(r) > 0);
        const avgMargin = priced.length ? Math.round(priced.reduce((s, r) => s + marginOf(r), 0) / priced.length) : 0;
        const avgCost = costedList.length ? costedList.reduce((s, r) => s + costOf(r), 0) / costedList.length : 0;
        const valorRecetario = priced.reduce((s, r) => s + (r.precioVenta ?? 0), 0);
        const pctCosted = total ? Math.round((costedList.length / total) * 100) : 0;

        const catMap = new Map<string, number>();
        allRecipes.forEach(r => (r.categorias || ['Sin categoría']).forEach(c => { if (!STATES.includes(c)) catMap.set(c, (catMap.get(c) || 0) + 1); }));
        const categories = Array.from(catMap.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 4);

        const states = STATES.map(s => ({ name: STATE_LABEL[s], count: allRecipes.filter(r => r.categorias?.includes(s)).length })).filter(s => s.count > 0);

        // Ranking by margin
        const rankable = priced.map(r => ({ r, m: marginOf(r) })).sort((a, b) => b.m - a.m);
        const top = rankable.slice(0, 3);
        const bottom = rankable.slice(-3).reverse();

        // Alerts
        const sinPrecio = allRecipes.filter(r => (r.precioVenta ?? 0) <= 0);
        const bajoObjetivo = priced.filter(r => marginOf(r) < 70);

        // Margin histogram
        const buckets = [
            { label: '<25%', count: priced.filter(r => marginOf(r) < 25).length, color: '#f43f5e' },
            { label: '25-50', count: priced.filter(r => { const m = marginOf(r); return m >= 25 && m < 50; }).length, color: '#f59e0b' },
            { label: '50-70', count: priced.filter(r => { const m = marginOf(r); return m >= 50 && m < 70; }).length, color: '#14b8a6' },
            { label: '>70%', count: priced.filter(r => marginOf(r) >= 70).length, color: '#10b981' },
        ];

        return { total, carta, priced: priced.length, avgMargin, avgCost, valorRecetario, pctCosted, categories, states, top, bottom, sinPrecio, bajoObjetivo, buckets };
    }, [allRecipes, marginOf, costOf]);

    // ============================ SELECTED RECIPE ============================
    if (selectedRecipe) {
        const cost = calculateRecipeCost(selectedRecipe, allIngredients, undefined, allRecipes);
        const costo = cost.costoTotal || 0;
        const venta = selectedRecipe.precioVenta ?? 0;
        const margen = marginOf(selectedRecipe);
        const beneficio = venta - costo;
        const hasPrice = venta > 0;
        const tier = margen >= 70 ? 'EXCELENTE' : margen < 25 ? 'CRÍTICO' : 'BUENO';
        const tierClass = margen >= 70 ? 'bg-emerald-100 text-emerald-700' : margen < 25 ? 'bg-rose-200 text-rose-800' : 'bg-amber-100 text-amber-700';

        // Ingredient cost breakdown (sorted by weight)
        const lines = (cost.costoPorIngrediente || []) as (IngredientLineItem & { costo: number })[];
        const breakdown = lines.map(l => ({ ...l, pct: costo > 0 ? (l.costo / costo) * 100 : 0 })).sort((a, b) => b.costo - a.costo);
        const noPrice = breakdown.filter(l => l.costo <= 0);

        const price70 = costo / 0.30;
        const price80 = costo / 0.20;
        const foodCost = hasPrice ? (costo / venta) * 100 : null;
        const vsMedia = hasPrice ? margen - g.avgMargin : null;

        return (
            <div className="h-full flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 shrink-0">
                        <Icon svg={ICONS.trendingUp} className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate" title={selectedRecipe.nombre}>{selectedRecipe.nombre}</h3>
                        <p className="text-[10px] text-slate-500 truncate">Rendimiento Financiero</p>
                    </div>
                </div>

                {/* Margin KPI */}
                <Card className={`p-4 border ${margen < 25 ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/40' : 'bg-teal-50/60 border-teal-100 dark:bg-teal-900/10 dark:border-teal-800/40'}`}>
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Margen Bruto</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tierClass}`}>{hasPrice ? tier : 'SIN PRECIO'}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-slate-800 dark:text-white">{margen.toFixed(1)}%</span>
                        <span className="text-xs text-slate-500">Objetivo: 80%</span>
                    </div>
                    <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${margen < 25 ? 'bg-rose-500' : margen >= 70 ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${Math.min(Math.max(margen, 0), 100)}%` }} />
                    </div>
                    {vsMedia !== null && (
                        <p className="text-[10px] mt-2 text-slate-500">
                            {vsMedia >= 0 ? '▲' : '▼'} {Math.abs(vsMedia).toFixed(0)} pts vs media del recetario ({g.avgMargin}%)
                        </p>
                    )}
                </Card>

                {/* Cost / Profit / Food cost */}
                <div className="grid grid-cols-2 gap-2">
                    <Card className="p-3 border bg-white/50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-700">
                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Costo Real</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100">€{costo.toFixed(2)}</div>
                    </Card>
                    <Card className={`p-3 border ${beneficio >= 0 ? 'bg-emerald-50/60 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/40' : 'bg-rose-50/60 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/40'}`}>
                        <div className={`text-[10px] uppercase font-bold tracking-wider mb-0.5 ${beneficio >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>Beneficio/ud</div>
                        <div className="text-xl font-bold text-slate-800 dark:text-slate-100">€{beneficio.toFixed(2)}</div>
                    </Card>
                </div>

                {/* Ingredient cost breakdown */}
                {breakdown.length > 0 && (
                    <Card className="p-4 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Coste por Ingrediente</span>
                        <div className="space-y-2.5">
                            {breakdown.slice(0, 6).map((l, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-[11px] mb-1 gap-2">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{l.nombre || 'Ingrediente'}</span>
                                        <span className="text-slate-500 font-mono shrink-0">{l.costo > 0 ? `€${l.costo.toFixed(2)}` : 's/precio'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: `${Math.min(l.pct, 100)}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {noPrice.length > 0 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-3 flex items-center gap-1">
                                <Icon svg={ICONS.alertCircle} className="w-3 h-3" /> {noPrice.length} ingrediente(s) sin precio en inventario
                            </p>
                        )}
                    </Card>
                )}

                {/* Price simulator */}
                <Card className="p-4 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Simulador de Precio</span>
                    <div className="space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Para 70% margen</span>
                            <span className="text-sm font-bold text-teal-600 dark:text-teal-400">€{price70.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Para 80% margen</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">€{price80.toFixed(2)}</span>
                        </div>
                        {foodCost !== null && (
                            <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-700">
                                <span className="text-xs text-slate-500">Food cost actual</span>
                                <span className={`text-sm font-bold ${foodCost <= 30 ? 'text-emerald-600' : foodCost <= 50 ? 'text-amber-600' : 'text-rose-600'}`}>{foodCost.toFixed(0)}%</span>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // ============================ GLOBAL ============================
    const maxCat = Math.max(1, ...g.categories.map(c => c.count));
    const maxState = Math.max(1, ...g.states.map(s => s.count));
    const maxBucket = Math.max(1, ...g.buckets.map(b => b.count));

    const RecipeRow = ({ r, m }: { r: Recipe; m: number }) => (
        <button onClick={() => onSelectRecipe?.(r)} className="w-full flex items-center justify-between gap-2 py-1 px-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left">
            <span className="text-[11px] text-slate-600 dark:text-slate-300 truncate">{r.nombre}</span>
            <span className={`text-[11px] font-bold font-mono shrink-0 ${m >= 70 ? 'text-emerald-600 dark:text-emerald-400' : m >= 50 ? 'text-teal-600' : 'text-amber-600'}`}>{m.toFixed(0)}%</span>
        </button>
    );

    return (
        <div className="h-full flex flex-col gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                    <Icon svg={ICONS.chart} className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Resumen Global</h3>
                    <p className="text-xs text-slate-500">Grimorio Analytics</p>
                </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { label: 'En Carta', value: `${g.carta}`, sub: `de ${g.total}` },
                    { label: 'Margen Medio', value: `${g.avgMargin}%`, sub: `${g.priced} con precio`, tone: g.avgMargin >= 70 ? 'text-emerald-600' : g.avgMargin >= 40 ? 'text-teal-600' : 'text-amber-600' },
                    { label: 'Coste Medio', value: `€${g.avgCost.toFixed(2)}`, sub: 'por receta' },
                    { label: 'Valor Recetario', value: `€${g.valorRecetario.toFixed(0)}`, sub: `${g.pctCosted}% costeadas` },
                ].map(k => (
                    <Card key={k.label} className="p-3 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                        <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">{k.label}</div>
                        <div className={`font-bold text-xl ${k.tone || 'text-slate-800 dark:text-slate-200'}`}>{k.value}</div>
                        <div className="text-[10px] text-slate-400">{k.sub}</div>
                    </Card>
                ))}
            </div>

            {/* Ranking */}
            {g.top.length > 0 && (
                <Card className="p-4 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5"><Icon svg={ICONS.award} className="w-3 h-3 text-emerald-500" /> Más rentables</span>
                    <div className="space-y-0.5 mb-3">{g.top.map(({ r, m }) => <RecipeRow key={r.id} r={r} m={m} />)}</div>
                    {g.bottom.length > 0 && (
                        <>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1.5"><Icon svg={ICONS.alertCircle} className="w-3 h-3 text-rose-500" /> Menos rentables</span>
                            <div className="space-y-0.5">{g.bottom.map(({ r, m }) => <RecipeRow key={r.id} r={r} m={m} />)}</div>
                        </>
                    )}
                </Card>
            )}

            {/* Alerts */}
            {(g.sinPrecio.length > 0 || g.bajoObjetivo.length > 0) && (
                <Card className="p-4 bg-amber-50/60 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/40">
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5"><Icon svg={ICONS.alertCircle} className="w-3 h-3" /> A revisar</span>
                    {g.sinPrecio.length > 0 && (
                        <div className="mb-2">
                            <p className="text-[11px] text-slate-500 mb-1">{g.sinPrecio.length} sin precio de venta</p>
                            <div className="space-y-0.5">{g.sinPrecio.slice(0, 3).map(r => (
                                <button key={r.id} onClick={() => onSelectRecipe?.(r)} className="w-full text-left text-[11px] text-slate-600 dark:text-slate-300 truncate py-0.5 px-1 rounded hover:bg-white/60 dark:hover:bg-slate-800">{r.nombre}</button>
                            ))}</div>
                        </div>
                    )}
                    {g.bajoObjetivo.length > 0 && (
                        <p className="text-[11px] text-slate-500">{g.bajoObjetivo.length} bajo el objetivo (70%)</p>
                    )}
                </Card>
            )}

            {/* Margin histogram */}
            <Card className="p-4 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Distribución de Márgenes</span>
                <div className="flex items-end justify-between gap-2 h-20">
                    {g.buckets.map(b => (
                        <div key={b.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{b.count}</span>
                            <div className="w-full rounded-t-md transition-all duration-700" style={{ height: `${(b.count / maxBucket) * 100}%`, minHeight: b.count > 0 ? '6px' : '2px', background: b.color, opacity: b.count > 0 ? 1 : 0.25 }} />
                            <span className="text-[9px] text-slate-400">{b.label}</span>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Category + State distribution */}
            <Card className="p-4 bg-white/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">Por Categoría</span>
                <div className="space-y-2.5 mb-4">
                    {g.categories.map(c => (
                        <div key={c.name}>
                            <div className="flex justify-between text-[11px] mb-1"><span className="text-slate-600 dark:text-slate-300 font-medium truncate">{c.name}</span><span className="text-slate-400 font-mono">{c.count}</span></div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${(c.count / maxCat) * 100}%` }} /></div>
                        </div>
                    ))}
                </div>
                {g.states.length > 0 && (
                    <>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Por Estado</span>
                        <div className="flex flex-wrap gap-1.5">
                            {g.states.map(s => (
                                <span key={s.name} className="text-[10px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">{s.name} · {s.count}</span>
                            ))}
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};
