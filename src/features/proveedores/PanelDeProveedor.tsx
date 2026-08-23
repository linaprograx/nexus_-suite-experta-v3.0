import React from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { useApp } from '../../context/AppContext';
import { useIncidencias } from '../suppliers/hooks/useIncidencias';
import {
    TIPOS_INCIDENCIA, TipoIncidencia, Gravedad, Incidencia,
    resumenDeIncidencias, notasDe, VENTANA_DIAS,
} from '../../core/proveedores/incidencias';
import { perfilDeProveedor, avisosDelPerfil, VENTANA_COMPRAS_DIAS } from '../../core/proveedores/perfilProveedor';
import { useIngredients } from '../../hooks/useIngredients';
import { usePurchaseIngredient } from '../../hooks/usePurchaseIngredient';
import { useSuppliers } from '../suppliers/hooks/useSuppliers';

/**
 * **Lo que pasa con un proveedor.** Puntos 27 y 28.
 *
 * ## Por qué no es un icono más de la barra
 *
 * Esto se abre desde la cabecera del proveedor en Mercado, que es donde estás
 * cuando decides pedirle. Es la misma regla que cerró el punto 16: el plazo y
 * las condiciones de pago se enseñan en el desplegable donde se decide, no en
 * una pantalla de ajustes a la que nadie va antes de comprar.
 *
 * Y la barra ya tiene sus cinco herramientas por pestaña; una prueba lo fija.
 * Que el sitio obvio esté cerrado es lo que obliga a buscar el sitio correcto.
 *
 * ## Registrar es la mitad del punto, y la que importa hoy
 *
 * Los puntos 4, 10 y 12 están bloqueados por no haber consumo real. Este no:
 * el dato no existe porque no hay dónde meterlo. En cuanto lo hay, empieza a
 * acumularse el histórico del que vivirá el punto 26.
 */

const fechaCorta = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });

const hoyISO = () => new Date().toISOString().slice(0, 10);

