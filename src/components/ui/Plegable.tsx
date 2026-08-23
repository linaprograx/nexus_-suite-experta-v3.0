import React from 'react';
import { Icon } from './Icon';
import { ICONS } from './icons';

/**
 * Sección plegable.
 *
 * ## La regla que implementa
 *
 * **Una lista de más de 15 elementos no se muestra entera.** Se agrupa por
 * categoría o tipo, y cada grupo es un plegable. Decisión de arquitectura del
 * fundador, 2026-08-11.
 *
 * El motivo es de uso: en un móvil, una lista larga y abierta no es
 * «información disponible», es un muro que empuja fuera de la pantalla todo lo
 * que viene después. Las reglas de stock tapaban la sección de Proveedores
 * entera, que quedaba a un scroll largo de distancia sin que nada lo indicara.
 *
 * Plegado por defecto, el título dice cuántos hay: quien no venga a eso, sigue
 * de largo; quien venga, abre.
 *
 * ## Por qué no se anima la altura
 *
 * Animar `max-height` o `height` obliga al navegador a recalcular la
 * maquetación en cada cuadro, y con listas largas eso se ve a saltos —es el
 * mismo defecto que ya costó retirar el plegado de la cabecera de Grimorio—.
 * Aquí solo gira el galón, que es una transformación y va por compositor. El
 * contenido aparece y desaparece sin transición, que a este tamaño se lee como
 * instantáneo y nunca como roto.
 */
export const Plegable: React.FC<{
    titulo: React.ReactNode;
    /** Se pinta a la derecha del título: normalmente el recuento. */
    insignia?: React.ReactNode;
    /** Abierto de inicio. Por defecto NO, que es el sentido de esto. */
    inicialAbierto?: boolean;
    /**
     * Modo **controlado**: quien lo usa manda si está abierto. Necesario para
     * las secciones del catálogo, donde buscar tiene que abrir solas las que
     * tienen resultados — con el estado dentro, plegar mataría el buscador.
     * Si se pasa, `inicialAbierto` se ignora.
     */
    abierto?: boolean;
    onAlternar?: () => void;
    children: React.ReactNode;
    className?: string;
}> = ({ titulo, insignia, inicialAbierto = false, abierto: abiertoFuera, onAlternar, children, className = '' }) => {
    const [abiertoDentro, setAbiertoDentro] = React.useState(inicialAbierto);
    const controlado = abiertoFuera !== undefined;
    const abierto = controlado ? abiertoFuera : abiertoDentro;
    const setAbierto = () => {
        if (controlado) onAlternar?.(); else setAbiertoDentro(a => !a);
    };

    return (
        <div className={`rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white/40 dark:bg-slate-800/40 ${className}`}>
            <button
                type="button"
                onClick={setAbierto}
                aria-expanded={abierto}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
                <Icon
                    svg={ICONS.chevronDown}
                    className={`w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200 ${abierto ? '' : '-rotate-90'}`}
                />
                <span className="flex-1 min-w-0 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate">
                    {titulo}
                </span>
                {insignia != null && (
                    <span className="shrink-0 text-[10px] font-bold text-slate-400 tabular-nums">{insignia}</span>
                )}
            </button>

            {abierto && (
                <div className="border-t border-slate-100 dark:border-slate-700/50">{children}</div>
            )}
        </div>
    );
};

/** A partir de aquí una lista se agrupa y se pliega. Ver la regla de arriba. */
export const UMBRAL_LISTA_LARGA = 15;
