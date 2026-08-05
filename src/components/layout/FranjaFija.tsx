import React from 'react';

/**
 * Barra de filtros que se queda fija bajo la cabecera en móvil.
 *
 * No mueve nada de sitio: el bloque se queda exactamente donde estaba en el
 * flujo y solo deja de desplazarse. Se ancla a `--cabecera`, que publica
 * `StackedMobileShell` con la altura real de su cabecera, para que nadie tenga
 * que escribir un número que se desincronice cuando la cabecera cambie.
 *
 * A cambio, publica su propia altura en `--filtros`. El shell suma las dos para
 * saber hasta dónde llega la zona fija y tapar esa franja con una copia del
 * fondo: sin eso, la lista se vería pasar por debajo de los filtros.
 *
 * Por encima de `lg` no hace nada — ahí sobra pantalla y el diseño de escritorio
 * ya coloca estas barras dentro de sus columnas.
 */
export const FranjaFija: React.FC<{
    children: React.ReactNode;
    className?: string;
}> = ({ children, className = '' }) => {
    const ref = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        const el = ref.current;
        if (!el) return;
        const raiz = document.documentElement;
        const ro = new ResizeObserver(([entrada]) => {
            raiz.style.setProperty('--filtros', `${entrada.contentRect.height}px`);
        });
        ro.observe(el);
        // Al desmontarse hay que borrarlo: si no, al cambiar de pestaña la tapa
        // conservaría la altura de la barra anterior y dejaría una banda muerta.
        return () => { ro.disconnect(); raiz.style.removeProperty('--filtros'); };
    }, []);

    return (
        <div
            ref={ref}
            className={`sticky top-[var(--cabecera,0px)] z-[26] lg:static lg:z-auto ${className}`}
        >
            {children}
        </div>
    );
};
