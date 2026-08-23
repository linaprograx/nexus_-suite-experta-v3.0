import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useIngredients } from '../../hooks/useIngredients';
import { leerCatalogo, LecturaCatalogo, LineaCatalogo, EstadoLinea } from '../../core/importacion/leerCatalogo';
import { planificarImportacion, resumirPlan } from '../../core/importacion/planDeImportacion';
import { escribirImportacion } from './escribirCatalogo';
import { useSuppliers } from '../suppliers/hooks/useSuppliers';
import { useApp } from '../../context/AppContext';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Previsualización de un catálogo de proveedor. **No importa nada todavía.**
 *
 * Es a propósito: importar un catálogo sobre 1.326 fichas reales es la
 * operación más peligrosa que queda en el proyecto, y el botón de escribir no
 * se pone hasta que el fundador haya visto esta pantalla con un fichero suyo y
 * dicho que lo que propone es correcto.
 *
 * Lo que hay aquí es lo que hace falta para poder decidir eso.
 */

const ESTILO: Record<EstadoLinea, { cls: string; texto: string }> = {
    nuevo: { cls: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30', texto: 'Nuevo' },
    coincide: { cls: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30', texto: 'Coincide' },
    sube: { cls: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30', texto: 'Sube' },
    baja: { cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', texto: 'Baja' },
    igual: { cls: 'bg-slate-500/10 text-slate-500 border-slate-500/20', texto: 'Igual' },
    invalida: { cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30', texto: 'No válida' },
};

const Cifra: React.FC<{ n: React.ReactNode; etiqueta: string; color?: string }> = ({ n, etiqueta, color }) => (
    <div className="flex-1 min-w-0 text-center px-2">
        <div className={`text-xl font-black tabular-nums ${color || 'text-slate-800 dark:text-slate-100'}`}>{n}</div>
        <div className="text-[9px] uppercase tracking-wider text-slate-400 truncate">{etiqueta}</div>
    </div>
);

const Fila: React.FC<{ l: LineaCatalogo; marcada: boolean; onMarcar: () => void }> = ({ l, marcada, onMarcar }) => {
    const e = ESTILO[l.estado];
    return (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
            <div className="flex items-start gap-2">
                {l.estado !== 'invalida' && (
                    <input
                        type="checkbox"
                        checked={marcada}
                        onChange={onMarcar}
                        aria-label={`Importar ${l.nombre}`}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0"
                    />
                )}
                <span className={`shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${e.cls}`}>{e.texto}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                            {l.nombre || <span className="text-slate-400 italic">sin nombre</span>}
                        </span>
                        {l.precio !== undefined && (
                            <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200 shrink-0">
                                €{l.precio.toFixed(2)}
                                {l.variacionPct !== undefined && l.variacionPct !== 0 && (
                                    <span className={l.variacionPct > 0 ? ' text-rose-600' : ' text-emerald-600'}>
                                        {' '}({l.variacionPct > 0 ? '+' : ''}{l.variacionPct.toFixed(1)} %)
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                        <span className="text-slate-400">fila {l.fila} · </span>{l.motivo}
                    </p>
                    {/* El precio por unidad es el que decide: 3 L a 25 € es más
                        barato que 750 ml a 10 €, y la etiqueta dice lo contrario. */}
                    {l.precioPorBase !== undefined && (
                        <p className="text-[10px] text-slate-400">
                            {l.formatoLegible && <>Formato <strong>{l.formatoLegible}</strong> · </>}
                            <strong className="text-slate-500 dark:text-slate-300">
                                {(l.precioPorBase * 1000).toFixed(2)} € por {l.unidadBase === 'und' ? 'unidad' : l.unidadBase === 'g' ? 'kg' : 'litro'}
                            </strong>
                            {l.precioPorBaseActual !== undefined && (
                                <> · hoy {(l.precioPorBaseActual * 1000).toFixed(2)} €</>
                            )}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export const ImportarCatalogoModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { ingredients: allIngredients } = useIngredients();
    const [texto, setTexto] = React.useState('');
    const [nombreFichero, setNombreFichero] = React.useState('');
    const [filtro, setFiltro] = React.useState<EstadoLinea | 'todas'>('todas');

    const { db, appId, userId } = useApp();
    const { suppliers } = useSuppliers({ db, userId });
    const queryClient = useQueryClient();
    const [proveedorId, setProveedorId] = React.useState('');
    const [marcadas, setMarcadas] = React.useState<Set<number>>(new Set());
    const [escribiendo, setEscribiendo] = React.useState(false);
    const [resultado, setResultado] = React.useState<string | null>(null);

    const lectura: LecturaCatalogo | null = React.useMemo(
        () => (texto.trim() ? leerCatalogo(texto, allIngredients || []) : null),
        [texto, allIngredients],
    );

    const cargarFichero = async (file?: File) => {
        if (!file) return;
        setNombreFichero(file.name);
        setTexto(await file.text());
        // Un fichero nuevo empieza sin nada marcado. Heredar la selección del
        // anterior importaría filas que nadie ha mirado en ESTE fichero.
        setMarcadas(new Set());
        setResultado(null);
    };

    const alternar = (fila: number) => setMarcadas(prev => {
        const s = new Set(prev);
        if (s.has(fila)) s.delete(fila); else s.add(fila);
        return s;
    });

    /** Marca todo lo que se está viendo, no todo el fichero. */
    const marcarVisibles = (marcar: boolean) => setMarcadas(prev => {
        const s = new Set(prev);
        for (const l of visibles) {
            if (l.estado === 'invalida') continue;   // no se marcan las que no valen
            if (marcar) s.add(l.fila); else s.delete(l.fila);
        }
        return s;
    });

    const plan = React.useMemo(
        () => (lectura ? planificarImportacion(lectura.lineas, proveedorId, marcadas) : null),
        [lectura, proveedorId, marcadas],
    );

    const importar = async () => {
        if (!plan || !db || !appId || !userId || !proveedorId || escribiendo) return;
        const nombreProv = suppliers.find(s => s.id === proveedorId)?.name || proveedorId;
        const detalle = [
            `Proveedor: ${nombreProv}`,
            '',
            resumirPlan(plan),
            '',
            'Las fichas que ya tienes reciben una OFERTA de este proveedor.',
            'Su precio de compra NO se toca: el coste de tus recetas no cambia.',
            'Los productos nuevos nacen marcados «por revisar».',
            '',
            'No se borra ni se fusiona nada. ¿Importar?',
        ].join('\n');
        if (!window.confirm(detalle)) return;

        setEscribiendo(true);
        setResultado(null);
        try {
            const r = await escribirImportacion(db, appId, userId, plan);
            queryClient.invalidateQueries({ queryKey: ['ingredients'] });
            setResultado(`✓ ${r.ofertas} oferta(s) guardada(s) · ${r.nuevas} producto(s) creado(s)`);
            setMarcadas(new Set());
        } catch (e: any) {
            console.error('[importacion]', e);
            setResultado(`✗ ${e?.message || 'No se pudo importar.'}`);
        } finally {
            setEscribiendo(false);
        }
    };

    const visibles = React.useMemo(
        () => (lectura ? (filtro === 'todas' ? lectura.lineas : lectura.lineas.filter(l => l.estado === filtro)) : []),
        [lectura, filtro],
    );

    const Boton: React.FC<{ v: EstadoLinea | 'todas'; children: React.ReactNode }> = ({ v, children }) => (
        <button
            onClick={() => setFiltro(v)}
            className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${filtro === v
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-emerald-400'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shrink-0">
                    <span className="p-2 rounded-xl bg-white/15"><Icon svg={ICONS.upload || ICONS.fileText} className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-base">Catálogo de proveedor — lectura en seco</h2>
                        <p className="text-[11px] text-white/80">No importa nada. Enseña qué pasaría.</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                    <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 text-center">
                        <input
                            type="file"
                            accept=".csv,.txt,.tsv,text/csv,text/plain"
                            id="fichero-catalogo"
                            className="hidden"
                            onChange={e => cargarFichero(e.target.files?.[0])}
                        />
                        <label htmlFor="fichero-catalogo" className="cursor-pointer inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider">
                            <Icon svg={ICONS.fileText} className="w-4 h-4" />
                            Elegir fichero
                        </label>
                        <p className="mt-2 text-[10px] text-slate-500">
                            CSV o texto separado por «;», «,» o tabulador. {nombreFichero && <strong>{nombreFichero}</strong>}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400 leading-relaxed max-w-md mx-auto">
                            El emparejado usa el mismo criterio de identidad que el resto de la app: <strong>las mismas
                            palabras exactas</strong>. Lo que no case entra como nuevo — un parecido del 90 % no es un
                            producto, y «ABSOLUT VODKA» y «ABSOLUT MANDARINA» comparten casi todo.
                            {' '}Y los precios se comparan <strong>por unidad base</strong>, no por la etiqueta: un
                            formato de 3 L a 25 € es más barato que uno de 750 ml a 10 €.
                        </p>
                    </div>

                    {lectura && (
                        <>
                            {lectura.avisos.length > 0 && (
                                <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 p-2.5 space-y-1">
                                    {lectura.avisos.map(a => (
                                        <p key={a} className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">{a}</p>
                                    ))}
                                </div>
                            )}

                            <div className="flex divide-x divide-slate-200 dark:divide-slate-700 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                                <Cifra n={lectura.resumen.total} etiqueta="líneas" />
                                <Cifra n={lectura.resumen.nuevas} etiqueta="nuevas" color="text-sky-600" />
                                <Cifra n={lectura.resumen.suben} etiqueta="suben" color="text-rose-600" />
                                <Cifra n={lectura.resumen.bajan} etiqueta="bajan" color="text-emerald-600" />
                                <Cifra n={lectura.resumen.iguales} etiqueta="igual" />
                                <Cifra n={lectura.resumen.invalidas} etiqueta="no válidas" color="text-amber-600" />
                            </div>

                            {/* Qué columna se ha entendido como qué. Si el fichero trae
                                la columna equivocada, se ve AQUÍ y no después. */}
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5">
                                <span className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5">
                                    Columnas leídas · separador «{lectura.separador === '\t' ? 'tabulador' : lectura.separador}»
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {Object.entries(lectura.columnas).map(([col, campo]) => (
                                        <span key={col} className={`text-[10px] px-2 py-0.5 rounded-lg border ${campo === '—'
                                            ? 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                                            : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'}`}>
                                            {col} → {campo === '—' ? 'sin usar' : campo}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* El proveedor primero: sin él no hay clave de oferta,
                                y sin clave no se puede escribir nada. */}
                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={proveedorId}
                                    onChange={e => setProveedorId(e.target.value)}
                                    aria-label="Proveedor de esta tarifa"
                                    className="flex-1 min-w-0 h-10 px-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                                >
                                    <option value="">¿De qué proveedor es esta tarifa?</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button
                                    onClick={() => marcarVisibles(true)}
                                    className="h-10 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                    Marcar visibles
                                </button>
                                <button
                                    onClick={() => marcarVisibles(false)}
                                    className="h-10 px-3 rounded-xl text-[11px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 text-slate-500"
                                >
                                    Ninguna
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                <Boton v="todas">Todas ({lectura.resumen.total})</Boton>
                                <Boton v="nuevo">Nuevas ({lectura.resumen.nuevas})</Boton>
                                <Boton v="sube">Suben ({lectura.resumen.suben})</Boton>
                                <Boton v="baja">Bajan ({lectura.resumen.bajan})</Boton>
                                <Boton v="igual">Igual ({lectura.resumen.iguales})</Boton>
                                <Boton v="invalida">No válidas ({lectura.resumen.invalidas})</Boton>
                            </div>

                            <div className="space-y-2">
                                {visibles.slice(0, 200).map(l => (
                                    <Fila key={l.fila} l={l} marcada={marcadas.has(l.fila)} onMarcar={() => alternar(l.fila)} />
                                ))}
                                {visibles.length > 200 && (
                                    <p className="text-[10px] text-slate-400 text-center py-2">
                                        …y {visibles.length - 200} líneas más. Filtra para verlas.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-700 shrink-0 space-y-2">
                    {resultado && (
                        <p className={`text-[11px] font-bold text-center ${resultado.startsWith('✓') ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {resultado}
                        </p>
                    )}
                    <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                        Las fichas que ya tienes reciben <strong>una oferta de este proveedor</strong>. Su precio de
                        compra no se toca, así que el coste de tus recetas no cambia. Los productos nuevos nacen
                        marcados «por revisar». No se borra ni se fusiona nada.
                    </p>
                    <button
                        onClick={importar}
                        disabled={!plan || !proveedorId || marcadas.size === 0 || escribiendo}
                        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {escribiendo ? 'Importando…'
                            : !proveedorId ? 'Elige el proveedor de esta tarifa'
                            : marcadas.size === 0 ? 'Marca las líneas que quieras importar'
                            : `Importar ${marcadas.size} línea(s) — ${plan ? resumirPlan(plan) : ''}`}
                    </button>
                </div>
            </div>
        </div>
    );
};
