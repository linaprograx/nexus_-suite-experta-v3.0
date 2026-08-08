import { useSyncExternalStore } from 'react';

/**
 * Alcance del listado de Recetas: todas, o solo las de la carta activa.
 *
 * **Memoria de sesión, no persistente.** Se conserva mientras la app está
 * abierta —para poder irse a Inventario o a Pizarrón y volver sin perder el
 * hilo— y se pierde al cerrarla: al abrir la app siempre se empieza viendo
 * todas las recetas. Es lo que pidió el fundador, y `sessionStorage` hace
 * exactamente eso sin código extra.
 *
 * Vive en un módulo y no en un contexto porque lo consultan dos ramas del árbol
 * que no se tocan: la barra de herramientas y la vista de Grimorio.
 */

const CLAVE = 'nexus:alcance-carta';

let activo = (() => {
    try { return sessionStorage.getItem(CLAVE) === '1'; } catch { return false; }
})();

const oyentes = new Set<() => void>();

const suscribir = (fn: () => void) => { oyentes.add(fn); return () => { oyentes.delete(fn); }; };
const leer = () => activo;

export const fijarAlcanceCarta = (valor: boolean) => {
    if (activo === valor) return;
    activo = valor;
    try {
        if (valor) sessionStorage.setItem(CLAVE, '1');
        else sessionStorage.removeItem(CLAVE);
    } catch { /* modo privado: se queda en memoria, que es suficiente */ }
    oyentes.forEach(fn => fn());
};

/** `true` cuando el listado debe mostrar solo las recetas de la carta. */
export const useAlcanceCarta = (): boolean => useSyncExternalStore(suscribir, leer, () => false);
