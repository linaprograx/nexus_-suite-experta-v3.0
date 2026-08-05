import React from 'react';
import { pizarronStore } from '../state/store';
import { gestoMultitactil } from '../engine/gestureState';

/**
 * Pellizcar para hacer zoom y dos dedos para desplazar el lienzo.
 *
 * En escritorio el zoom lo lleva la rueda del ratón (`onWheel` en CanvasStage);
 * en un móvil no hay rueda, así que la única forma era apuntar a los botones
 * `−` / `+` de la barra superior. Con el lienzo ya despejado tras P1 y P2, eso
 * se convierte en la fricción más visible.
 *
 * Se escucha en fase de captura y **solo con dos dedos**: un dedo sigue llegando
 * intacto al `interactionManager`, que es quien selecciona, arrastra y dibuja.
 * Así el gesto no compite con la edición.
 */

const ZOOM_MIN = 0.05;
const ZOOM_MAX = 4;

const distancia = (a: Touch, b: Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

const centro = (a: Touch, b: Touch) => ({
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
});

export const useCanvasGestures = (ref: React.RefObject<HTMLElement | null>) => {
    React.useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let activo = false;
        let distIni = 0;
        let zoomIni = 1;
        let centroIni = { x: 0, y: 0 };
        let vpIni = { x: 0, y: 0 };

        const onStart = (e: TouchEvent) => {
            if (e.touches.length !== 2) { activo = false; return; }
            const [a, b] = [e.touches[0], e.touches[1]];
            const vp = pizarronStore.getState().viewport;
            activo = true;
            // Silencia al motor mientras dure el gesto: sus eventos pointer llegan
            // por un flujo distinto y stopPropagation() no los alcanza.
            gestoMultitactil.activo = true;
            distIni = distancia(a, b);
            zoomIni = vp.zoom;
            centroIni = centro(a, b);
            vpIni = { x: vp.x, y: vp.y };
            e.preventDefault();
            e.stopPropagation();
        };

        const onMove = (e: TouchEvent) => {
            if (!activo || e.touches.length !== 2) return;
            e.preventDefault();
            e.stopPropagation();

            const [a, b] = [e.touches[0], e.touches[1]];
            const dist = distancia(a, b);
            if (distIni <= 0) return;

            const zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomIni * (dist / distIni)));
            const c = centro(a, b);

            // El punto del mundo bajo los dedos debe quedarse quieto mientras se
            // hace zoom; sin esto, el lienzo se escapa hacia una esquina.
            const mundoX = (centroIni.x - vpIni.x) / zoomIni;
            const mundoY = (centroIni.y - vpIni.y) / zoomIni;

            pizarronStore.updateViewport({
                zoom,
                x: c.x - mundoX * zoom,
                y: c.y - mundoY * zoom,
            });
        };

        const onEnd = (e: TouchEvent) => {
            if (e.touches.length < 2) {
                activo = false;
                gestoMultitactil.terminar();
            }
        };

        // `passive: false` es obligatorio: sin él el navegador ignora el
        // preventDefault y hace su propio zoom de página sobre el nuestro.
        const opts = { passive: false, capture: true } as AddEventListenerOptions;
        el.addEventListener('touchstart', onStart, opts);
        el.addEventListener('touchmove', onMove, opts);
        el.addEventListener('touchend', onEnd, opts);
        el.addEventListener('touchcancel', onEnd, opts);

        return () => {
            el.removeEventListener('touchstart', onStart, opts);
            el.removeEventListener('touchmove', onMove, opts);
            el.removeEventListener('touchend', onEnd, opts);
            el.removeEventListener('touchcancel', onEnd, opts);
        };
    }, [ref]);
};
