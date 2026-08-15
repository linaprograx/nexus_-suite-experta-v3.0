import { create } from 'zustand';
import React from 'react';

/**
 * El color de acento que está mandando ahora mismo en pantalla.
 *
 * ## Por qué hace falta un sitio para esto
 *
 * `APP_SECTIONS` da **un** color por sección, y eso basta mientras la sección
 * tenga uno. Pero CerebrIty cambia de identidad en cada pestaña —magenta en
 * Synthesis, verde en Make Menu, azul en Critic, violeta en The Lab, naranja en
 * Trends— y la barra lateral no tiene forma de saberlo: está fuera de la vista.
 *
 * Así que la vista **publica** su color y quien lo necesite lo lee. Sin esto,
 * o la barra se queda con un color fijo que contradice a la pantalla, o habría
 * que subir el estado de las pestañas de cada vista al layout, que es el
 * refactor que no toca hacer.
 *
 * ## Quién lo usa
 *
 * - La barra lateral, para el resaltado de la sección activa.
 * - Cualquier elemento resaltado que quiera ir a juego con su sección, en vez
 *   de con el violeta o el azul que le tocara cuando se escribió.
 *
 * Si nadie publica nada, vale `null` y quien lo lea cae en el color estático de
 * su sección. Nunca deja a nadie sin color.
 */

interface AcentoState {
    acento: string | null;
    fijarAcento: (color: string | null) => void;
}

export const useAcentoStore = create<AcentoState>((set) => ({
    acento: null,
    fijarAcento: (color) => set({ acento: color }),
}));

/**
 * Publica el color mientras el componente esté montado, y lo retira al salir.
 *
 * Retirarlo importa: sin la limpieza, salir de CerebrIty dejaría su magenta
 * pegado en la barra mientras miras otra sección.
 */
export const usarAcentoDeSeccion = (color?: string | null) => {
    const fijarAcento = useAcentoStore(s => s.fijarAcento);
    React.useEffect(() => {
        fijarAcento(color ?? null);
        return () => fijarAcento(null);
    }, [color, fijarAcento]);
};

/** El acento vigente, o el que se pase de reserva. */
export const useAcento = (reserva?: string): string | undefined =>
    useAcentoStore(s => s.acento) ?? reserva;
