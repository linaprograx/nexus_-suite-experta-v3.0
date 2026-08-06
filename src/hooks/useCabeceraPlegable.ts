import React from 'react';

/**
 * Pliega el bloque de título al bajar y lo devuelve al subir.
 *
 * Existía ya un `handleMainScroll` con esta idea, pero escuchaba el scroll del
 * shell y **en móvil quien scrollea es la página**, así que no llegaba a
 * dispararse nunca en el teléfono. Aquí se escucha el contenedor real.
 *
 * El criterio es la DIRECCIÓN, no la posición: al bajar se pliega para dejar la
 * pantalla al listado, y al subir vuelve enseguida —sin tener que llegar hasta
 * arriba del todo— porque subir es justo el gesto de quien busca los controles.
 */
export const useCabeceraPlegable = (umbral = 64) => {
    const [plegada, setPlegada] = React.useState(false);
    const [ancho, setAncho] = React.useState(() => (typeof window === 'undefined' ? 0 : window.innerWidth));

    React.useEffect(() => {
        // Solo móvil. En escritorio la cabecera no es fija y el listado scrollea
        // dentro de su columna, así que plegar el título ahí sería un cambio que
        // nadie ha pedido en la vista que hoy funciona bien.
        const mq = window.matchMedia('(max-width: 1023px)');
        if (!mq.matches) { setPlegada(false); return; }

        const cont = document.querySelector('main');
        if (!cont) return;

        let anterior = cont.scrollTop;
        const alScrollear = () => {
            const y = cont.scrollTop;
            const delta = y - anterior;
            // Ignora el temblor del dedo: sin esto la cabecera parpadea al
            // mantener el pulgar apoyado sobre la pantalla.
            if (Math.abs(delta) < 6) return;
            anterior = y;
            if (y < umbral) setPlegada(false);
            else setPlegada(delta > 0);
        };

        cont.addEventListener('scroll', alScrollear, { passive: true });
        // Al cambiar de tamaño se reevalúa: girar el teléfono o abrir la ventana
        // puede cruzar el umbral en cualquier dirección.
        const reevaluar = () => setAncho(window.innerWidth);
        window.addEventListener('resize', reevaluar);
        return () => {
            cont.removeEventListener('scroll', alScrollear);
            window.removeEventListener('resize', reevaluar);
        };
    }, [umbral, ancho]);

    return plegada;
};
