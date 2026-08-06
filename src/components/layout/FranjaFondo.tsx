import React from 'react';

/**
 * Fondo de una franja fija, indistinguible del fondo de la página.
 *
 * El fondo móvil de las vistas es un degradado `fixed` a pantalla completa. Una
 * barra opaca por encima deja una costura visible en cuanto el contenido pasa
 * por debajo. La solución es que la franja pinte **el mismo degradado anclado al
 * viewport** (`background-attachment: fixed`): al estar ambos anclados igual,
 * coinciden pixel a pixel a cualquier altura de scroll.
 *
 * El degradado llega en las variables `--franja-fondo` y `--franja-fondo-dark`,
 * que publica el shell a partir de la MISMA definición que usa el fondo, para
 * que no haya dos copias que se desincronicen.
 *
 * Debajo va una base opaca porque el degradado se vuelve transparente al 45%:
 * por sí solo dejaría transparentar el contenido que pasa por detrás.
 *
 * **Solo móvil (`lg:hidden`).** En escritorio nada de esto se queda fijo, así que
 * pintar la base opaca ahí dibujaba un bloque blanco sólido sobre el degradado
 * en las tres pestañas. No basta con limitar la POSICIÓN a móvil: el fondo
 * también tiene que estar limitado, que es el error que costó una vuelta atrás.
 */
export const FranjaFondo: React.FC<{ arriba?: string }> = ({ arriba = '0px' }) => (
    <>
        <div aria-hidden className="lg:hidden absolute inset-x-0 bottom-0 -z-10 bg-slate-50 dark:bg-slate-950"
            style={{ top: arriba }} />
        <div aria-hidden className="lg:hidden absolute inset-x-0 bottom-0 -z-10 pointer-events-none dark:hidden"
            style={{ top: arriba, backgroundImage: 'var(--franja-fondo)', backgroundAttachment: 'fixed' }} />
        <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 pointer-events-none hidden dark:block lg:dark:hidden"
            style={{ top: arriba, backgroundImage: 'var(--franja-fondo-dark)', backgroundAttachment: 'fixed' }} />
    </>
);
