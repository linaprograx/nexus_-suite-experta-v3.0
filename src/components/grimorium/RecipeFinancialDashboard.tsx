import React from 'react';
import { Recipe, Ingredient, IngredientLineItem } from '../../types';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { calculateRecipeProfitability } from '../../core/costing/profitabilityEngine';
import { nivelRentabilidad, ETIQUETA_NIVEL } from '../../core/costing/businessCostSettings';
import { NivelRentabilidad, RecipeProfitability } from '../../core/costing/profitability.types';
import { useBusinessCostSettings } from '../../hooks/useBusinessCostSettings';

interface RecipeFinancialDashboardProps {
    selectedRecipe: Recipe | null;
    allRecipes: Recipe[];
    allIngredients?: Ingredient[];
    onSelectRecipe?: (r: Recipe) => void;
}

const STATES = ['Idea', 'En pruebas', 'Terminado', 'Archivada'];
const STATE_LABEL: Record<string, string> = { Idea: 'Idea', 'En pruebas': 'En pruebas', Terminado: 'En carta', Archivada: 'Archivada' };

/**
 * Tinte de la píldora de nivel. **Solo presentación**: el nivel y su etiqueta
 * salen del motor (`nivelRentabilidad` / `ETIQUETA_NIVEL`). Aquí no se decide
 * qué es "excelente" — solo de qué color se pinta.
 */
const PILDORA_NIVEL: Record<NivelRentabilidad, string> = {
    excelente: 'bg-emerald-100 text-emerald-700',
    saludable: 'bg-teal-100 text-teal-700',
    ajustada: 'bg-amber-100 text-amber-700',
    baja: 'bg-orange-100 text-orange-700',
    critica: 'bg-rose-200 text-rose-800',
};
const BARRA_NIVEL: Record<NivelRentabilidad, string> = {
    excelente: 'bg-emerald-500',
    saludable: 'bg-teal-500',
    ajustada: 'bg-amber-500',
    baja: 'bg-orange-500',
    critica: 'bg-rose-500',
};

