import React from 'react';
import { LuPencil, LuEye } from 'react-icons/lu';

/**
 * Interruptor del modo consulta (P3).
 *
 * En móvil, Pizarrón arranca **en consulta**: solo lienzo, zoom y salir. La
 * apuesta es que el uso mayoritario en barra es mirar —el escandallo, la carta,
 * el tablero de la semana— y no editar con el dedo. Con el andamiaje de edición
 * fuera, el lienzo tiene la pantalla entera.
 *
 * Un toque en el lápiz entra a editar; el ojo vuelve a consulta. No se esconde
 * la edición, se deja de imponer.
 */
export const ModoConsultaToggle: React.FC<{
    enConsulta: boolean;
    onToggle: () => void;
}> = ({ enConsulta, onToggle }) => (
    <button
        onClick={onToggle}
        aria-label={enConsulta ? 'Editar' : 'Volver a consulta'}
        aria-pressed={!enConsulta}
        className={`lg:hidden fixed z-[95] h-11 pl-3 pr-4 rounded-full shadow-lg border flex items-center gap-2 text-xs font-bold active:scale-95 transition-all
            ${enConsulta
                ? 'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
                : 'bg-orange-500 border-orange-400 text-white'}`}
        style={{ top: 'calc(env(safe-area-inset-top) + 1rem)', right: '0.5rem' }}
    >
        {enConsulta ? <LuPencil size={16} /> : <LuEye size={16} />}
        {enConsulta ? 'Editar' : 'Consulta'}
    </button>
);
