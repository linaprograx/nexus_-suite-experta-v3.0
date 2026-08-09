import React from 'react';
import { useBusinessCostSettings } from '../hooks/useBusinessCostSettings';
import { BusinessCostSettings, VariableServiceCost } from '../core/costing/profitability.types';
import { BloqueEconomia, CampoNumero, Interruptor } from '../components/personal/BloqueEconomia';
import { Icon } from '../components/ui/Icon';
import { ICONS } from '../components/ui/icons';

/**
 * Configuración económica del negocio.
 *
 * Es la capa que alimenta al motor de rentabilidad. Grimorio es hoy su único
 * consumidor, pero estos valores —fiscalidad, objetivo de coste, coste laboral,
 * comisiones— no son de una receta ni de un módulo: son del local. Por eso vive
 * en su propia pestaña de Personal y no dentro de los ajustes personales, que
 * son otra cosa (tema, sonidos, notificaciones).
 *
 * ## No calcula nada
 *
 * Recoge, valida y persiste. Todas las fórmulas siguen en `profitabilityEngine`.
 *
 * ## Nunca guarda por abrir la pantalla
 *
 * `useBusinessCostSettings` devuelve los valores por defecto cuando no hay
 * documento. Si esta vista los volcase al montarse, convertiría «sin
 * configurar» en «configurado con ceros» sin que nadie lo pidiera. Por eso el
 * guardado es explícito, solo se activa cuando algo cambia de verdad, y escribe
 * únicamente los campos tocados.
 */

const arr = (n: number) => Math.round(n * 100) / 100;

