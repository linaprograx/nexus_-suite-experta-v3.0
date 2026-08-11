import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { useStockMovements } from '../../hooks/useStockMovements';
import { buildCurrentStock } from '../../utils/stockUtils';
import { auditarUnidades, resumirUnidades, FilaUnidad, VeredictoUnidad } from '../../core/costing/unitAudit';
import { useApp } from '../../context/AppContext';
import { useQueryClient } from '@tanstack/react-query';
import { Ingredient } from '../../types';
import {
    planificarCorreccion, ejecutarCorreccion, deshacerCorreccion,
    UNIDADES_BASE, UnidadBase, FORMATOS_HABITUALES,
} from './fixUnit';

/**
 * I1 — Informe de unidades canónicas. **En seco: abrirlo no escribe nada.**
 *
 * Existe porque el catálogo no distingue entre «este bote es de 700 ml» y «no
 * sabemos qué es esto, pongamos 700 ml». `resolveStandardPack` nunca falla:
 * cuando no encuentra evidencia devuelve una botella de 700 ml, ese número se
 * guarda en `standardQuantity` y pasa a dividir el precio del envase. A partir
 * de ahí el coste por mililitro de esa ficha —y el de toda receta que la
 * use— sale de una suposición que nada señala como tal.
 *
 * Este informe repite esa resolución anotando **de dónde sale cada cifra**.
 * Lo que no se puede determinar con certeza sale `BLOQUEADO`, y no se propone
 * ningún valor para ello: corregirlo es una decisión humana, ficha a ficha.
 */

const eur = (n: number) => `€${n.toFixed(2)}`;

