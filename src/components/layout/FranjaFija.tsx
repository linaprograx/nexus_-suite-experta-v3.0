import React from 'react';
import { createPortal } from 'react-dom';

/**
 * La franja fija de móvil, como **una sola capa**.
 *
 * El intento anterior colocaba la cabecera y la barra de filtros como dos
 * bloques posicionados por separado, obligados a que sus bordes coincidiesen al
 * píxel. Sus alturas cambian solas —el título se pliega, se cambia de pestaña—,
 * así que cualquier desajuste abría una rendija por la que se veía pasar el
 * listado, o descolgaba la barra. Eso no se arregla ajustando medidas: hay que
 * dejar de tener dos bloques.
 *
 * Aquí la barra de filtros se **inyecta dentro** de la cabecera. Al ser el mismo
 * elemento no hay dos bordes que alinear, el fondo es uno solo y el hueco que
 * reserva el contenido sale de una única medición. Los defectos desaparecen por
 * construcción, no por ajuste.
 *
 * Se hace con un portal y no moviendo el JSX porque cada barra vive dentro de su
 * panel con su propio estado (el desplegable de categoría, el conteo físico, el
 * botón de importar). Levantar ese estado a la vista padre sería el refactor de
 * tres paneles que ya rompió Grimorio una vez. Con el portal la barra sigue
 * escrita donde está y solo cambia dónde se pinta.
 */

/** Hueco que la cabecera reserva para recibir la barra de filtros. */
export const ID_HUECO_FRANJA = 'franja-fija-hueco';

/**
 * Devuelve el destino del portal, o `null` si toca pintar en el sitio de
 * siempre (escritorio, o si por lo que sea el hueco no existe).
 *
 * El umbral es 1023px para que coincida EXACTAMENTE con las clases `lg:`. Se
 * evita `useIsMobile`, que corta en 768: dos criterios distintos para la misma
 * decisión acabarían discrepando en las tabletas.
 */
export const useHuecoFranja = (): HTMLElement | null => {
    const [destino, setDestino] = React.useState<HTMLElement | null>(null);

    React.useEffect(() => {
        const mq = window.matchMedia('(max-width: 1023px)');

        const revisar = () => {
            // El hueco lo monta la cabecera. Puede no existir todavía en el
            // primer render del panel, de ahí que esto viva en un efecto y
            // guarde el resultado en estado: al encontrarlo, se repinta.
            setDestino(mq.matches ? document.getElementById(ID_HUECO_FRANJA) : null);
        };

        revisar();
        mq.addEventListener('change', revisar);
        // La cabecera puede montarse después que el panel (cambio de pestaña,
        // carga diferida), así que se vuelve a mirar en cuanto el DOM cambia.
        const observador = new MutationObserver(revisar);
        observador.observe(document.body, { childList: true, subtree: true });

        return () => {
            mq.removeEventListener('change', revisar);
            observador.disconnect();
        };
    }, []);

    return destino;
};

/**
 * Pinta a sus hijos dentro de la franja fija cuando la hay, y en su sitio de
 * siempre cuando no.
 *
 * Envolver con esto es todo lo que un panel necesita hacer: no cambia su
 * maquetación, su estado ni su comportamiento en escritorio.
 */
export const EnLaFranjaFija: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const destino = useHuecoFranja();
    return destino ? createPortal(children, destino) : <>{children}</>;
};
