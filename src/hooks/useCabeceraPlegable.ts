import React from 'react';

/**
 * Pliega el bloque de título al bajar y lo devuelve al subir.
 *
 * El criterio es la DIRECCIÓN, no la posición: al bajar se pliega para dejar la
 * pantalla al contenido, y al subir vuelve enseguida —sin tener que llegar
 * arriba del todo— porque subir es el gesto de quien busca los controles.
 *
 * ## Quién scrollea, que no es siempre el mismo
 *
 * En móvil scrollea la PÁGINA (`main`). En escritorio scrollea la COLUMNA
 * central, dentro de una rejilla con `overflow-hidden`, así que `main` nunca
 * llega a scrollear: por eso la cabecera no se plegaba jamás en pantalla ancha
 * y se comía 244 px fijos.
 *
 * Los eventos de scroll **no burbujean**, pero sí se capturan. Escuchando en
 * captura sobre el documento se atienden los dos casos con un solo escuchador,
 * sin tener que localizar el contenedor ni volver a montarlo cuando cambia la
 * pestaña. Se filtra por marca (`data-columna-scroll`) para que el scroll de un
 * desplegable no pliegue nada.
 *
 * ## Por qué con requestAnimationFrame
 *
 * El manejador se dispara decenas de veces por segundo. Sin agrupar, cada
 * ráfaga podía cambiar el estado varias veces dentro del mismo cuadro y dejar
 * el pliegue a medias — el «a cuadros». Ahora se lee la posición como mucho una
 * vez por cuadro, que es tantas como el ojo puede ver.
 */
export const useCabeceraPlegable = (umbral = 64) => {
    const [plegada, setPlegada] = React.useState(false);

    React.useEffect(() => {
        // Última posición conocida POR CONTENEDOR. Con un solo número, alternar
        // entre la página y una columna producía saltos enormes y falsos
        // cambios de dirección.
        const ultima = new WeakMap<Element | Document, number>();
        let pendiente = false;
        let objetivo: Element | null = null;

        const evaluar = () => {
            pendiente = false;
            const el = objetivo;
            if (!el) return;
            const y = el.scrollTop;
            const anterior = ultima.get(el) ?? y;
            const delta = y - anterior;

            // Tolerancia al temblor del dedo. Sin esto la cabecera parpadea con
            // el pulgar apoyado.
            if (Math.abs(delta) < 6) return;
            ultima.set(el, y);

            // Histéresis: se despliega antes de llegar al umbral de plegado, así
            // que la zona en la que un píxel arriba o abajo cambiaba la decisión
            // —y hacía vibrar la cabecera— deja de existir.
            if (y < umbral * 0.5) setPlegada(false);
            else if (y > umbral) setPlegada(delta > 0);
        };

        const alScrollear = (e: Event) => {
            const el = e.target as Element | null;
            if (!el || !(el instanceof Element)) return;
            // Solo la página y las columnas marcadas. Un desplegable que
            // scrollea por dentro no debe plegar la cabecera.
            if (el.tagName !== 'MAIN' && !el.hasAttribute('data-columna-scroll')) return;
            objetivo = el;
            if (pendiente) return;
            pendiente = true;
            requestAnimationFrame(evaluar);
        };

        document.addEventListener('scroll', alScrollear, { passive: true, capture: true });
        return () => document.removeEventListener('scroll', alScrollear, true);
    }, [umbral]);

    return plegada;
};
