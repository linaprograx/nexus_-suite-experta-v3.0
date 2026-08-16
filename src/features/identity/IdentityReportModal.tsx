import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { useApp } from '../../context/AppContext';
import { useQueryClient } from '@tanstack/react-query';
import { Ingredient } from '../../types';
import { planificarFusion, ejecutarFusion, deshacerFusion } from './mergeMaster';
import { useRecipes } from '../../hooks/useRecipes';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useStockRules } from '../../hooks/useStockRules';
import { buildCurrentStock } from '../../utils/stockUtils';
import { detectarCandidatos, GrupoCandidato, RiesgoFusion, FichaCandidata } from './duplicateCandidates';
import { indicesDeImpacto, impactoDeFusion, IndicesImpacto } from '../../core/identity/impactoDeFusion';

/**
 * Informe de productos duplicados, y punto de entrada de la fusión.
 *
 * Nació como informe en seco (Fase A) y sigue siéndolo mientras no toques
 * nada: abrirlo no escribe. La fusión (Fase D) es una acción explícita **por
 * grupo**, nunca en lote, y siempre detrás de una confirmación que enumera lo
 * que se va a escribir: qué maestro, qué alias y qué ofertas se trasladan.
 *
 * Lo que la fusión hace y lo que NO hace:
 *   - traslada la oferta del alias a `supplierData` del maestro;
 *   - marca el alias con `masterProductId`;
 *   - **no borra nada**, y se deshace con el botón de al lado.
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

const Grupo: React.FC<{
    g: GrupoCandidato;
    porId: Map<string, Ingredient>;
    indices: IndicesImpacto;
    onFusionado: () => void;
}> = ({ g, porId, indices, onFusionado }) => {
    const [abierto, setAbierto] = React.useState(false);
    const [trabajando, setTrabajando] = React.useState(false);
    const [resultado, setResultado] = React.useState<string | null>(null);
    const { db, appId, userId } = useApp();
    const estilo = ESTILO_RIESGO[g.riesgo];

    const maestro = g.maestroPropuesto ? porId.get(g.maestroPropuesto) : undefined;
    const alias = g.fichas.filter(f => f.id !== g.maestroPropuesto)
        .map(f => porId.get(f.id)).filter(Boolean) as Ingredient[];
    // Si los alias ya apuntan al maestro, el grupo está fusionado: se ofrece
    // deshacer en vez de volver a fusionar.
    const yaFusionado = alias.length > 0 && alias.every(a => a.masterProductId === g.maestroPropuesto);

    const impacto = React.useMemo(
        () => impactoDeFusion(g.fichas, g.maestroPropuesto || g.fichas[0]?.id, indices),
        [g.fichas, g.maestroPropuesto, indices],
    );

    const plan = React.useMemo(
        () => (maestro && alias.length > 0 && !yaFusionado ? planificarFusion(maestro, alias) : null),
        [maestro, alias, yaFusionado],
    );

    const fusionar = async () => {
        if (!plan || !db || !appId || !userId || trabajando) return;
        const detalle = [
            `MAESTRO:  ${plan.maestroNombre}`,
            `ALIAS:    ${plan.alias.map(a => a.nombre).join(', ')}`,
            '',
            plan.ofertas.length
                ? `Se trasladan ${plan.ofertas.length} oferta(s) al maestro:\n`
                  + plan.ofertas.map(o => `  · ${o.claveProveedor} → ${o.precio.toFixed(2)} € / ${o.unidad}`).join('\n')
                : 'No hay ofertas que trasladar.',
            '',
            ...plan.advertencias.map(a => `AVISO: ${a}`),
            '',
            'El alias NO se borra: solo se marca. Se puede deshacer.',
            '¿Fusionar?',
        ].filter(Boolean).join('\n');
        if (!window.confirm(detalle)) return;

        setTrabajando(true);
        setResultado(null);
        try {
            const r = await ejecutarFusion(db, appId, userId, plan);
            setResultado(`✓ ${r.aliasMarcados} ficha(s) fusionada(s) · ${r.ofertasTrasladadas} oferta(s) trasladada(s)`);
            onFusionado();
        } catch (e) {
            console.error('[FUSION] fallo', e);
            setResultado('✗ Error al fusionar (ver consola)');
        } finally {
            setTrabajando(false);
        }
    };

    const deshacer = async () => {
        if (!db || !appId || !userId || trabajando) return;
        if (!window.confirm(`Deshacer la fusión de ${alias.length} ficha(s). Volverán a aparecer por separado en Inventario. ¿Continuar?`)) return;
        setTrabajando(true);
        try {
            const n = await deshacerFusion(db, appId, userId, alias.map(a => a.id));
            setResultado(`✓ ${n} ficha(s) devuelta(s) a su identidad anterior`);
            onFusionado();
        } catch (e) {
            console.error('[FUSION] fallo al deshacer', e);
            setResultado('✗ Error al deshacer (ver consola)');
        } finally {
            setTrabajando(false);
        }
    };

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

                    {/* Lo que cuelga de cada ficha. La condición 2 de las cinco
                        del punto 17: informe en seco ANTES de escribir. */}
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">
                            Qué arrastra cada ficha
                        </span>
                        <div className="space-y-1.5">
                            {impacto.fichas.map(f => (
                                <div key={f.id} className="text-[11px]">
                                    <div className="flex items-baseline gap-2">
                                        <span className={`font-bold truncate ${f.id === g.maestroPropuesto ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                            {f.id === g.maestroPropuesto ? '★ ' : ''}{f.nombre}
                                        </span>
                                        <span className="text-slate-400 tabular-nums shrink-0">
                                            {f.limpia
                                                ? 'nada colgando'
                                                : [f.recetas.length && `${f.recetas.length} receta(s)`,
                                                   f.reglas && `${f.reglas} regla(s)`,
                                                   f.compras && `${f.compras} compra(s)`,
                                                   f.movimientos && `${f.movimientos} movimiento(s)`]
                                                  .filter(Boolean).join(' · ')}
                                        </span>
                                    </div>
                                    {f.recetas.length > 0 && (
                                        <p className="text-[10px] text-slate-500 truncate" title={f.recetas.join(' · ')}>
                                            {f.recetas.join(' · ')}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Los dos avisos que este informe existe para dar. Ver el
                            porqué medido en `core/identity/impactoDeFusion.ts`. */}
                        {impacto.recetasEnAlias > 0 && (
                            <p className="mt-2 text-[10px] leading-relaxed text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-lg px-2 py-1.5">
                                <strong>{impacto.recetasEnAlias} receta(s)</strong> quedarían costeando desde una ficha
                                absorbida. No se rompen —el documento no se borra— pero dejarían de seguir al maestro:
                                si actualizas el precio en el maestro, esas recetas se quedan con el viejo.
                            </p>
                        )}
                        {impacto.reglasEnAlias > 0 && (
                            <p className="mt-1.5 text-[10px] leading-relaxed text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-lg px-2 py-1.5">
                                <strong>{impacto.reglasEnAlias} regla(s) de stock</strong> se quedarían vigilando una ficha
                                sin existencias: el stock se consolida en el maestro y la regla no lo sigue, así que
                                daría stock crítico permanente sobre un producto lleno. Muévelas al maestro antes.
                            </p>
                        )}
                    </div>

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

                    {/* Acción. Un grupo por operación, y siempre con confirmación
                        que enumera lo que se va a escribir. */}
                    <div className="flex items-center gap-2">
                        {yaFusionado ? (
                            <button
                                onClick={deshacer}
                                disabled={trabajando}
                                className="flex-1 h-9 rounded-xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[11px] font-bold disabled:opacity-60"
                            >
                                {trabajando ? 'Deshaciendo…' : 'Deshacer fusión'}
                            </button>
                        ) : (
                            <button
                                onClick={fusionar}
                                disabled={trabajando || !plan}
                                title={plan ? 'Traslada las ofertas al maestro y marca los alias' : 'No hay maestro o alias resolubles'}
                                className="flex-1 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {trabajando ? 'Fusionando…' : `Fusionar en «${g.fichas.find(f => f.id === g.maestroPropuesto)?.nombre ?? 'maestro'}»`}
                            </button>
                        )}
                    </div>
                    {resultado && (
                        <p className="text-[11px] text-center text-slate-600 dark:text-slate-300">{resultado}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export const IdentityReportModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients: allIngredients } = useIngredients();
    const queryClient = useQueryClient();
    // Índice por id para que cada grupo pueda construir su plan de fusión con
    // los documentos reales, no con la ficha resumida del informe.
    const porId = React.useMemo(
        () => new Map((allIngredients || []).filter(i => i?.id).map(i => [i.id, i])),
        [allIngredients],
    );
    const refrescar = React.useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    }, [queryClient]);
    const { recipes: allRecipes } = useRecipes();
    const { purchaseHistory } = usePurchaseIngredient();
    const { movements } = useStockMovements();
    const { rules } = useStockRules();
    const [busqueda, setBusqueda] = React.useState('');

    const stockItems = React.useMemo(
        () => buildCurrentStock(purchaseHistory || [], movements || []),
        [purchaseHistory, movements],
    );

    /**
     * Los índices de impacto, calculados una vez. Recorrer las recetas por cada
     * ficha de cada grupo sería el mismo trabajo repetido cientos de veces.
     */
    const indices = React.useMemo(
        () => indicesDeImpacto({
            recetas: allRecipes || [],
            reglas: rules || [],
            compras: purchaseHistory || [],
            movimientos: movements || [],
        }),
        [allRecipes, rules, purchaseHistory, movements],
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
                                gruposVisibles.map(g => <Grupo key={g.clave + g.fichas[0].id} g={g} porId={porId} indices={indices} onFusionado={refrescar} />)
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