export const EconomiaView: React.FC = () => {
    const { ajustes, cargando, guardar } = useBusinessCostSettings();

    // Borrador local. Se siembra desde lo persistido y se vuelve a sembrar si
    // cambia por fuera, pero solo mientras no haya cambios sin guardar: si no,
    // una escritura remota borraría lo que se está escribiendo.
    const [borrador, setBorrador] = React.useState<BusinessCostSettings>(ajustes);
    const [sucio, setSucio] = React.useState(false);
    const [guardando, setGuardando] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [guardado, setGuardado] = React.useState(false);

    React.useEffect(() => {
        if (!sucio) setBorrador(ajustes);
    }, [ajustes, sucio]);

    const set = (cambios: Partial<BusinessCostSettings>) => {
        setBorrador(prev => ({ ...prev, ...cambios }));
        setSucio(true);
        setGuardado(false);
    };

    const onGuardar = async () => {
        setGuardando(true);
        setError(null);
        try {
            await guardar(borrador);
            setSucio(false);
            setGuardado(true);
        } catch (e: any) {
            setError(e?.message || 'No se ha podido guardar. Inténtalo de nuevo.');
        } finally {
            setGuardando(false);
        }
    };

    const descartar = () => { setBorrador(ajustes); setSucio(false); setError(null); };

    // ── Costes variables del negocio
    const variables = borrador.costesVariablesDefault || [];
    const nuevoId = () => Math.random().toString(36).slice(2, 10);
    const añadirVariable = () => set({
        costesVariablesDefault: [...variables, { id: nuevoId(), nombre: '', tipo: 'fixed', valor: 0 }],
    });
    const editarVariable = (id: string, cambios: Partial<VariableServiceCost>) => set({
        costesVariablesDefault: variables.map(c => (c.id === id ? { ...c, ...cambios } : c)),
    });
    const borrarVariable = (id: string) => set({
        costesVariablesDefault: variables.filter(c => c.id !== id),
    });

    const campo = 'h-11 px-3 rounded-xl text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 w-full';

    if (cargando) {
        return <div className="p-6 text-sm text-slate-400">Cargando la configuración…</div>;
    }

    const b = borrador;
    const overheadActivo = b.overheadPorServicio > 0 || b.overheadPercentage > 0;

    return (
        <div className="pb-28 lg:pb-6 animate-in fade-in duration-300 max-w-3xl">
            <div className="mb-4">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">Economía del negocio</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Cómo interpreta Nexus el dinero de tus operaciones. Las recetas heredan estos
                    valores y pueden sobrescribir algunos.
                </p>
            </div>

            <div className="space-y-3">
                {/* ── Fiscalidad */}
                <BloqueEconomia
                    titulo="Fiscalidad"
                    resumen={b.taxRateVenta > 0
                        ? `${arr(b.taxRateVenta * 100)}% · precios ${b.precioIncluyeImpuestos ? 'con' : 'sin'} impuestos`
                        : 'Sin impuestos configurados'}
                    ayuda="Determina cómo se separa el ingreso neto del impuesto. No se aplica ningún supuesto de país."
                >
                    <CampoNumero
                        etiqueta="Impuesto de venta"
                        valor={arr(b.taxRateVenta * 100)}
                        sufijo="%"
                        max={100}
                        onChange={n => set({ taxRateVenta: n / 100 })}
                    />
                    <Interruptor
                        etiqueta="Los precios introducidos incluyen impuestos"
                        activo={b.precioIncluyeImpuestos}
                        onChange={v => set({ precioIncluyeImpuestos: v })}
                    />
                </BloqueEconomia>

                {/* ── Objetivos */}
                <BloqueEconomia
                    titulo="Objetivo de rentabilidad"
                    resumen={`Coste objetivo ${b.targetBeverageCostPercentage}%`}
                    ayuda="Porcentaje máximo del ingreso neto que quieres destinar al coste directo de producto. Alimenta el precio recomendado y la clasificación de cada receta."
                >
                    <CampoNumero
                        etiqueta="Target beverage cost"
                        valor={b.targetBeverageCostPercentage}
                        sufijo="%"
                        min={1}
                        max={95}
                        onChange={n => set({ targetBeverageCostPercentage: n })}
                    />
                </BloqueEconomia>

                {/* ── Merma */}
                <BloqueEconomia
                    titulo="Merma operativa"
                    estimacion
                    resumen={b.porcentajeMermaDefault > 0 ? `${b.porcentajeMermaDefault}% por receta` : 'Sin merma'}
                    ayuda="Se aplica sobre el coste directo. Cada receta puede personalizarla o volver a este valor. Déjalo en 0 para no aplicarla."
                >
                    <CampoNumero
                        etiqueta="Merma por defecto"
                        valor={b.porcentajeMermaDefault}
                        sufijo="%"
                        max={100}
                        onChange={n => set({ porcentajeMermaDefault: n })}
                    />
                </BloqueEconomia>

                {/* ── Mano de obra */}
                <BloqueEconomia
                    titulo="Mano de obra"
                    estimacion
                    resumen={b.costeLaboralHora > 0
                        ? `${b.costeLaboralHora} €/h · ${b.incluirManoObraPorDefecto ? 'incluida' : 'no incluida'}`
                        : 'Sin configurar'}
                    ayuda="Introduce el coste aproximado que representa una hora de trabajo para el negocio, no el salario neto del trabajador."
                >
                    <CampoNumero
                        etiqueta="Coste laboral"
                        valor={b.costeLaboralHora}
                        sufijo="€/h"
                        onChange={n => set({ costeLaboralHora: n })}
                    />
                    <Interruptor
                        etiqueta="Incluir mano de obra en el análisis por defecto"
                        activo={b.incluirManoObraPorDefecto}
                        onChange={v => set({ incluirManoObraPorDefecto: v })}
                    />
                </BloqueEconomia>

                {/* ── Costes variables */}
                <BloqueEconomia
                    titulo="Costes variables de venta"
                    resumen={variables.length > 0
                        ? variables.map(c => `${c.nombre || 'Sin nombre'} ${c.tipo === 'percentage' ? `${c.valor}%` : `${c.valor}€`}`).join(' · ')
                        : 'Ninguno'}
                    ayuda="Comisiones que se aplican a todas las ventas: TPV, plataformas, reparto. Las recetas pueden añadir los suyos, que se SUMAN a estos."
                >
                    <div className="space-y-2">
                        {variables.map(c => (
                            // Bloque vertical: en móvil, tres campos y un botón en
                            // fila dejan el de borrar fuera de la pantalla.
                            <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2">
                                <div className="flex gap-2 items-center">
                                    <input
                                        value={c.nombre}
                                        onChange={e => editarVariable(c.id, { nombre: e.target.value })}
                                        placeholder="Nombre (ej. TPV)"
                                        className={campo}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => borrarVariable(c.id)}
                                        aria-label={`Eliminar ${c.nombre || 'coste'}`}
                                        className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-rose-500 bg-rose-50 dark:bg-rose-900/20"
                                    >
                                        <Icon svg={ICONS.trash} className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <select
                                        value={c.tipo}
                                        onChange={e => editarVariable(c.id, { tipo: e.target.value as 'fixed' | 'percentage' })}
                                        className={`${campo} w-36 shrink-0`}
                                    >
                                        <option value="fixed">Importe €</option>
                                        <option value="percentage">% del PVP</option>
                                    </select>
                                    <input
                                        type="number" min={0} step="any" value={c.valor}
                                        onChange={e => editarVariable(c.id, { valor: e.target.value === '' ? 0 : Number(e.target.value) })}
                                        className={`${campo} tabular-nums flex-1 min-w-0`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={añadirVariable}
                        className="h-11 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider"
                    >
                        + Añadir coste variable
                    </button>
                </BloqueEconomia>

                {/* ── Estructura */}
                <BloqueEconomia
                    titulo="Costes de estructura"
                    estimacion
                    resumen={overheadActivo
                        ? [b.overheadPorServicio > 0 ? `${b.overheadPorServicio} €/servicio` : null,
                           b.overheadPercentage > 0 ? `${b.overheadPercentage}%` : null].filter(Boolean).join(' + ')
                        : 'Desactivado'}
                    ayuda="Imputación aproximada de alquiler, luz, agua, limpieza, software o seguros por servicio. Es una estimación, no contabilidad: se muestra siempre separada del coste técnico. Déjalo en 0 para no aplicarla."
                >
                    <CampoNumero
                        etiqueta="Importe por servicio"
                        valor={b.overheadPorServicio}
                        sufijo="€"
                        onChange={n => set({ overheadPorServicio: n })}
                    />
                    <CampoNumero
                        etiqueta="O porcentaje sobre el coste servido"
                        valor={b.overheadPercentage}
                        sufijo="%"
                        max={100}
                        onChange={n => set({ overheadPercentage: n })}
                    />
                    <p className="text-[11px] text-slate-400">
                        Si rellenas los dos, se suman.
                    </p>
                </BloqueEconomia>

                {/* ── Presentación */}
                <BloqueEconomia
                    titulo="Moneda y redondeo"
                    resumen={`${b.moneda} · precios a ${b.redondeoPrecio > 0 ? b.redondeoPrecio : 'sin redondear'}`}
                    ayuda="El redondeo solo afecta a los precios SUGERIDOS. Nunca cambia un precio que ya hayas puesto."
                >
                    <label className="block">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Moneda</span>
                        <input
                            value={b.moneda}
                            onChange={e => set({ moneda: e.target.value.toUpperCase().slice(0, 4) })}
                            className={`${campo} w-32`}
                        />
                    </label>
                    <CampoNumero
                        etiqueta="Redondear precios sugeridos a"
                        valor={b.redondeoPrecio}
                        sufijo="€"
                        onChange={n => set({ redondeoPrecio: n })}
                    />
                </BloqueEconomia>
            </div>

            {error && (
                <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{error}</p>
            )}

            {/* Barra de guardado. Solo aparece cuando hay algo que guardar: así
                abrir la pantalla nunca escribe nada. */}
            {sucio && (
                <div className="fixed inset-x-0 bottom-0 z-40 lg:static lg:mt-4 p-3 lg:p-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t lg:border-0 border-slate-200 dark:border-slate-700"
                    style={{ paddingBottom: 'calc(0.75rem + 60px + env(safe-area-inset-bottom))' }}>
                    <div className="flex items-center gap-2 max-w-3xl mx-auto">
                        <button
                            type="button"
                            onClick={descartar}
                            className="h-11 px-4 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400"
                        >
                            Descartar
                        </button>
                        <button
                            type="button"
                            onClick={onGuardar}
                            disabled={guardando}
                            className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold uppercase tracking-wider"
                        >
                            {guardando ? 'Guardando…' : 'Guardar cambios'}
                        </button>
                    </div>
                </div>
            )}

            {guardado && !sucio && (
                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">Configuración guardada.</p>
            )}
        </div>
    );
};

export default EconomiaView;
