import React from 'react';
import { Recipe, Ingredient } from '../../types';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { calculateRecipeProfitability } from '../../core/costing/profitabilityEngine';
import { ETIQUETA_NIVEL, redondearPrecio } from '../../core/costing/businessCostSettings';
import { OrigenDelDato } from '../../core/costing/profitability.types';
import { useBusinessCostSettings } from '../../hooks/useBusinessCostSettings';

/**
 * Rentabilidad de una receta.
 *
 * **No calcula nada.** Todo sale de `calculateRecipeProfitability`, que es el
 * punto único de cálculo: si aquí hiciera falta un número que no viene, se
 * añade allí. Es la regla que evita que dos pantallas muestren márgenes
 * distintos de la misma receta — así han empezado los peores fallos del
 * proyecto.
 *
 * La jerarquía es deliberada: primero los KPI que se miran de un vistazo,
 * después el desglose para quien quiera auditarlo. Veinte números sin orden no
 * son más información, son menos.
 *
 * Y cada línea del desglose declara **de dónde sale**: un ingrediente medido y
 * una imputación de estructura no valen lo mismo, y presentarlas iguales daría
 * una falsa precisión.
 */

interface Props {
    receta: Recipe;
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    /** Coste real derivado del stock. `-1` cuando no hay ninguna compra. */
    costeReal: number;
    precioVenta: number;
    /** Fracción del coste respaldada por compras (0–1). */
    cobertura?: number;
}

const eur = (n: number) => `€${(isNaN(n) ? 0 : n).toFixed(2)}`;
const pct = (n: number) => `${(isNaN(n) ? 0 : n).toFixed(0)}%`;

const SELLO: Record<OrigenDelDato, { texto: string; clase: string } | null> = {
    real: null,
    estimado: { texto: 'estimado', clase: 'text-amber-600 dark:text-amber-500' },
    imputado: { texto: 'imputado', clase: 'text-violet-600 dark:text-violet-400' },
};

const Bloque: React.FC<{ titulo: string; children: React.ReactNode; extra?: React.ReactNode }> =
    ({ titulo, children, extra }) => (
        <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{titulo}</p>
                {extra}
            </div>
            {children}
        </div>
    );

const Fila: React.FC<{ concepto: string; importe: string; origen?: OrigenDelDato; fuerte?: boolean }> =
    ({ concepto, importe, origen = 'real', fuerte }) => {
        const sello = SELLO[origen];
        return (
            <div className={`flex items-baseline justify-between gap-3 ${fuerte ? 'pt-2 mt-1 border-t border-slate-200 dark:border-slate-700' : ''}`}>
                <span className={`min-w-0 break-words ${fuerte ? 'text-sm font-bold text-slate-700 dark:text-slate-200' : 'text-sm text-slate-600 dark:text-slate-300'}`}>
                    {concepto}
                    {sello && <span className={`ml-2 text-[10px] ${sello.clase}`}>{sello.texto}</span>}
                </span>
                <span className={`shrink-0 tabular-nums ${fuerte ? 'text-sm font-bold text-slate-800 dark:text-slate-100' : 'text-sm text-slate-500 dark:text-slate-400'}`}>
                    {importe}
                </span>
            </div>
        );
    };

