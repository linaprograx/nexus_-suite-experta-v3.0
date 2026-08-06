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
 * Las capas van a **sangre completa** (`width: 100vw` con `left: calc(50% - 50vw)`).
 * Con `inset-x-0` cubrían solo el ancho de la franja, que va metida dentro del
 * relleno de la banda y del de la página: el rectángulo quedaba más estrecho que
 * la pantalla y se veían sus cantos como un borde cuadrado alrededor del bloque.
 *
 * Se usa `left`, y no `transform: translateX(-50%)`, porque un ancestro
 * transformado hace que `background-attachment: fixed` deje de anclarse al
 * viewport, que es justo lo que hace que la franja calce con el fondo.
 *
 * **Solo móvil (`lg:hidden`).** En escritorio nada de esto se queda fijo, así que
 * pintar la base opaca ahí dibujaba un bloque blanco sólido sobre el degradado
 * en las tres pestañas. No basta con limitar la POSICIÓN a móvil: el fondo
 * también tiene que estar limitado, que es el error que costó una vuelta atrás.
 */
/** Sangre completa: ancho del viewport, centrado, sin transformaciones. */
const sangre: React.CSSProperties = { width: '100vw', left: 'calc(50% - 50vw)' };

export const FranjaFondo: React.FC<{ arriba?: string }> = ({ arriba = '0px' }) => (
    <>
        <div aria-hidden className="lg:hidden absolute bottom-0 -z-10 bg-slate-50 dark:bg-slate-950"
            style={{ top: arriba, ...sangre }} />
        <div aria-hidden className="lg:hidden absolute bottom-0 -z-10 pointer-events-none dark:hidden"
            style={{ top: arriba, ...sangre, backgroundImage: 'var(--franja-fondo)', backgroundAttachment: 'fixed' }} />
        <div aria-hidden className="absolute bottom-0 -z-10 pointer-events-none hidden dark:block lg:dark:hidden"
            style={{ top: arriba, ...sangre, backgroundImage: 'var(--franja-fondo-dark)', backgroundAttachment: 'fixed' }} />
    </>
);
