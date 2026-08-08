import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

/**
 * El resultado de un lote del Batcher.
 *
 * Vive aparte porque lo consumen dos sitios: la vista suelta del Escandallator y
 * la capa de Costes dentro de Grimorio.
 *
 * El motivo de existir es un fallo concreto: `GrimoriumView` declaraba el estado
 * `batchResult`, pasaba el *setter* a `BatcherTab` y **nunca leía el valor**. El
 * cálculo se hacía y se guardaba en un estado que no pintaba nadie, así que
 * dentro de Grimorio "Calcular Producción" no producía ningún efecto visible.
 * Funcionaba en la vista suelta porque allí sí se renderizaba, inline. Extraerlo
 * evita que la próxima pantalla que lo monte vuelva a olvidarse.
 */

interface BatcherResultadoProps {
    resultado: any;
    /** Guardar el lote como tarea del Pizarrón. Opcional: no todas las pantallas lo ofrecen. */
    onGuardar?: () => void;
}

export const BatcherResultado: React.FC<BatcherResultadoProps> = ({ resultado, onGuardar }) => {
    if (!resultado) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Icon svg={ICONS.layers} className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Configura el lote y pulsa «Calcular Producción».</p>
            </div>
        );
    }

    const filas: any[] = resultado.data || [];

    return (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/10">
                <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Total del lote</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {resultado.meta?.targetQuantity} {resultado.meta?.targetUnit}
                        {resultado.meta?.includeDilution ? ' · con dilución' : ''}
                    </p>
                </div>
                {onGuardar && (
                    <button
                        onClick={onGuardar}
                        className="shrink-0 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                    >
                        <Icon svg={ICONS.check} className="w-4 h-4" /> Guardar
                    </button>
                )}
            </div>

            <div className="flex flex-col gap-2">
                {filas.map((fila: any, i: number) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-slate-200/60 dark:border-white/10">
                        <div className={`flex items-center justify-between gap-3 p-4 ${fila.esPreparacion ? 'bg-amber-50 dark:bg-amber-900/15' : 'bg-white/80 dark:bg-slate-900/50'}`}>
                            <div className="min-w-0">
                                <span className="block font-medium text-sm text-slate-800 dark:text-slate-200 break-words">
                                    {fila.ingredient}
                                    {fila.esPreparacion && (
                                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                            {fila.tipo === 'garnish' ? 'garnish' : 'subreceta'}
                                        </span>
                                    )}
                                </span>
                                {/* Cuánto lleva UN trago. En barra es el contraste que
                                    permite comprobar el escalado de un vistazo. */}
                                {fila.originalQty && fila.originalQty !== '-' && (
                                    <span className="block text-[11px] text-slate-400 mt-0.5">
                                        {fila.originalQty} por trago
                                    </span>
                                )}
                            </div>
                            <span className="shrink-0 text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {fila.batchQty}
                            </span>
                        </div>

                        {/* Qué hay que preparar para tener esa cantidad. Sin esto la
                            hoja pedía los ingredientes en bruto y quien produce no
                            sabía qué era una preparación aparte. */}
                        {fila.componentes?.length > 0 && (
                            <div className="px-4 py-3 bg-white/60 dark:bg-slate-900/40 border-t border-dashed border-amber-300/60 dark:border-amber-700/40">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                                    Para preparar {fila.batchQty}
                                </p>
                                <div className="space-y-1.5">
                                    {fila.componentes.map((c: any, k: number) => (
                                        <div key={k} className="flex items-center justify-between gap-3">
                                            <span className="text-sm text-slate-600 dark:text-slate-300 min-w-0 break-words">{c.ingredient}</span>
                                            <span className="shrink-0 text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">{c.batchQty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BatcherResultado;