export const PanelDeProveedor: React.FC<{
    proveedorId: string;
    proveedorNombre: string;
    onClose: () => void;
}> = ({ proveedorId, proveedorNombre, onClose }) => {
    const { db, userId } = useApp();
    const { incidencias, notas, cargando, registrar, resolver, eliminar, guardarNota, eliminarNota } =
        useIncidencias(db, userId);

    const { ingredients } = useIngredients();
    const { purchaseHistory } = usePurchaseIngredient();
    const { suppliers } = useSuppliers({ db, userId });

    /**
     * El perfil del punto 26. Se compone de piezas que ya existen —gasto,
     * ofertas, incidencias— en vez de recalcular ninguna: tres cifras del
     * mismo dato calculadas por tres vías es el defecto que este proyecto
     * lleva arreglando desde el principio.
     */
    const perfil = React.useMemo(() => perfilDeProveedor({
        proveedorId,
        proveedor: suppliers.find((x: any) => x.id === proveedorId) || null,
        ingredientes: ingredients || [],
        compras: purchaseHistory || [],
        incidencias,
    }), [proveedorId, suppliers, ingredients, purchaseHistory, incidencias]);

    const avisos = React.useMemo(() => avisosDelPerfil(perfil), [perfil]);

    const [pestana, setPestana] = React.useState<'resumen' | 'incidencias' | 'notas'>('resumen');
    const [registrando, setRegistrando] = React.useState(false);
    const [tipo, setTipo] = React.useState<TipoIncidencia>('retraso');
    const [gravedad, setGravedad] = React.useState<Gravedad>('leve');
    const [fecha, setFecha] = React.useState(hoyISO());
    const [nota, setNota] = React.useState('');
    const [textoNota, setTextoNota] = React.useState('');
    const [editandoNota, setEditandoNota] = React.useState<string | null>(null);
    const [aviso, setAviso] = React.useState<string | null>(null);

    const suyas = React.useMemo(
        () => incidencias.filter(i => i.proveedorId === proveedorId)
            .sort((a, b) => b.fecha.getTime() - a.fecha.getTime()),
        [incidencias, proveedorId],
    );
    const resumen = React.useMemo(() => resumenDeIncidencias(incidencias, proveedorId), [incidencias, proveedorId]);
    const susNotas = React.useMemo(() => notasDe(notas, { proveedorId }), [notas, proveedorId]);

    const enviar = async () => {
        setAviso(null);
        try {
            // `new Date('2026-08-23')` se interpreta en UTC y en España puede
            // caer en el día anterior. Se parte a mano para que la fecha que se
            // guarda sea la que se ve en el selector.
            const [a, m, d] = fecha.split('-').map(Number);
            await registrar.mutateAsync({
                proveedorId, tipo, gravedad,
                fecha: new Date(a, m - 1, d, 12, 0, 0),
                nota: nota.trim() || undefined,
            });
            setRegistrando(false); setNota(''); setGravedad('leve'); setFecha(hoyISO());
        } catch (e: any) {
            setAviso(e?.message || 'No se pudo guardar.');
        }
    };

    const enviarNota = async () => {
        setAviso(null);
        try {
            await guardarNota.mutateAsync({ id: editandoNota || undefined, texto: textoNota, proveedorId });
            setTextoNota(''); setEditandoNota(null);
        } catch (e: any) {
            setAviso(e?.message || 'No se pudo guardar.');
        }
    };

    const Cifra: React.FC<{ n: React.ReactNode; etiqueta: string; color?: string }> = ({ n, etiqueta, color }) => (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-2.5 text-center">
            <div className={`text-lg font-black tabular-nums ${color || 'text-slate-800 dark:text-slate-100'}`}>{n}</div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 leading-tight">{etiqueta}</div>
        </div>
    );

    const Fila: React.FC<{ i: Incidencia }> = ({ i }) => (
        <div className={`rounded-xl border p-3 ${i.resueltaEl
            ? 'border-slate-200 dark:border-slate-700 opacity-60'
            : i.gravedad === 'seria'
                ? 'border-rose-300 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-amber-200 dark:border-amber-800/40'}`}>
            <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {TIPOS_INCIDENCIA[i.tipo].rotulo}
                        {i.gravedad === 'seria' && (
                            <span className="ml-2 text-[9px] uppercase tracking-wider bg-rose-500 text-white px-1.5 py-0.5 rounded">seria</span>
                        )}
                    </p>
                    <p className="text-[11px] text-slate-400">{fechaCorta(i.fecha)}</p>
                    {i.nota && <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{i.nota}</p>}
                    {i.resueltaEl && <p className="text-[10px] text-emerald-600 mt-1">Resuelta el {fechaCorta(i.resueltaEl)}</p>}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                    <button
                        onClick={() => resolver.mutate({ id: i.id, resuelta: !i.resueltaEl })}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        {i.resueltaEl ? 'Reabrir' : 'Resolver'}
                    </button>
                    <button
                        onClick={() => eliminar.mutate(i.id)}
                        title="Borrar el registro — solo si te equivocaste al apuntarlo"
                        className="text-[10px] text-slate-400 hover:text-rose-500 px-2 py-1"
                    >
                        Borrar
                    </button>
                </div>
            </div>
        </div>
    );

    /**
     * Va en un **portal** a `document.body`.
     *
     * Este panel nace dentro del listado de Mercado, y por encima hay
     * contenedores con `z-*` propio: cada uno es un contexto de apilamiento que
     * encierra a sus hijos. Desde dentro de esa caja **no hay número de `z`
     * que valga** —la franja de Grimorio se pintaba encima del panel—, y subir
     * el número es el arreglo que parece funcionar y reaparece al siguiente
     * cambio de maquetación. El mismo diagnóstico está escrito en
     * `StackedMobileShell.tsx`. En el `body` no hay caja de la que salir.
     */
    return createPortal((
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={onClose} style={{ WebkitBackdropFilter: 'blur(12px)' }} />

            <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden">
                <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white shrink-0">
                    <span className="p-2 rounded-xl bg-white/15"><Icon svg={ICONS.shield} className="w-5 h-5" /></span>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-base truncate">{proveedorNombre}</h2>
                        <p className="text-[11px] text-white/80">
                            {resumen.total === 0
                                ? `Sin incidencias en ${VENTANA_DIAS} días`
                                : `${resumen.total} en ${VENTANA_DIAS} días · ${resumen.abiertas} sin resolver`}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center">
                        <Icon svg={ICONS.x} className="w-4 h-4" />
                    </button>
                </div>

                {resumen.patrones.length > 0 && (
                    <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/40 shrink-0">
                        <p className="text-xs text-rose-700 dark:text-rose-300">
                            <strong>Esto ya no es mala suerte.</strong>{' '}
                            {resumen.patrones.map(t => `${resumen.porTipo[t]}× ${TIPOS_INCIDENCIA[t].rotulo.toLowerCase()}`).join(' · ')}
                            {' '}en {VENTANA_DIAS} días. {TIPOS_INCIDENCIA[resumen.patrones[0]].porQueImporta}
                        </p>
                    </div>
                )}

                <div className="flex gap-1 p-2 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    {([['resumen', 'Resumen'], ['incidencias', `Incidencias (${suyas.length})`], ['notas', `Notas (${susNotas.length})`]] as const).map(([id, rot]) => (
                        <button
                            key={id}
                            onClick={() => setPestana(id as any)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${pestana === id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            {rot}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                    {aviso && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-200">
                            {aviso}
                        </div>
                    )}

                    {pestana === 'resumen' && (
                        <>
                            {/* Los avisos primero: son lo único que pide una
                                decisión. Las cifras vienen detrás, para poder
                                comprobarlos. */}
                            {avisos.length === 0 ? (
                                <p className="text-[11px] text-slate-500 text-center py-6 leading-relaxed">
                                    Nada digno de mención con este proveedor.<br />
                                    <span className="text-slate-400">
                                        Y es una respuesta, no un hueco: se ha mirado su peso en tu gasto,
                                        de cuántos productos eres rehén suyo, si hay alternativa más barata
                                        y si sus fallos se repiten.
                                    </span>
                                </p>
                            ) : avisos.map((a, i) => (
                                <div
                                    key={i}
                                    className={`rounded-xl border p-3 ${a.tono === 'riesgo'
                                        ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20'
                                        : a.tono === 'dinero'
                                            ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20'
                                            : 'border-slate-200 dark:border-slate-700'}`}
                                >
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{a.texto}</p>
                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{a.porQue}</p>
                                </div>
                            ))}

                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <Cifra
                                    n={perfil.gasto ? `€${perfil.gasto.total.toFixed(0)}` : '—'}
                                    etiqueta={`gasto · ${perfil.pctDelGasto.toFixed(0)} % del total`}
                                />
                                <Cifra n={perfil.productos.length} etiqueta="productos que te vende" />
                                <Cifra
                                    n={perfil.fuenteUnica.length}
                                    etiqueta="solo los vende él"
                                    color={perfil.fuenteUnica.length > 0 ? 'text-rose-600 dark:text-rose-400' : undefined}
                                />
                                <Cifra
                                    n={perfil.tasa === null ? '—' : perfil.tasa.toFixed(2)}
                                    etiqueta={perfil.tasa === null ? 'sin compras que dividir' : 'incidencias por compra'}
                                />
                            </div>

                            {/* `!!`: sin él, `diasReparto?.length` valiendo 0 hacía
                                que la expresión entera valiera 0 — y React pinta
                                el cero. Salía un «0» suelto bajo las cifras. */}
                            {!!(perfil.condiciones.plazoDias != null || perfil.condiciones.pago || perfil.condiciones.diasReparto?.length) && (
                                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                                    {perfil.condiciones.plazoDias != null && <p>Plazo de entrega: <strong>{perfil.condiciones.plazoDias} días</strong></p>}
                                    {!!perfil.condiciones.diasReparto?.length && <p>Reparte: <strong>{perfil.condiciones.diasReparto.join(', ')}</strong></p>}
                                    {perfil.condiciones.pago && <p>Pago: <strong>{perfil.condiciones.pago}</strong></p>}
                                </div>
                            )}

                            {perfil.fuenteUnica.length > 0 && (
                                <details className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                                    <summary className="text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                        Los {perfil.fuenteUnica.length} que solo vende él
                                    </summary>
                                    <ul className="mt-2 space-y-0.5">
                                        {perfil.fuenteUnica.slice(0, 40).map(x => (
                                            <li key={x.fichaId} className="text-[11px] text-slate-500">{x.nombre}</li>
                                        ))}
                                        {perfil.fuenteUnica.length > 40 && (
                                            <li className="text-[11px] text-slate-400">y {perfil.fuenteUnica.length - 40} más</li>
                                        )}
                                    </ul>
                                </details>
                            )}

                            <p className="text-[10px] text-slate-400 leading-relaxed pt-1">
                                El sobrecoste compara las ofertas de <strong>hoy</strong> con lo comprado en los
                                últimos {VENTANA_COMPRAS_DIAS} días. No es dinero perdido: la alternativa barata
                                puede no haber existido entonces.
                            </p>
                        </>
                    )}

                    {pestana === 'incidencias' && (
                        <>
                            {!registrando ? (
                                <button
                                    onClick={() => setRegistrando(true)}
                                    className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-500 hover:border-sky-400 hover:text-sky-600 transition-colors"
                                >
                                    + Registrar una incidencia
                                </button>
                            ) : (
                                <div className="rounded-xl border border-sky-200 dark:border-sky-800/50 p-3 space-y-3 bg-sky-50/40 dark:bg-sky-950/20">
                                    <div className="grid grid-cols-2 gap-2">
                                        {(Object.keys(TIPOS_INCIDENCIA) as TipoIncidencia[]).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setTipo(t)}
                                                className={`text-left px-2.5 py-2 rounded-lg text-xs font-bold border transition-colors ${tipo === t
                                                    ? 'bg-sky-500 text-white border-sky-500'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-sky-300'}`}
                                            >
                                                {TIPOS_INCIDENCIA[t].rotulo}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{TIPOS_INCIDENCIA[tipo].porQueImporta}</p>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <input
                                            type="date"
                                            value={fecha}
                                            onChange={e => setFecha(e.target.value)}
                                            className="h-9 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                                        />
                                        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                                            {(['leve', 'seria'] as Gravedad[]).map(g => (
                                                <button
                                                    key={g}
                                                    onClick={() => setGravedad(g)}
                                                    className={`px-3 h-9 text-xs font-bold ${gravedad === g
                                                        ? (g === 'seria' ? 'bg-rose-500 text-white' : 'bg-slate-700 text-white')
                                                        : 'text-slate-500'}`}
                                                >
                                                    {g}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 -mt-1">
                                        «Seria» significa una cosa concreta: te impidió servir o te costó dinero.
                                    </p>

                                    <textarea
                                        value={nota}
                                        onChange={e => setNota(e.target.value)}
                                        placeholder="Qué pasó exactamente (opcional)"
                                        rows={2}
                                        className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                                    />

                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => { setRegistrando(false); setAviso(null); }} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancelar</button>
                                        <button
                                            onClick={enviar}
                                            disabled={registrar.isPending}
                                            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50"
                                        >
                                            {registrar.isPending ? 'Guardando…' : 'Guardar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {cargando && <p className="text-xs text-slate-400 text-center py-6">Cargando…</p>}
                            {!cargando && suyas.length === 0 && (
                                <p className="text-[11px] text-slate-500 text-center py-8 leading-relaxed">
                                    Nada registrado todavía.<br />
                                    <span className="text-slate-400">
                                        Un retraso suelto se olvida; tres seguidos son una conversación que tener con él.
                                        Esto existe para que la tercera vez se pueda demostrar.
                                    </span>
                                </p>
                            )}
                            {suyas.map(i => <Fila key={i.id} i={i} />)}
                        </>
                    )}

                    {pestana === 'notas' && (
                        <>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
                                <textarea
                                    value={textoNota}
                                    onChange={e => setTextoNota(e.target.value)}
                                    placeholder="Lo que hay que saber de este proveedor y no está en ningún campo. «Llama antes de las 9», «los lunes no reparte»…"
                                    rows={2}
                                    className="w-full px-2.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    {editandoNota && (
                                        <button onClick={() => { setEditandoNota(null); setTextoNota(''); }} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancelar</button>
                                    )}
                                    <button
                                        onClick={enviarNota}
                                        disabled={!textoNota.trim() || guardarNota.isPending}
                                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 dark:bg-white text-white dark:text-slate-900 disabled:opacity-40"
                                    >
                                        {editandoNota ? 'Actualizar' : 'Añadir nota'}
                                    </button>
                                </div>
                            </div>

                            {susNotas.length === 0 && (
                                <p className="text-[11px] text-slate-500 text-center py-8 leading-relaxed">
                                    Sin notas.<br />
                                    <span className="text-slate-400">
                                        Esto no son incidencias: es lo que sabes de trabajar con él y hoy solo vive en tu cabeza.
                                    </span>
                                </p>
                            )}
                            {susNotas.map(n => (
                                <div key={n.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-start gap-2">
                                    <p className="flex-1 min-w-0 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{n.texto}</p>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button
                                            onClick={() => { setEditandoNota(n.id); setTextoNota(n.texto); }}
                                            className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            Editar
                                        </button>
                                        <button onClick={() => eliminarNota.mutate(n.id)} className="text-[10px] text-slate-400 hover:text-rose-500 px-2 py-1">Borrar</button>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    ), document.body);
};
