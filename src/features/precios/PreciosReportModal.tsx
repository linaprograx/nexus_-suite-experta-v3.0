import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import {
    seriesDePrecio, explicarSerie, mayoresMovimientos, diferenciasEntreProveedores, resumenDeSeries, SeriePrecios,
} from '../../core/precios/historicoPrecios';
import { gastoPorProveedor, concentracion } from '../../core/compras/gastoPorProveedor';

/**
 * Histórico de precios. **Solo lectura.**
 *
 * No hay colección nueva detrás: cada compra ya era una observación de precio
 * con su fecha, y `purchases` no se sobrescribe nunca. Lo que faltaba era
 * leerlas como una serie. Ver `core/precios/historicoPrecios.ts`.
 */

const eur = (n: number) => `€${n.toFixed(2)}`;

const nombreDe = (s: SeriePrecios, porId: Map<string, { nombre?: string }>) =>
    porId.get(s.productoId)?.nombre || s.observaciones[0]?.proveedorNombre || s.productoId;

export const PreciosReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients: allIngredients } = useIngredients();
    const { purchaseHistory } = usePurchaseIngredient();

    const porId = React.useMemo(
        () => new Map((allIngredients || []).filter(i => i?.id).map(i => [i.id, i])),
        [allIngredients],
    );

    const series = React.useMemo(
        () => seriesDePrecio(purchaseHistory || [], allIngredients || []),
        [purchaseHistory, allIngredients],
    );

    const movimientos = React.useMemo(() => mayoresMovimientos(series, { limite: 30 }), [series]);
    const subidas = movimientos.filter(s => (s.variacionPct || 0) > 0);
    const bajadas = movimientos.filter(s => (s.variacionPct || 0) < 0).reverse();
    const diferencias = React.useMemo(() => diferenciasEntreProveedores(series), [series]);

    const resumen = React.useMemo(() => resumenDeSeries(series), [series]);

    /**
     * Punto 34: gasto por proveedor y por mes.
     *
     * Vive aquí y no en un botón nuevo porque es la misma pregunta que el resto
     * del panel —qué está pasando con lo que compro— vista por el otro lado:
     * arriba, cómo se mueven los precios; abajo, a quién se le va el dinero.
     */
    const gastos = React.useMemo(() => gastoPorProveedor(purchaseHistory || []), [purchaseHistory]);
    const pesos = React.useMemo(() => concentracion(gastos), [gastos]);
    const gastoTotal = React.useMemo(() => gastos.reduce((a, g) => a + g.total, 0), [gastos]);

    const Cifra: React.FC<{ n: React.ReactNode; etiqueta: string; color?: string }> = ({ n, etiqueta, color }) => (
        <div className="flex-1 min-w-0 text-center px-2">
            <div className={`text-xl font-black tabular-nums ${color || 'text-slate-800 dark:text-slate-100'}`}>{n}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 truncate">{etiqueta}</div>
        </div>
    );

    const Fila: React.FC<{ s: SeriePrecios }> = ({ s }) => {
        const v = s.variacionPct || 0;
        return (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {nombreDe(s, porId)}
                    </span>
                    <span className={`text-xs font-black tabular-nums shrink-0 ${v > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {v > 0 ? '+' : ''}{v.toFixed(1)} %
                    </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-500 leading-relaxed">{explicarSerie(s)}</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shrink-0">
                    <span className="p-2 rounded-xl bg-white/15"><Icon svg={ICONS.trendingUp} className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-base">Precios — histórico</h2>
                        <p className="text-[11px] text-white/80">Solo lectura. Sale de tus compras, que nunca se sobrescriben.</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex divide-x divide-slate-200 dark:divide-slate-700 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <Cifra n={resumen.productos} etiqueta="con compras" />
                    <Cifra n={resumen.conHistorial} etiqueta="con historial" />
                    <Cifra n={resumen.subidas} etiqueta="han subido" color="text-rose-600" />
                    <Cifra n={resumen.bajadas} etiqueta="han bajado" color="text-emerald-600" />
                    <Cifra n={diferencias.length} etiqueta="difieren" color="text-amber-600" />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    {gastos.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                                A quién se le va el dinero ({eur(gastoTotal)})
                            </h3>
                            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                Sale de tus compras registradas. Un proveedor con la mayor parte del gasto no es un
                                buen precio: es una <strong>dependencia</strong>.
                            </p>
                            <div className="space-y-2">
                                {gastos.slice(0, 12).map((g, i) => (
                                    <div key={g.proveedorId} className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {g.proveedorNombre}
                                            </span>
                                            <span className="text-xs font-black tabular-nums text-slate-700 dark:text-slate-200 shrink-0">
                                                {eur(g.total)}
                                                <span className="text-slate-400 font-normal"> · {pesos[i]?.pct ?? 0} %</span>
                                            </span>
                                        </div>
                                        {/* La barra dice lo mismo que el número, pero de un vistazo. */}
                                        <div className="mt-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, pesos[i]?.pct ?? 0)}%` }} />
                                        </div>
                                        <p className="mt-1 text-[10px] text-slate-500">
                                            {g.compras} compra(s) · {g.productos} producto(s)
                                            {g.porMes.length > 1 && ` · ${g.porMes.length} meses`}
                                            {g.ultima && ` · última el ${g.ultima.toLocaleDateString()}`}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {series.size === 0 && (
                        <p className="text-[11px] text-slate-500 text-center py-8">
                            Todavía no hay compras registradas con precio.
                        </p>
                    )}

                    {diferencias.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2">
                                El mismo producto, a dos precios ({diferencias.length})
                            </h3>
                            <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                                Comparando el <strong>último</strong> precio de cada proveedor, y solo dentro de la misma
                                unidad: mezclar una botella con un kilo daría diferencias inventadas.
                            </p>
                            <div className="space-y-2">
                                {diferencias.slice(0, 25).map(d => (
                                    <div key={d.serie.productoId} className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-2.5">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                                {nombreDe(d.serie, porId)}
                                            </span>
                                            <span className="text-xs font-black text-amber-600 tabular-nums shrink-0">
                                                +{d.diferenciaPct.toFixed(1)} %
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-300">
                                            <strong>{d.barato.proveedorNombre}</strong> {eur(d.barato.precio)}
                                            {'  ·  '}
                                            <strong>{d.caro.proveedorNombre}</strong> {eur(d.caro.precio)}
                                            <span className="text-slate-400"> / {d.barato.unidad}</span>
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {subidas.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-2">
                                Lo que más ha subido ({subidas.length})
                            </h3>
                            <div className="space-y-2">{subidas.map(s => <Fila key={s.productoId} s={s} />)}</div>
                        </div>
                    )}

                    {bajadas.length > 0 && (
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-2">
                                Lo que ha bajado ({bajadas.length})
                            </h3>
                            <div className="space-y-2">{bajadas.map(s => <Fila key={s.productoId} s={s} />)}</div>
                        </div>
                    )}

                    {/* Cinco ceros no informan de nada, y pueden significar tres
                        cosas distintas. Se desglosa siempre que no haya
                        movimientos que enseñar. */}
                    {series.size > 0 && resumen.subidas === 0 && resumen.bajadas === 0 && (
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 space-y-1.5">
                            <p><strong>Ningún precio se ha movido todavía</strong>, y conviene saber por qué:</p>
                            <ul className="space-y-0.5 pl-1">
                                <li>· <strong>{resumen.unaSola}</strong> productos tienen una sola compra: con un punto no
                                    hay variación que dar, y un «0 %» se leería como «no ha cambiado» cuando lo cierto es
                                    «no se sabe».</li>
                                <li>· <strong>{resumen.estables}</strong> se han comprado varias veces al mismo precio.</li>
                                {resumen.unidadesMezcladas > 0 && (
                                    <li>· <strong>{resumen.unidadesMezcladas}</strong> se han comprado en unidades distintas,
                                        así que comparar el número diría una barbaridad: una botella contra un kilo.</li>
                                )}
                            </ul>
                            <p className="text-slate-500">
                                Esto se llenará solo: a partir de la segunda compra de algo a otro precio, aparece aquí.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