const ESTILO: Record<VeredictoUnidad, { cls: string; texto: string }> = {
    correcto: { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', texto: 'Correcto' },
    ajustable: { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', texto: 'Ajustable' },
    BLOQUEADO: { cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', texto: 'Bloqueado para revisión' },
};

/** En qué se ha basado la propuesta. Es lo que separa un dato de una suposición. */
const ORIGEN: Record<string, string> = {
    verificado: 'Confirmado a mano',
    explicito: 'La ficha ya trae cantidad y unidad canónicas',
    formato: 'Deducido de la unidad de compra',
    nombre: 'Deducido del nombre del producto',
    supuesto: 'Unidad sin tamaño de envase — se está suponiendo',
    contradictorio: 'La ficha y su unidad de compra se contradicen',
    heredado: '700 ml exactos sin nada que lo respalde',
    defecto: 'Sin ninguna pista del formato',
};

const normalizar = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const Celda: React.FC<{ etiqueta: string; children: React.ReactNode }> = ({ etiqueta, children }) => (
    <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider text-slate-400">{etiqueta}</div>
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{children}</div>
    </div>
);

/**
 * El corrector de una ficha. **Una ficha por operación, nunca en lote.**
 *
 * Solo pregunta el tamaño del envase. El precio por unidad base no se teclea:
 * sale del precio de compra dividido entre esa cantidad, con la merma
 * aplicada, igual que en el resto del motor. Antes de escribir enseña el
 * cambio de coste que va a provocar, y lo escrito se deshace.
 */
const Corrector: React.FC<{ ficha: Ingredient; onHecho: () => void }> = ({ ficha, onHecho }) => {
    const { db, appId, userId } = useApp();
    const [unidad, setUnidad] = React.useState<UnidadBase>(
        (UNIDADES_BASE as readonly string[]).includes(ficha.standardUnit || '')
            ? (ficha.standardUnit as UnidadBase) : 'ml',
    );
    const [cantidad, setCantidad] = React.useState<string>('');
    const [guardando, setGuardando] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const yaVerificada = (ficha as any).formatoVerificado === true;
    const plan = React.useMemo(
        () => planificarCorreccion(ficha, parseFloat(cantidad.replace(',', '.')) || 0, unidad),
        [ficha, cantidad, unidad],
    );

    const escribir = async (accion: 'corregir' | 'deshacer') => {
        if (!db || !appId || !userId) return;
        setGuardando(true); setError(null);
        try {
            if (accion === 'corregir') await ejecutarCorreccion(db, appId, userId, plan);
            else await deshacerCorreccion(db, appId, userId, ficha as any);
            onHecho();
        } catch (e: any) {
            console.error('[I1] correccion', e);
            setError(e?.message || 'No se pudo guardar.');
        } finally {
            setGuardando(false);
        }
    };

    if (yaVerificada) {
        return (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-2.5">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Formato confirmado a mano: <strong>{ficha.standardQuantity} {ficha.standardUnit}</strong>.
                </p>
                <button
                    onClick={() => escribir('deshacer')}
                    disabled={guardando}
                    className="shrink-0 px-3 h-8 rounded-lg text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors disabled:opacity-50"
                >
                    {guardando ? 'Deshaciendo…' : 'Deshacer'}
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-violet-500/5 border border-violet-500/20 p-2.5 space-y-2.5">
            <p className="text-[11px] font-bold text-violet-800 dark:text-violet-300">
                ¿De cuánto es este envase?
            </p>

            <div className="flex gap-1.5">
                {UNIDADES_BASE.map(u => (
                    <button
                        key={u}
                        onClick={() => setUnidad(u)}
                        className={`px-2.5 h-7 rounded-lg text-[11px] font-bold uppercase transition-colors ${unidad === u
                            ? 'bg-violet-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}
                    >{u}</button>
                ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
                {FORMATOS_HABITUALES[unidad].map(n => (
                    <button
                        key={n}
                        onClick={() => setCantidad(String(n))}
                        className={`px-2.5 h-8 rounded-lg text-[11px] font-bold transition-colors ${String(n) === cantidad
                            ? 'bg-violet-600 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-violet-400'}`}
                    >{n}</button>
                ))}
                <input
                    type="number"
                    inputMode="decimal"
                    value={cantidad}
                    onChange={e => setCantidad(e.target.value)}
                    placeholder="otro"
                    className="w-20 h-8 px-2 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                />
            </div>

            {plan.bloqueo ? (
                cantidad.trim() !== '' && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 leading-relaxed">{plan.bloqueo}</p>
                )
            ) : (
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    El coste pasaría de{' '}
                    <strong>{plan.precioBaseAnterior ? `${eur(plan.precioBaseAnterior)}/${plan.unidadAnterior}` : 'sin coste'}</strong>
                    {' '}a <strong>{eur(plan.precioBaseNuevo!)}/{plan.unidadNueva}</strong>
                    {plan.impactoPct !== undefined && Math.abs(plan.impactoPct) >= 0.05 && (
                        <span className={plan.impactoPct > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {' '}({plan.impactoPct > 0 ? '+' : ''}{plan.impactoPct.toFixed(1)}%)
                        </span>
                    )}
                    {plan.merma > 0 && <span className="text-slate-400"> · merma {plan.merma}% incluida</span>}
                </p>
            )}

            {error && <p className="text-[10px] text-rose-600 dark:text-rose-400">{error}</p>}

            <button
                onClick={() => escribir('corregir')}
                disabled={guardando || !!plan.bloqueo}
                className="w-full h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {guardando ? 'Guardando…' : 'Confirmar formato'}
            </button>
        </div>
    );
};

const Fila: React.FC<{ fila: FilaUnidad; ficha?: Ingredient; onCambio: () => void }> = ({ fila, ficha, onCambio }) => {
    const [abierta, setAbierta] = React.useState(false);
    const estilo = ESTILO[fila.veredicto];
    const enRecetas = fila.recetas.length + fila.subRecetas.length;

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 overflow-hidden">
            <button
                onClick={() => setAbierta(a => !a)}
                className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
                <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{fila.nombre}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {ORIGEN[fila.origen] || fila.origen}
                        {enRecetas > 0 && ` · en ${enRecetas} receta${enRecetas === 1 ? '' : 's'}`}
                    </div>
                </div>
                <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${estilo.cls}`}>
                    {estilo.texto}
                </span>
                <Icon svg={ICONS.chevronDown} className={`shrink-0 w-4 h-4 text-slate-400 transition-transform ${abierta ? 'rotate-180' : ''}`} />
            </button>

            {abierta && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Celda etiqueta="Unidad actual">{fila.unidadActual}</Celda>
                        <Celda etiqueta="Unidad propuesta">
                            {fila.cantidadPropuesta > 0
                                ? `${fila.cantidadPropuesta} ${fila.unidadPropuesta}`
                                : <span className="text-rose-500">sin propuesta</span>}
                        </Celda>
                        <Celda etiqueta="Factor">
                            {fila.factor > 0 ? `${fila.factor} ${fila.unidadPropuesta}/envase` : '—'}
                        </Celda>
                        <Celda etiqueta="Stock afectado">
                            {fila.stockCantidad > 0
                                ? `${fila.stockCantidad.toFixed(2)} ${fila.stockUnidad} · ${eur(fila.stockValor)}`
                                : 'sin existencias'}
                        </Celda>
                        <Celda etiqueta="Coste actual">
                            {fila.precioBaseActual ? `${eur(fila.precioBaseActual)}/${fila.unidadBaseActual || 'ud'}` : '—'}
                        </Celda>
                        <Celda etiqueta="Coste resultante">
                            {fila.precioBaseResultante ? `${eur(fila.precioBaseResultante)}/${fila.unidadPropuesta}` : '—'}
                        </Celda>
                        <Celda etiqueta="Impacto">
                            {fila.impactoPct === undefined ? '—' : (
                                <span className={Math.abs(fila.impactoPct) > 0.5 ? 'text-amber-600 dark:text-amber-400' : ''}>
                                    {fila.impactoPct > 0 ? '+' : ''}{fila.impactoPct.toFixed(1)}%
                                </span>
                            )}
                        </Celda>
                        <Celda etiqueta="Recetas / sub-recetas">
                            {fila.recetas.length} / {fila.subRecetas.length}
                        </Celda>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5">
                        {fila.motivo}
                    </p>

                    {enRecetas > 0 && (
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            <strong>Afecta a:</strong> {[...fila.recetas, ...fila.subRecetas.map(s => `${s} (sub-receta)`)].join(' · ')}
                        </div>
                    )}

                    {ficha && (fila.veredicto !== 'correcto' || (ficha as any).formatoVerificado) && (
                        <Corrector ficha={ficha} onHecho={onCambio} />
                    )}
                </div>
            )}
        </div>
    );
};

export const UnitAuditModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients: allIngredients } = useIngredients();
    const { recipes: allRecipes } = useRecipes();
    const { purchaseHistory } = usePurchaseIngredient();
    const { movements } = useStockMovements();

    const queryClient = useQueryClient();
    const porId = React.useMemo(
        () => new Map((allIngredients || []).map(i => [i.id, i])),
        [allIngredients],
    );

    const [filtro, setFiltro] = React.useState<VeredictoUnidad | 'todos'>('BLOQUEADO');
    const [busqueda, setBusqueda] = React.useState('');

    const stockItems = React.useMemo(
        () => buildCurrentStock(purchaseHistory || [], movements || []),
        [purchaseHistory, movements],
    );

    const filas = React.useMemo(() => {
        if (!allIngredients?.length) return [];
        return auditarUnidades({
            ingredients: allIngredients,
            stockItems,
            recipes: allRecipes || [],
        });
    }, [allIngredients, allRecipes, stockItems]);

    const resumen = React.useMemo(() => resumirUnidades(filas), [filas]);

    const visibles = React.useMemo(() => {
        const terminos = normalizar(busqueda).split(/\s+/).filter(Boolean);
        return filas
            .filter(f => filtro === 'todos' || f.veredicto === filtro)
            .filter(f => {
                if (!terminos.length) return true;
                const corpus = normalizar([f.nombre, f.id, f.unidadActual, f.origen].join(' '));
                return terminos.every(t => corpus.includes(t));
            })
            // Lo urgente primero: bloqueados que están dentro de alguna receta,
            // y dentro de ellos los que más valor de inventario arrastran.
            .sort((a, b) => {
                const peso = (f: FilaUnidad) =>
                    (f.veredicto === 'BLOQUEADO' ? 2 : 0) + (f.recetas.length + f.subRecetas.length > 0 ? 1 : 0);
                return (peso(b) - peso(a)) || (b.stockValor - a.stockValor);
            })
            .slice(0, 300);
    }, [filas, filtro, busqueda]);

    const Pestana = ({ valor, etiqueta, n, color }: {
        valor: VeredictoUnidad | 'todos'; etiqueta: string; n: number; color: string;
    }) => (
        <button
            onClick={() => setFiltro(valor)}
            className={`flex-1 py-2.5 text-center transition-colors ${filtro === valor
                ? 'bg-slate-100 dark:bg-slate-800'
                : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
            <div className={`text-lg font-bold ${color}`}>{n}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">{etiqueta}</div>
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden animate-in fade-in duration-200">
                <div className="relative px-5 py-4 shrink-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 overflow-hidden flex items-center justify-between">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white"><Icon svg={ICONS.beaker} className="w-5 h-5" /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Unidades del catálogo — informe</h2>
                            <p className="text-xs text-white/70">Solo lectura. Nada se modifica desde aquí.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                <div className="shrink-0 flex gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
                    <Pestana valor="BLOQUEADO" etiqueta="Bloqueados" n={resumen.bloqueados} color="text-rose-600" />
                    <Pestana valor="ajustable" etiqueta="Ajustables" n={resumen.ajustables} color="text-amber-600" />
                    <Pestana valor="correcto" etiqueta="Correctos" n={resumen.correctos} color="text-emerald-600" />
                    <Pestana valor="todos" etiqueta="Total" n={resumen.total} color="text-slate-700 dark:text-slate-200" />
                </div>

                {resumen.bloqueados > 0 && (
                    <div className="shrink-0 px-4 py-2.5 bg-rose-500/5 border-b border-rose-500/20">
                        <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                            <strong>{resumen.bloqueadosEnRecetas}</strong> de los bloqueados están dentro de alguna
                            receta, así que su coste ya está entrando en escandallos. Cuelgan de ellos{' '}
                            <strong>{eur(resumen.valorEnBloqueados)}</strong> de inventario.
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {!allIngredients?.length ? (
                        <div className="text-center py-16 text-sm text-slate-400">Cargando catálogo…</div>
                    ) : (
                        <>
                            <div className="sticky top-0 z-10 -mx-4 -mt-4 px-4 pt-4 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="search"
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        placeholder="Buscar por producto, unidad o ID…"
                                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500"
                                    />
                                </div>
                            </div>

                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pb-1">
                                Un producto sin formato conocido <strong>no aparece como desconocido</strong>: el
                                sistema le asigna en silencio una botella de 700 ml y divide su precio entre ese
                                número. Aquí se separa lo que consta de lo que se está suponiendo. Los{' '}
                                <strong>bloqueados</strong> no llevan propuesta: hay que mirarlos uno a uno.
                            </p>

                            {visibles.length === 0 ? (
                                <div className="text-center py-16">
                                    <Icon svg={ICONS.check} className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Nada que mostrar con este filtro.</p>
                                </div>
                            ) : (
                                visibles.map(f => (
                                    <Fila
                                        key={f.id}
                                        fila={f}
                                        ficha={porId.get(f.id)}
                                        onCambio={() => queryClient.invalidateQueries({ queryKey: ['ingredients'] })}
                                    />
                                ))
                            )}

                            {visibles.length === 300 && (
                                <p className="text-center text-[10px] text-slate-400 pt-2">
                                    Mostrando las 300 primeras. Afina con la búsqueda.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
