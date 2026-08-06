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

    // El seguimiento del ancho va en su PROPIO efecto, y no dentro del de abajo.
    // Estando junto al `return` temprano de escritorio, el escuchador de `resize`
    // no llegaba a registrarse nunca en pantalla ancha: el hook se desarmaba y ya
    // no volvía a evaluarse al estrecharse la ventana, así que el pliegue no se
    // activaba jamás si la app había arrancado en escritorio.
    React.useEffect(() => {
        const reevaluar = () => setAncho(window.innerWidth);
        window.addEventListener('resize', reevaluar);
        return () => window.removeEventListener('resize', reevaluar);
    }, []);

    React.useEffect(() => {
        // Solo móvil. En escritorio la cabecera no es fija y el listado scrollea
        // dentro de su columna, así que plegar el título ahí sería un cambio que
        // nadie ha pedido en la vista que hoy funciona bien.
        if (!window.matchMedia('(max-width: 1023px)').matches) { setPlegada(false); return; }

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
        return () => cont.removeEventListener('scroll', alScrollear);
    }, [umbral, ancho]);

    return plegada;
};
