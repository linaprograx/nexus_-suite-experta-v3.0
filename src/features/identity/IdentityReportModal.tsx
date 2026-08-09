import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { useRecipes } from '../../hooks/useRecipes';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useStockRules } from '../../hooks/useStockRules';
import { buildCurrentStock } from '../../utils/stockUtils';
import { detectarCandidatos, GrupoCandidato, RiesgoFusion, FichaCandidata } from './duplicateCandidates';

/**
 * Informe en seco de productos duplicados. **Fase A: no escribe nada.**
 *
 * No hay ningún botón de fusionar aquí, y es deliberado. Este panel solo
 * responde a «¿cuántos duplicados reales tengo y qué cuelga de cada uno?».
 * La fusión es la Fase D, va de una en una y con aprobación.
 */

const ESTILO_RIESGO: Record<RiesgoFusion, { cls: string; texto: string }> = {
    BAJO: { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', texto: 'Riesgo bajo' },
    MEDIO: { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', texto: 'Riesgo medio' },
    ALTO: { cls: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30', texto: 'Riesgo alto' },
    BLOQUEADO: { cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', texto: 'Bloqueado para revisión' },
};

const eur = (n: number) => `€${n.toFixed(2)}`;

/** Búsqueda tolerante a mayúsculas y acentos, nunca una regla de identidad. */
const normalizarBusqueda = (valor: string) => valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const coincideBusqueda = (grupo: GrupoCandidato, consulta: string) => {
    const terminos = normalizarBusqueda(consulta).split(/\s+/).filter(Boolean);
    if (terminos.length === 0) return true;

    // Busca en todos los datos que ayudan a encontrar el grupo, pero no altera
    // su riesgo ni convierte una coincidencia de texto en autoridad de fusión.
    const corpus = normalizarBusqueda([...grupo.fichas, ...grupo.variantes]
        .map(f => [f.nombre, f.id, f.categoria, f.familia, f.unidad, f.formato, ...f.proveedores].join(' '))
        .join(' '));

    return terminos.every(termino => corpus.includes(termino));
};

const Dato: React.FC<{ etiqueta: string; children: React.ReactNode }> = ({ etiqueta, children }) => (
    <div className="min-w-0">
        <span className="block text-[9px] uppercase tracking-wider text-slate-400">{etiqueta}</span>
        <span className="block text-[11px] text-slate-700 dark:text-slate-200 truncate">{children}</span>
    </div>
);

const Ficha: React.FC<{ f: FichaCandidata; esMaestro: boolean }> = ({ f, esMaestro }) => (
    <div className={`rounded-xl border p-3 ${esMaestro
        ? 'border-emerald-400/60 bg-emerald-500/5'
        : 'border-slate-200 dark:border-slate-700 bg-white/40 dark:bg-slate-800/40'}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{f.nombre}</p>
            {esMaestro && (
                <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500 text-white">
                    maestro propuesto
                </span>
            )}
        </div>
        <p className="text-[9px] font-mono text-slate-400 mb-2 truncate">{f.id}</p>

        <div className="grid grid-cols-3 gap-2 mb-2">
            <Dato etiqueta="Categoría">{f.categoria}</Dato>
            <Dato etiqueta="Unidad">{f.unidad}</Dato>
            <Dato etiqueta="Formato">{f.formato}</Dato>
            <Dato etiqueta="Stock">{f.stockCantidad} {f.stockUnidad}</Dato>
            <Dato etiqueta="Valor">{eur(f.stockValor)}</Dato>
            <Dato etiqueta="Precio cat.">
                {f.standardPrice ? `${f.standardPrice} /base` : f.precioCompra ? eur(f.precioCompra) : '—'}
            </Dato>
            <Dato etiqueta="Compras">{f.compras} · {eur(f.importeCompras)}</Dato>
            <Dato etiqueta="Movim.">{f.movimientos}</Dato>
            <Dato etiqueta="Regla">{f.tieneRegla ? `mín ${f.reglaMin}` : 'sin regla'}</Dato>
        </div>

        {(f.recetas.length > 0 || f.subRecetas.length > 0) && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1">
                {f.recetas.length > 0 && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-300">
                        <strong className="text-amber-600 dark:text-amber-400">{f.recetas.length} receta(s):</strong>{' '}
                        {f.recetas.join(' · ')}
                    </p>
                )}
                {f.subRecetas.length > 0 && (
                    <p className="text-[10px] text-slate-600 dark:text-slate-300">
                        <strong className="text-violet-600 dark:text-violet-400">{f.subRecetas.length} sub-receta(s):</strong>{' '}
                        {f.subRecetas.join(' · ')}
                    </p>
                )}
            </div>
        )}
        {f.proveedores.length > 0 && (
            <p className="text-[10px] text-slate-500 mt-1">Proveedores: {f.proveedores.length}</p>
        )}
    </div>
);

const Grupo: React.FC<{ g: GrupoCandidato }> = ({ g }) => {
    const [abierto, setAbierto] = React.useState(false);
    const estilo = ESTILO_RIESGO[g.riesgo];

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
                onClick={() => setAbierto(o => !o)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-1 rounded-full border ${estilo.cls}`}>
                    {estilo.texto}
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {g.fichas.map(f => f.nombre).join('  ·  ')}
                    </span>
                    <span className="block text-[10px] text-slate-400">{g.fichas.length} fichas</span>
                </span>
                <Icon svg={abierto ? ICONS.chevronUp || ICONS.x : ICONS.chevronDown || ICONS.plus} className="w-4 h-4 text-slate-400 shrink-0" />
            </button>

            {abierto && (
                <div className="p-3 pt-0 space-y-3">
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 leading-relaxed">
                        {g.motivo}
                    </p>

                    <div className="grid gap-2 sm:grid-cols-2">
                        {g.fichas.map(f => (
                            <Ficha key={f.id} f={f} esMaestro={f.id === g.maestroPropuesto} />
                        ))}
                    </div>

                    {g.variantes.length > 0 && (
                        <div className="rounded-xl border border-rose-300/60 dark:border-rose-500/30 bg-rose-500/5 p-2.5">
                            <span className="block text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
                                Variantes cercanas — NO se fusionan
                            </span>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                Tienen alguna palabra que las distingue, así que pueden ser otro producto.
                                Se muestran solo para que decidas con todo delante.
                            </p>
                            <ul className="mt-1.5 space-y-0.5">
                                {g.variantes.map(v => (
                                    <li key={v.id} className="text-[11px] text-slate-700 dark:text-slate-200">
                                        · <strong>{v.nombre}</strong>
                                        <span className="text-slate-400"> — {v.categoria} · {v.stockCantidad} {v.stockUnidad}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1">
                            Simulación de fusión
                        </span>
                        {g.simulacion.sumable ? (
                            <p className="text-[11px] text-slate-700 dark:text-slate-200">
                                Stock resultante: <strong>{g.simulacion.cantidad.toFixed(2)} {g.simulacion.base}</strong>
                                {' · '}valor <strong>{eur(g.simulacion.valor)}</strong>
                            </p>
                        ) : (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400">{g.simulacion.motivo}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const IdentityReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients: allIngredients } = useIngredients();
    const { recipes: allRecipes } = useRecipes();
    const { purchaseHistory } = usePurchaseIngredient();
    const { movements } = useStockMovements();
    const { rules } = useStockRules();
    const [busqueda, setBusqueda] = React.useState('');

    const stockItems = React.useMemo(
        () => buildCurrentStock(purchaseHistory || [], movements || []),
        [purchaseHistory, movements],
    );

    const grupos = React.useMemo(() => {
        if (!allIngredients?.length) return [];
        return detectarCandidatos({
            allIngredients,
            allRecipes: allRecipes || [],
            stockItems,
            purchases: purchaseHistory || [],
            movements: movements || [],
            rules: rules || [],
        });
    }, [allIngredients, allRecipes, stockItems, purchaseHistory, movements, rules]);

    const resumen = React.useMemo(() => {
        const cuenta = (r: RiesgoFusion) => grupos.filter(g => g.riesgo === r).length;
        return {
            total: grupos.length,
            fichas: grupos.reduce((a, g) => a + g.fichas.length, 0),
            bajo: cuenta('BAJO'), medio: cuenta('MEDIO'), alto: cuenta('ALTO'),
            // Lo que de verdad queda fuera de una fusión son las VARIANTES.
            // El contador de 'bloqueados' se quedó a cero por construcción en
            // cuanto el núcleo pasó a ser solo nombres idénticos: un número que
            // nunca puede cambiar no informa de nada.
            variantes: grupos.reduce((a, g) => a + g.variantes.length, 0),
        };
    }, [grupos]);

    const gruposVisibles = React.useMemo(
        () => grupos.filter(grupo => coincideBusqueda(grupo, busqueda)),
        [grupos, busqueda],
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden animate-in fade-in duration-200">
                <div className="relative px-5 py-4 shrink-0 bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-600 overflow-hidden flex items-center justify-between">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-center gap-3">
                        <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white"><Icon svg={ICONS.copy || ICONS.layers} className="w-5 h-5" /></span>
                        <div>
                            <h2 className="text-base font-bold text-white">Productos duplicados — informe</h2>
                            <p className="text-xs text-white/70">Solo lectura. Nada se modifica desde aquí.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                <div className="shrink-0 grid grid-cols-5 gap-px bg-slate-200 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-700">
                    {[
                        { l: 'Grupos', v: resumen.total, c: 'text-slate-700 dark:text-slate-200' },
                        { l: 'Fichas', v: resumen.fichas, c: 'text-slate-700 dark:text-slate-200' },
                        { l: 'Bajo', v: resumen.bajo, c: 'text-emerald-600' },
                        { l: 'Medio/Alto', v: resumen.medio + resumen.alto, c: 'text-amber-600' },
                        { l: 'Variantes', v: resumen.variantes, c: 'text-rose-600' },
                    ].map(k => (
                        <div key={k.l} className="bg-white dark:bg-slate-900 py-2.5 text-center">
                            <div className={`text-lg font-bold ${k.c}`}>{k.v}</div>
                            <div className="text-[9px] uppercase tracking-wider text-slate-400">{k.l}</div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {!allIngredients?.length ? (
                        <div className="text-center py-16 text-sm text-slate-400">Cargando catálogo…</div>
                    ) : grupos.length === 0 ? (
                        <div className="text-center py-16">
                            <Icon svg={ICONS.check} className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">No se han encontrado candidatos a duplicado.</p>
                        </div>
                    ) : (
                        <>
                            <div className="sticky top-0 z-10 -mx-4 -mt-4 px-4 pt-4 pb-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <Icon svg={ICONS.search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    <input
                                        type="search"
                                        value={busqueda}
                                        onChange={e => setBusqueda(e.target.value)}
                                        placeholder="Buscar por producto, categoría, proveedor o ID…"
                                        className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500"
                                    />
                                </div>
                                {busqueda.trim() && (
                                    <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                                        {gruposVisibles.length} de {grupos.length} grupos coinciden. La búsqueda no cambia la evaluación de riesgo.
                                    </p>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pb-1">
                                El parecido de nombre solo sirve para <strong>proponer</strong> candidatos. Los grupos
                                marcados <strong>bloqueados</strong> tienen alguna palabra que los distingue y podrían
                                ser productos diferentes: no se fusionan por parecido.
                            </p>
                            {gruposVisibles.length > 0 ? (
                                gruposVisibles.map(g => <Grupo key={g.clave + g.fichas[0].id} g={g} />)
                            ) : (
                                <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                    No hay grupos que coincidan con esa búsqueda.
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
