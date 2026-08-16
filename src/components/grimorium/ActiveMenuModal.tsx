import React from 'react';
import { Recipe } from '../../types';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';
import { useActiveMenu } from '../../hooks/useActiveMenu';
import { useCartas } from '../../hooks/useCartas';
import { useRecipes } from '../../hooks/useRecipes';
import { useIngredients } from '../../hooks/useIngredients';
import { computeMenuDrift, summarizeDrift, MenuDrift } from '../../utils/menuDrift';
import { printRecipeCards } from './printRecipeCard';
import { PLANTILLAS_PORTADA, PLANTILLA_POR_DEFECTO } from './portadas/plantillasPortada';
import { calculateRecipeCost } from '../../core/costing/costCalculator';
import { cartaASheet } from '../../core/export/cartaASheet';
import { exportarCartaASheets, esAppInstalada } from '../../services/google/sheetsCliente';
import { useApp } from '../../context/AppContext';

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
    const { cartas, cartaActiva, actualizarCarta, crearCarta } = useCartas();

    // Identidad de la carta. Hasta ahora no había dónde guardar esto, y el
    // usuario acabó escribiendo el nombre del menú en el campo PREPARACIÓN de una
    // receta. Se edita en local y se guarda al salir del campo, para no escribir
    // en Firestore en cada tecla.
    const [nombre, setNombre] = React.useState('');
    // Plantilla de portada. Vive en el estado y no en la carta: elegirla no debe
    // escribir en Firestore hasta que se sepa que gusta.
    const [plantilla, setPlantilla] = React.useState(PLANTILLA_POR_DEFECTO);
    const [concepto, setConcepto] = React.useState('');
    React.useEffect(() => {
        setNombre(cartaActiva?.nombre || '');
        setConcepto(cartaActiva?.concepto || '');
    }, [cartaActiva?.id, cartaActiva?.nombre, cartaActiva?.concepto]);

    const guardar = (cambios: Partial<{ nombre: string; concepto: string; fecha: string }>) => {
        if (cartaActiva) actualizarCarta(cartaActiva.id, cambios);
    };

    /**
     * Exporta la carta entera: portada + una ficha por cóctel, con el mismo
     * diseño que la ficha suelta. Usa el mismo motor, que ahora recibe una lista.
     */
    /**
     * Las recetas de la carta, ordenadas como toca. **Compartida por las dos
     * exportaciones**: si cada una montara su lista, acabarían diciendo cosas
     * distintas sobre la misma carta.
     *
     * Devuelve `null` cuando no hay nada que exportar, ya avisado.
     */
    const prepararRecetas = (): Recipe[] | null => {
        // El orden de la carta manda sobre el del catálogo.
        // Lo que el usuario ve como secuencia de su carta es lo que recibe
        // impreso; si no ha ordenado nada, se respeta el orden de las entradas.
        const secuencia = cartaActiva?.orden;
        const entradas = secuencia?.length
            ? [...menu].sort((a, b) => {
                const ia = secuencia.indexOf(a.recipeId);
                const ib = secuencia.indexOf(b.recipeId);
                // Las que no estén en la secuencia van al final, sin barajarse.
                return (ia === -1 ? Number.MAX_SAFE_INTEGER : ia) - (ib === -1 ? Number.MAX_SAFE_INTEGER : ib);
            })
            : menu;

        const recetas = entradas
            .map(m => allRecipes.find(r => r.id === m.recipeId))
            .filter((r): r is Recipe => !!r);

        // Con alcohol primero, sin alcohol después: es el orden en que se lee una
        // carta y el que ya se ve en pantalla. Se ordena de forma ESTABLE, así
        // que dentro de cada bloque se respeta la secuencia que haya fijado el
        // usuario en su carta.
        const pesoTipo = (r: Recipe) => {
            const c = r.categorias || [];
            if (c.includes('Coctel') || c.includes('Cóctel')) return 0;
            if (c.includes('Mocktail') || c.includes('Moctel')) return 1;
            return 2;
        };
        recetas.sort((a, b) => pesoTipo(a) - pesoTipo(b));

        if (!recetas.length) { alert('La carta no tiene recetas que exportar.'); return null; }
        return recetas;
    };

    const exportarCarta = () => {
        const recetas = prepararRecetas();
        if (!recetas) return;

        // Si falta el nombre o el concepto se piden ahora, en vez de generar un
        // recetario sin portada. Se guardan, para no volver a preguntar.
        let n = nombre.trim();
        if (!n) {
            n = (window.prompt('¿Cómo se llama esta carta?') || '').trim();
            if (!n) return;
            setNombre(n); guardar({ nombre: n });
        }
        let c = concepto.trim();
        if (!c) {
            c = (window.prompt('Concepto del menú (opcional): de qué va, frases gancho…') || '').trim();
            if (c) { setConcepto(c); guardar({ concepto: c }); }
        }

        printRecipeCards(
            recetas.map(r => ({ recipe: r, cost: calculateRecipeCost(r, allIngredients, undefined, allRecipes) })),
            allRecipes,
            { nombre: n, concepto: c, fecha: cartaActiva?.fecha, plantilla },
        );
    };

    /**
     * La misma carta, a una hoja de cálculo.
     *
     * No sustituye a la impresa: la impresa es para verla, la hoja para
     * trabajarla —cambiar un precio, reordenar, compartirla con quien no tiene
     * la app—. Reutiliza `prepararRecetas`, porque duplicar el orden y el
     * coste haría que las dos exportaciones dijeran cosas distintas.
     */
    const exportarASheets = async () => {
        if (!auth) { setAvisoSheets('Sesión no inicializada.'); return; }
        setAvisoSheets(null);
        const recetas = prepararRecetas();
        if (!recetas) return;

        const n = nombre.trim() || 'Carta';
        setExportando(true);
        try {
            const hoja = cartaASheet(
                recetas.map(r => ({ recipe: r, coste: calculateRecipeCost(r, allIngredients, undefined, allRecipes).costoTotal })),
                { nombre: n, concepto: concepto.trim(), fecha: cartaActiva?.fecha, acento: '#0d9488' },
            );
            const url = await exportarCartaASheets(auth, hoja);
            // Se abre en otra pestaña en vez de navegar: quien exporta suele
            // querer seguir en la carta.
            window.open(url, '_blank', 'noopener');
        } catch (e: any) {
            console.error('[Sheets]', e);
            // En pantalla y no en un `alert`: el aviso de la app instalada hay
            // que poder leerlo con calma, y lleva una acción detrás.
            setAvisoSheets(e?.message || 'No se pudo exportar a Sheets.');
        } finally {
            setExportando(false);
        }
    };
    const { auth } = useApp();
    const [exportando, setExportando] = React.useState(false);
    const [avisoSheets, setAvisoSheets] = React.useState<string | null>(null);
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

    /**
     * La carta se lee por bloques: primero lo que lleva alcohol y después lo que
     * no. Es como se sirve y como se imprime, así que es como debe verse aquí.
     *
     * El tipo ya se elige al crear la receta («Cóctel», «Mocktail»,
     * «Preparacion», «Garnish»), así que no hay que clasificar nada a mano ni
     * inventar un campo nuevo: se agrupa por lo que ya está guardado.
     */
    const BLOQUES: Array<{ clave: string; titulo: string; tipos: string[] }> = [
        { clave: 'alcohol', titulo: 'Con alcohol', tipos: ['Coctel', 'Cóctel'] },
        { clave: 'sin', titulo: 'Sin alcohol', tipos: ['Mocktail', 'Moctel'] },
        { clave: 'otros', titulo: 'Otros', tipos: [] },
    ];

    const grupos = React.useMemo(() => {
        const tipoDe = (d: MenuDrift) => {
            const cats = d.recipe?.categorias || [];
            for (const b of BLOQUES) if (b.tipos.some(t => cats.includes(t))) return b.clave;
            return 'otros';
        };
        return BLOQUES
            .map(b => ({ ...b, items: sorted.filter(d => tipoDe(d) === b.clave) }))
            .filter(b => b.items.length > 0);
    }, [sorted]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                {/* Header */}
                <div className="relative px-5 py-4 shrink-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 overflow-hidden flex items-center justify-between">
                    <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    {/* La cabecera ES el conmutador de carta.
                        Antes el nombre salía tres veces —cabecera, selector y campo de
                        título—, tres cajas iguales sin decir cuál hacía qué. Ahora cada
                        una tiene un papel visual distinto: aquí la IDENTIDAD (grande, y
                        clicable si hay varias cartas), y abajo el nombre como CAMPO
                        editable con su etiqueta. Un dato, dos papeles, cero repetición. */}
                    <div className="relative z-10 flex items-center gap-3 min-w-0">
                        <span className="p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white shrink-0"><Icon svg={ICONS.book} className="w-5 h-5" /></span>
                        <div className="min-w-0">
                            {cartas.length > 1 && cartaActiva ? (
                                <div className="relative inline-flex items-center gap-1 group/sw">
                                    <h2 className="text-base font-bold text-white truncate max-w-[15rem]">{nombre || 'Carta activa'}</h2>
                                    <Icon svg={ICONS.chevronDown} className="w-4 h-4 text-white/70 shrink-0" />
                                    {/* El <select> nativo, transparente y encima del título:
                                        conserva el desplegable del sistema —imprescindible en
                                        móvil— sin pintar una segunda caja con el mismo texto. */}
                                    <select
                                        value={cartaActiva.id}
                                        aria-label="Cambiar de carta"
                                        onChange={async e => {
                                            const destino = e.target.value;
                                            if (destino === cartaActiva.id) return;
                                            await actualizarCarta(cartaActiva.id, { estado: 'archivada' });
                                            await actualizarCarta(destino, { estado: 'activa' });
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    >
                                        {cartas.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.nombre}{c.estado === 'archivada' ? ' · archivada' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <h2 className="text-base font-bold text-white truncate">{nombre || 'Carta activa'}</h2>
                            )}
                            <p className="text-xs text-white/80">
                                {sum.total} receta(s){sum.needsAttention > 0 ? ` · ${sum.needsAttention} requieren atención` : ' · todo al día'}
                                {cartas.length > 1 && <span className="text-white/60"> · toca el título para cambiar</span>}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="relative z-10 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors">
                        <Icon svg={ICONS.x} className="w-5 h-5" />
                    </button>
                </div>

                {/* Identidad de la carta — nombre, concepto y fecha */}
                {cartaActiva && (
                    <div className="px-5 pt-4 shrink-0 space-y-2">
                        {/* Varias cartas: la de ahora, la de hace seis meses, la de
                            hace un año. Cambiar de activa es archivar la actual y
                            activar otra: solo hay una activa a la vez, que es lo que
                            hace que «la carta» signifique algo sin ambigüedad. */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Nombre de la carta
                            </label>
                            <input
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                onBlur={() => guardar({ nombre: nombre.trim() || 'Carta sin título' })}
                                placeholder="Ej. Drink Your Game"
                                className="w-full h-10 px-3 rounded-xl text-sm font-semibold bg-transparent border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors"
                            />
                        </div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 pt-1">
                            Concepto
                        </label>
                        <textarea
                            value={concepto}
                            onChange={e => setConcepto(e.target.value)}
                            onBlur={() => guardar({ concepto })}
                            rows={2}
                            placeholder="Concepto del menú: de qué va, frases gancho, cómo se presenta…"
                            className="w-full px-3 py-2 rounded-xl text-sm resize-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        />
                        {/* Dos filas, no una que desborda.
                            En el móvil los cinco controles no caben en línea, y
                            envolviendo dejaban «A Sheets» solo abajo, como si
                            fuera otra cosa. Arriba lo que la carta ES —fecha,
                            nueva, plantilla—; abajo lo que se HACE con ella, los
                            dos exportar a mitad y mitad para que los dos caigan
                            bajo el pulgar. En escritorio vuelven a la derecha. */}
                        <div className="flex flex-wrap gap-2">
                            <input
                                type="date"
                                value={cartaActiva.fecha || ''}
                                onChange={e => guardar({ fecha: e.target.value })}
                                className="w-[7.5rem] shrink-0 h-10 px-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                            />
                            <button
                                onClick={async () => {
                                    const n = (window.prompt('Nombre de la carta nueva') || '').trim();
                                    if (!n) return;
                                    // La nueva nace activa, así que la anterior se archiva.
                                    if (cartaActiva) await actualizarCarta(cartaActiva.id, { estado: 'archivada' });
                                    await crearCarta(n);
                                }}
                                title="Crear una carta nueva"
                                className="shrink-0 h-10 px-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider"
                            >
                                + Nueva
                            </button>
                            <select
                                value={plantilla}
                                onChange={e => setPlantilla(e.target.value)}
                                aria-label="Plantilla de portada"
                                className="flex-1 min-w-0 h-10 px-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                            >
                                {PLANTILLAS_PORTADA.map(p => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                            <button
                                onClick={exportarCarta}
                                className="w-full sm:w-auto h-10 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                            >
                                <Icon svg={ICONS.book} className="w-4 h-4" /> Exportar
                            </button>
                            {/* La hoja de cálculo va aparte del exportar de siempre, no
                                en su lugar: la impresa es para verla, la hoja para
                                trabajarla. Sustituir una por otra sería quitarle algo. */}
                            <button
                                onClick={exportarASheets}
                                disabled={exportando}
                                title="Crea la carta como hoja de cálculo en tu Drive, editable"
                                className="w-full sm:w-auto h-10 px-3 rounded-xl bg-white dark:bg-slate-800 border border-teal-600/40 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-slate-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                            >
                                <Icon svg={ICONS.grid} className="w-4 h-4" />
                                {exportando ? 'Creando…' : 'A Sheets'}
                            </button>
                        </div>

                        {avisoSheets && (
                            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/15 p-3">
                                <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">{avisoSheets}</p>
                                {esAppInstalada() && (
                                    <button
                                        onClick={() => window.open(window.location.origin, '_blank', 'noopener')}
                                        className="mt-2 h-9 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold uppercase tracking-wider"
                                    >
                                        Abrir Nexus en el navegador
                                    </button>
                                )}
                                <button
                                    onClick={() => setAvisoSheets(null)}
                                    className="mt-2 ml-2 h-9 px-3 rounded-lg text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400"
                                >
                                    Entendido
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                        <div className="space-y-4">
                          {grupos.map(bloque => (
                            <div key={bloque.clave}>
                              {/* La cabecera solo aparece si hay más de un bloque:
                                  con una sola familia, titularla es ruido. */}
                              {grupos.length > 1 && (
                                <div className="flex items-center gap-2 mb-2 px-1">
                                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bloque.titulo}</h4>
                                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">{bloque.items.length}</span>
                                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700/60" />
                                </div>
                              )}
                        <ul className="space-y-2">
                            {bloque.items.map((d: MenuDrift) => {
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
                            </div>
                          ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