export const RentabilidadDetalle: React.FC<Props> = ({
    receta, allIngredients, allRecipes, costeReal, precioVenta, cobertura = 0,
}) => {
    const { ajustes } = useBusinessCostSettings();
    const [verDesglose, setVerDesglose] = React.useState(false);
    const [objetivo, setObjetivo] = React.useState(ajustes.targetBeverageCostPercentage);
    React.useEffect(() => setObjetivo(ajustes.targetBeverageCostPercentage), [ajustes.targetBeverageCostPercentage]);

    const precioReferencia = (receta.precioVenta || 0) || precioVenta || 0;

    const r = React.useMemo(() => calculateRecipeProfitability({
        recipe: receta,
        allIngredients,
        allRecipes,
        settings: { ...ajustes, targetBeverageCostPercentage: objetivo },
        precioVenta: precioReferencia,
    }), [receta, allIngredients, allRecipes, ajustes, objetivo, precioReferencia]);

    const nivel = ETIQUETA_NIVEL[r.nivel];
    const hayReal = costeReal !== -1 && costeReal > 0;
    const desviacion = hayReal && r.ingredientCost > 0
        ? ((costeReal - r.ingredientCost) / r.ingredientCost) * 100
        : null;

    const pesos = React.useMemo(() => {
        const { costoPorIngrediente } = calculateRecipeCost(receta, allIngredients, undefined, allRecipes);
        const base = r.ingredientCost || 1;
        return [...(costoPorIngrediente || [])]
            .map((i: any) => ({ nombre: i.nombre || 'Ingrediente', costo: i.costo || 0, peso: ((i.costo || 0) / base) * 100 }))
            .filter(i => i.costo > 0)
            .sort((a, b) => b.costo - a.costo)
            .slice(0, 4);
    }, [receta, allIngredients, allRecipes, r.ingredientCost]);

    // Alternativas alrededor del precio actual, sin bajar del objetivo.
    const sugerencias = React.useMemo(() => {
        if (!precioReferencia || !r.directRecipeCost) return [];
        const suelo = r.precioObjetivoCliente;
        const paso = (f: number) => redondearPrecio(precioReferencia * f, ajustes.redondeoPrecio);
        return precioReferencia >= suelo
            ? [
                { etiqueta: 'Moderado', precio: Math.max(suelo, paso(0.85)) },
                { etiqueta: 'Agresivo', precio: Math.max(suelo, paso(0.80)) },
            ]
            : [
                { etiqueta: 'Subida realista', precio: paso(1.15) },
                { etiqueta: `Para el ${objetivo}% de coste`, precio: suelo },
            ];
    }, [precioReferencia, r.directRecipeCost, r.precioObjetivoCliente, ajustes.redondeoPrecio, objetivo]);

    const margenDe = (p: number) => {
        const neto = ajustes.precioIncluyeImpuestos && ajustes.taxRateVenta > 0
            ? p / (1 + ajustes.taxRateVenta) : p;
        return neto > 0 ? ((neto - r.realServedCost) / neto) * 100 : 0;
    };

    return (
        <div className="space-y-3">
            {/* ── KPI. Lo que se mira de un vistazo. */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-slate-200/60 dark:border-white/10">
                <div className="flex items-baseline justify-between gap-3 mb-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resultado por unidad</p>
                    <span className={`text-xs font-bold uppercase tracking-wider ${nivel.clase}`}>{nivel.texto}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Beneficio</span>
                        <span className={`text-2xl font-bold tabular-nums ${r.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {eur(r.grossProfit)}
                        </span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Margen</span>
                        <span className={`text-2xl font-bold tabular-nums ${nivel.clase}`}>{pct(r.grossMarginPercentage)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Coste servido</span>
                        <span className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">{eur(r.realServedCost)}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Beverage cost</span>
                        <span className="text-lg font-bold tabular-nums text-slate-700 dark:text-slate-200">{pct(r.beverageCostPercentage)}</span>
                    </div>
                </div>
                <button
                    onClick={() => setVerDesglose(v => !v)}
                    className="mt-3 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider"
                >
                    {verDesglose ? 'Ocultar desglose' : 'Ver desglose'}
                </button>
            </div>

            {/* ── Desglose completo, solo bajo petición. */}
            {verDesglose && (
                <>
                    <Bloque titulo="Coste real servido">
                        <div className="space-y-1.5">
                            {r.desglose.map((l, i) => (
                                <Fila key={i} concepto={l.concepto} importe={eur(l.importe)} origen={l.origen} />
                            ))}
                            <Fila concepto="Total" importe={eur(r.realServedCost)} fuerte />
                        </div>
                        {r.soloIngredientes && (
                            <p className="text-[11px] text-slate-400 mt-2.5 leading-snug">
                                Solo se están contando ingredientes. Hielo premium, comisiones del TPV, merma o
                                mano de obra se configuran aparte y aparecerán aquí en cuanto existan.
                            </p>
                        )}
                    </Bloque>

                    <Bloque titulo="Ingresos">
                        <div className="space-y-1.5">
                            <Fila concepto="Precio de venta" importe={eur(r.precioFinalCliente)} />
                            {r.taxAmount > 0 && <Fila concepto="Impuestos" importe={`−${eur(r.taxAmount)}`} />}
                            <Fila concepto="Ingreso neto" importe={eur(r.netRevenue)} fuerte />
                        </div>
                        {ajustes.taxRateVenta === 0 && (
                            <p className="text-[11px] text-slate-400 mt-2.5">
                                Sin impuestos configurados: el ingreso neto es el precio.
                            </p>
                        )}
                    </Bloque>

                    {r.overheadCost > 0 && (
                        <Bloque titulo="Con estructura imputada">
                            <div className="space-y-1.5">
                                <Fila concepto="Coste servido" importe={eur(r.realServedCost)} />
                                <Fila concepto="Estructura" importe={eur(r.overheadCost)} origen="imputado" />
                                <Fila concepto="Coste operativo" importe={eur(r.fullOperatingCost)} fuerte />
                                <Fila concepto="Beneficio operativo" importe={eur(r.operatingProfit)} />
                                <Fila concepto="Margen operativo" importe={pct(r.operatingMarginPercentage)} />
                            </div>
                        </Bloque>
                    )}

                    <Bloque titulo="Margen de contribución">
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-sm text-slate-600 dark:text-slate-300">Por unidad vendida</span>
                            <span className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">{eur(r.contributionMargin)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1.5">
                            Lo que cada unidad aporta a cubrir los costes fijos del negocio.
                        </p>
                    </Bloque>
                </>
            )}

            {/* ── Desviación entre lo previsto y lo que cuesta de verdad */}
            <Bloque titulo="Desviación del coste">
                {desviacion === null ? (
                    <p className="text-sm text-slate-400 italic">
                        Todavía no hay compras registradas de estos ingredientes, así que no hay con qué
                        comparar. En cuanto registres alguna, aquí verás si la receta se encarece.
                    </p>
                ) : (
                    <div className="flex items-baseline gap-3 flex-wrap">
                        <span className={`text-2xl font-bold tabular-nums ${desviacion > 10 ? 'text-rose-600 dark:text-rose-400' : desviacion < -5 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                            {desviacion > 0 ? '+' : ''}{desviacion.toFixed(0)}%
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {eur(r.ingredientCost)} previsto → {eur(costeReal)} real
                            {cobertura > 0 && cobertura < 0.999 && (
                                <span className="block text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                    Solo el {Math.round(cobertura * 100)}% del coste está respaldado por compras;
                                    el resto es teórico.
                                </span>
                            )}
                        </span>
                    </div>
                )}
            </Bloque>

            {/* ── Dónde está el coste: la parte accionable */}
            {pesos.length > 0 && (
                <Bloque titulo="Dónde está el coste">
                    <div className="space-y-2.5">
                        {pesos.map((i, k) => (
                            <div key={k}>
                                <div className="flex items-baseline justify-between gap-3 mb-1">
                                    <span className="text-sm text-slate-700 dark:text-slate-200 min-w-0 break-words">{i.nombre}</span>
                                    <span className="shrink-0 text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
                                        {eur(i.costo)} · {i.peso.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, i.peso)}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Bloque>
            )}

            {/* ── Precio y alternativas */}
            <Bloque
                titulo="Precio y alternativas"
                extra={
                    <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Coste objetivo
                        <input
                            type="number" min={1} max={95} value={objetivo}
                            onChange={e => setObjetivo(Number(e.target.value))}
                            aria-label="Coste de bebida objetivo en porcentaje"
                            className="w-16 h-8 px-2 rounded-lg text-sm tabular-nums bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                        />%
                    </label>
                }
            >
                {!precioReferencia ? (
                    <p className="text-sm text-slate-400 italic">
                        Esta receta todavía no tiene precio de venta. Ponle uno y aquí verás hasta dónde puedes moverlo.
                    </p>
                ) : (
                    <>
                        <div className="flex items-baseline gap-3 mb-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/60 flex-wrap">
                            <div>
                                <span className="block text-[10px] text-slate-400 uppercase tracking-widest">Actual</span>
                                <span className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{eur(precioReferencia)}</span>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${nivel.clase}`}>{pct(r.grossMarginPercentage)} de margen</span>
                            <span className="text-xs text-slate-400">Recomendado {eur(r.precioObjetivoCliente)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {sugerencias.map((sug, k) => (
                                <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                                    <span className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">{sug.etiqueta}</span>
                                    <span className="block text-xl font-bold tabular-nums text-teal-600 dark:text-teal-400">{eur(sug.precio)}</span>
                                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        {pct(margenDe(sug.precio))} · {sug.precio < precioReferencia ? `−${eur(precioReferencia - sug.precio)}` : `+${eur(sug.precio - precioReferencia)}`}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {r.precioObjetivoCliente > precioReferencia * 1.6 && (
                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2.5 leading-snug">
                                Llegar al {objetivo}% de coste exigiría multiplicar el precio por{' '}
                                {(r.precioObjetivoCliente / precioReferencia).toFixed(1)}. Con este coste, la palanca
                                no es el precio: mira arriba qué ingrediente se lleva la mayor parte.
                            </p>
                        )}
                    </>
                )}
            </Bloque>
        </div>
    );
};
