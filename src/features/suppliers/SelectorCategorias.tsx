import React from 'react';
import { Icon } from '../../components/ui/Icon';
import { ICONS } from '../../components/ui/icons';
import { CATEGORIAS_PROVEEDOR, leerCategorias, escribirCategorias, alternarCategoria } from './categorias';

/**
 * Categorías del proveedor, en una barra que se despliega.
 *
 * Las 19 opciones a la vista ocupaban una fila entera y empujaban el resto del
 * formulario fuera de la pantalla: para escribir el teléfono había que pasar
 * por encima de un muro de categorías que casi nunca se tocan. Aquí ocupan el
 * sitio de un campo normal —al lado del nombre, como antes— y solo se abren
 * cuando hacen falta.
 *
 * Cerrada dice lo elegido, no «Categoría»: lo que importa de un desplegable
 * cerrado es su valor, no su etiqueta, que ya está encima.
 */
export const SelectorCategorias: React.FC<{
    valor?: string;
    onCambio: (nuevo: string) => void;
}> = ({ valor, onCambio }) => {
    const [abierto, setAbierto] = React.useState(false);
    const caja = React.useRef<HTMLDivElement>(null);
    const puestas = leerCategorias(valor);

    // Cerrar al pulsar fuera. En `mousedown` y no en `click`: si se espera al
    // click, pulsar otro campo del formulario cierra el panel pero el foco ya
    // se ha ido a donde no era.
    React.useEffect(() => {
        if (!abierto) return;
        const fuera = (e: MouseEvent) => {
            if (caja.current && !caja.current.contains(e.target as Node)) setAbierto(false);
        };
        document.addEventListener('mousedown', fuera);
        return () => document.removeEventListener('mousedown', fuera);
    }, [abierto]);

    return (
        <div className="relative" ref={caja}>
            <button
                type="button"
                onClick={() => setAbierto(a => !a)}
                aria-expanded={abierto}
                className="w-full h-10 px-3 flex items-center gap-2 rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/10 text-left transition-colors hover:border-emerald-400 dark:hover:border-emerald-500/50"
            >
                <span className={`flex-1 min-w-0 truncate text-sm ${puestas.length ? 'text-slate-800 dark:text-white' : 'text-slate-400'}`}>
                    {puestas.length ? puestas.join(', ') : 'Sin asignar'}
                </span>
                {puestas.length > 1 && (
                    <span className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {puestas.length}
                    </span>
                )}
                <Icon
                    svg={ICONS.chevronDown}
                    className={`shrink-0 w-4 h-4 text-slate-400 transition-transform duration-200 ${abierto ? 'rotate-180' : ''}`}
                />
            </button>

            {abierto && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-2">
                    <p className="px-1 pb-1.5 text-[10px] text-slate-400">
                        Puedes marcar varias.
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                        {CATEGORIAS_PROVEEDOR.map(cat => {
                            const activa = puestas.some(c => c.toLowerCase() === cat.toLowerCase());
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => onCambio(escribirCategorias(alternarCategoria(puestas, cat)))}
                                    className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-colors ${activa
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                >{cat}</button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
