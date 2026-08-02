/**
 * Tamaño por defecto de los nodos nuevos, ajustado al lienzo disponible.
 *
 * Los valores del editor (200×200 para una forma, 200 de ancho para un texto,
 * 24px de tipografía) se eligieron para una pantalla de escritorio. En un móvil
 * de 390px, una forma de 200px ocupa más de la mitad del ancho visible y el
 * texto nace tan grande que se sale del recuadro: es el efecto de "se añaden en
 * tamaño desktop".
 *
 * Se escala una sola vez y desde aquí, para que todos los puntos de creación
 * —barra de herramientas, doble toque en el lienzo, plantillas— coincidan.
 */

/** Por debajo de este ancho se considera lienzo pequeño (mismo umbral que la app). */
const BREAKPOINT_LG = 1024;

export const isCanvasCompact = (): boolean =>
    typeof window !== 'undefined' && window.innerWidth < BREAKPOINT_LG;

/**
 * Factor aplicado a anchos, altos y tipografía de los nodos recién creados.
 * 0.6 deja una forma de 200px en 120px: visible y manipulable con el dedo sin
 * comerse el lienzo.
 */
export const nodeScale = (): number => (isCanvasCompact() ? 0.6 : 1);

/** Redondea a entero aplicando la escala. Útil en línea: `scaled(200)`. */
export const scaled = (value: number): number => Math.round(value * nodeScale());
