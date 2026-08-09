import React from 'react';
import { Icon } from '../ui/Icon';
import { ICONS } from '../ui/icons';

/**
 * Un bloque de la configuración económica.
 *
 * Existe para que los seis bloques compartan forma sin que cada uno reinvente
 * su cabecera, su resumen y su plegado. El resumen de la derecha es lo que
 * permite ver la configuración activa **sin abrir nada**, que es lo que pide
 * una pantalla de ajustes: no es un panel de análisis.
 */
export const BloqueEconomia: React.FC<{
    titulo: string;
    /** Lo que hay configurado ahora mismo. Se ve con el bloque cerrado. */
    resumen: string;
    /** Frase corta bajo el título. Nada de documentación extensa. */
    ayuda?: string;
    /** Marca el bloque como imputación, no como dato medido. */
    estimacion?: boolean;
    abiertoPorDefecto?: boolean;
    children: React.ReactNode;
}> = ({ titulo, resumen, ayuda, estimacion, abiertoPorDefecto = false, children }) => {
    const [abierto, setAbierto] = React.useState(abiertoPorDefecto);

    return (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
            <button
                type="button"
                onClick={() => setAbierto(v => !v)}
                aria-expanded={abierto}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left bg-slate-50 dark:bg-slate-800/60"
            >
                <span className="min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-black text-slate-800 dark:text-slate-100">{titulo}</span>
                        {estimacion && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                                estimación
                            </span>
                        )}
                    </span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{resumen}</span>
                </span>
                <Icon
                    svg={ICONS.chevronDown}
                    className={`w-5 h-5 shrink-0 text-slate-400 transition-transform ${abierto ? 'rotate-180' : ''}`}
                />
            </button>

            {abierto && (
                <div className="p-4 space-y-3">
                    {ayuda && <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{ayuda}</p>}
                    {children}
                </div>
            )}
        </div>
    );
};

/** Campo numérico con sufijo. `0` es un valor válido y se conserva. */
export const CampoNumero: React.FC<{
    etiqueta: string;
    valor: number;
    sufijo?: string;
    min?: number;
    max?: number;
    onChange: (n: number) => void;
}> = ({ etiqueta, valor, sufijo, min = 0, max, onChange }) => (
    <label className="block">
        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{etiqueta}</span>
        <span className="flex items-center gap-2">
            <input
                type="number"
                min={min}
                max={max}
                step="any"
                value={valor}
                // Vacío se trata como 0, no como "sin valor": este formulario no
                // distingue ausencia, y dejar NaN corrompería el cálculo.
                onChange={e => {
                    const n = e.target.value === '' ? 0 : Number(e.target.value);
                    if (!isFinite(n)) return;
                    const acotado = max !== undefined ? Math.min(max, Math.max(min, n)) : Math.max(min, n);
                    onChange(acotado);
                }}
                className="w-28 h-11 px-3 rounded-xl text-base tabular-nums bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            />
            {sufijo && <span className="text-sm text-slate-500 dark:text-slate-400">{sufijo}</span>}
        </span>
    </label>
);

/** Interruptor con etiqueta, alto táctil cómodo. */
export const Interruptor: React.FC<{
    etiqueta: string;
    activo: boolean;
    onChange: (v: boolean) => void;
}> = ({ etiqueta, activo, onChange }) => (
    <label className="flex items-center justify-between gap-3 py-1 cursor-pointer">
        <span className="text-sm text-slate-700 dark:text-slate-200 min-w-0">{etiqueta}</span>
        <button
            type="button"
            role="switch"
            aria-checked={activo}
            aria-label={etiqueta}
            onClick={() => onChange(!activo)}
            className={`shrink-0 w-12 h-7 rounded-full transition-colors relative ${activo ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
        >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${activo ? 'left-6' : 'left-1'}`} />
        </button>
    </label>
);