export const RecipeFinancialDashboard: React.FC<RecipeFinancialDashboardProps> = ({ selectedRecipe, allRecipes, allIngredients = [], onSelectRecipe }) => {
    const { ajustes } = useBusinessCostSettings();

    /** Objetivo de coste del negocio y su margen equivalente. Nada a fuego. */
    const objetivoPct = ajustes.targetBeverageCostPercentage;
    const margenObjetivo = 100 - objetivoPct;

    /**
     * Rentabilidad de cada receta, **una sola vez**.
     *
     * Antes este panel llamaba a `calculateRecipeCost` unas diez veces por
     * receta (media, cuatro barras del histograma, ranking, alertas, recuento
     * de costeadas). Con el catálogo real eso es un escandallo completo —
     * sub-recetas incluidas— repetido sin necesidad. El mismo patrón, y por el
     * mismo motivo, está en `RecipeList.tsx`.
     */
    const metricas = React.useMemo(() => {
        const m = new Map<string, RecipeProfitability>();
        for (const r of allRecipes) {
            if (!r?.id || m.has(r.id)) continue;
            m.set(r.id, calculateRecipeProfitability({ recipe: r, allIngredients, allRecipes, settings: ajustes }));
        }
        return m;
    }, [allRecipes, allIngredients, ajustes]);

    const pOf = React.useCallback((r: Recipe): RecipeProfitability =>
        metricas.get(r.id) || calculateRecipeProfitability({ recipe: r, allIngredients, allRecipes, settings: ajustes }),
        [metricas, allIngredients, allRecipes, ajustes]);

    const costOf = React.useCallback((r: Recipe) => pOf(r).realServedCost, [pOf]);
    const marginOf = React.useCallback((r: Recipe) => pOf(r).grossMarginPercentage, [pOf]);

    /**
     * COMPATIBILIDAD LEGACY, solo para los KPI de visualización «Coste Medio» y
     * «% costeadas».
     *
     * Hay recetas antiguas con el coste guardado en `costoReceta`/`costoTotal`
     * cuyo escandallo hoy resuelve 0 (ingredientes que ya no existen, líneas sin
     * vincular). El motor no tiene respaldo — y hace bien: es un valor guardado,
     * no un cálculo. Sin esto, esas recetas dejarían de contar como costeadas y
     * ambos KPI caerían sin causa visible.
     *
     * **No participa en ninguna fórmula de rentabilidad**: ni en el margen, ni
     * en el nivel, ni en el ranking, ni en el histograma. Solo rellena dos
     * cifras informativas.
     */
    const costeLegacyVisible = React.useCallback((r: Recipe) =>
        costOf(r) || r.costoReceta || r.costoTotal || 0, [costOf]);

    // --- Global analytics (real) ---
    const g = React.useMemo(() => {
        const total = allRecipes.length;
        const carta = allRecipes.filter(r => r.categorias?.includes('Carta') || r.categorias?.includes('Terminado')).length;
        const priced = allRecipes.filter(r => (r.precioVenta ?? 0) > 0);
        const costedList = allRecipes.filter(r => costeLegacyVisible(r) > 0);
        const avgMargin = priced.length ? Math.round(priced.reduce((s, r) => s + marginOf(r), 0) / priced.length) : 0;
        const avgCost = costedList.length ? costedList.reduce((s, r) => s + costeLegacyVisible(r), 0) / costedList.length : 0;
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
        const bajoObjetivo = priced.filter(r => marginOf(r) < margenObjetivo);

        // Margin histogram
        const buckets = [
            { label: '<25%', count: priced.filter(r => marginOf(r) < 25).length, color: '#f43f5e' },
            { label: '25-50', count: priced.filter(r => { const m = marginOf(r); return m >= 25 && m < 50; }).length, color: '#f59e0b' },
            { label: '50-70', count: priced.filter(r => { const m = marginOf(r); return m >= 50 && m < 70; }).length, color: '#14b8a6' },
            { label: '>70%', count: priced.filter(r => marginOf(r) >= 70).length, color: '#10b981' },
        ];

        return { total, carta, priced: priced.length, avgMargin, avgCost, valorRecetario, pctCosted, categories, states, top, bottom, sinPrecio, bajoObjetivo, buckets };
    }, [allRecipes, marginOf, costeLegacyVisible, margenObjetivo]);

    // ============================ SELECTED RECIPE ============================
    if (selectedRecipe) {
        const p = pOf(selectedRecipe);
        const costo = p.realServedCost;
        const venta = p.precioVenta;
        const margen = p.grossMarginPercentage;
        const beneficio = p.grossProfit;
        const hasPrice = venta > 0;
        const nivel = ETIQUETA_NIVEL[p.nivel];

        // El desglose por ingrediente no lo da el motor de rentabilidad: se pide
        // aparte al de coste, igual que hace `RentabilidadDetalle`. Los pesos van
        // sobre el coste de ingredientes, no sobre el coste servido, para que las
        // barras sigan sumando el 100% de lo que muestran.
        const cost = calculateRecipeCost(selectedRecipe, allIngredients, undefined, allRecipes);
        const baseIngredientes = p.ingredientCost;
        const lines = (cost.costoPorIngrediente || []) as (IngredientLineItem & { costo: number })[];
        const breakdown = lines.map(l => ({ ...l, pct: baseIngredientes > 0 ? (l.costo / baseIngredientes) * 100 : 0 })).sort((a, b) => b.costo - a.costo);
        const noPrice = breakdown.filter(l => l.costo <= 0);

        const foodCost = hasPrice ? p.beverageCostPercentage : null;
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
                <Card className={`p-4 border ${p.nivel === 'critica' ? 'bg-rose-50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-800/40' : 'bg-teal-50/60 border-teal-100 dark:bg-teal-900/10 dark:border-teal-800/40'}`}>
                    <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Margen Bruto</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${PILDORA_NIVEL[p.nivel]}`}>{hasPrice ? nivel.texto.toUpperCase() : 'SIN PRECIO'}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold text-slate-800 dark:text-white">{margen.toFixed(1)}%</span>
                        <span className="text-xs text-slate-500">Objetivo: {margenObjetivo}%</span>
                    </div>
                    <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full mt-3 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${BARRA_NIVEL[p.nivel]}`} style={{ width: `${Math.min(Math.max(margen, 0), 100)}%` }} />
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
                        {/* Los dos precios de antes salían de dividir el coste entre 0,30 y
                            0,20 — dos objetivos escritos a fuego que nadie había elegido.
                            El precio objetivo lo da el motor, con el objetivo del negocio,
                            su redondeo y sus impuestos ya aplicados. */}
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Para {margenObjetivo}% margen</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">€{p.precioObjetivoCliente.toFixed(2)}</span>
                        </div>
                        {foodCost !== null && (
                            <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-700">
                                <span className="text-xs text-slate-500">Food cost actual</span>
                                <span className={`text-sm font-bold ${foodCost <= objetivoPct ? 'text-emerald-600' : foodCost <= objetivoPct * 2 ? 'text-amber-600' : 'text-rose-600'}`}>{foodCost.toFixed(0)}%</span>
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
            <span className={`text-[11px] font-bold font-mono shrink-0 ${ETIQUETA_NIVEL[nivelRentabilidad(m, margenObjetivo)].clase}`}>{m.toFixed(0)}%</span>
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
                    { label: 'Margen Medio', value: `${g.avgMargin}%`, sub: `${g.priced} con precio`, tone: ETIQUETA_NIVEL[nivelRentabilidad(g.avgMargin, margenObjetivo)].clase },
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
                        <p className="text-[11px] text-slate-500">{g.bajoObjetivo.length} bajo el objetivo ({margenObjetivo}%)</p>
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
