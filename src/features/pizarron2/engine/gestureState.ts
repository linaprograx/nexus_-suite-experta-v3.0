/**
 * Bandera compartida: ¿hay un gesto multitáctil en curso?
 *
 * El lienzo escucha **eventos pointer** y el hook de gestos escucha **eventos
 * touch**. Son dos flujos independientes del navegador: llamar a
 * `stopPropagation()` sobre uno no impide que el otro se dispare.
 *
 * Sin esta bandera, un pellizco de dos dedos llegaba también al
 * `InteractionManager` como dos `pointerdown` seguidos, y el detector de doble
 * toque —que solo mira el tiempo entre pulsaciones— los tomaba por un doble
 * toque y creaba un nodo de texto. De ahí los "Type something..." que aparecían
 * solos al hacer zoom.
 *
 * Vive en su propio módulo para que no haya import circular entre el hook de
 * la interfaz y el motor.
 */
export const gestoMultitactil = {
    activo: false,

    /**
     * Marca el fin del gesto con un pequeño retardo.
     *
     * Al levantar los dedos, el navegador emite todavía los `pointerup`
     * pendientes. Si se limpiara la bandera en el mismo instante, esos eventos
     * entrarían al motor y volveríamos a tener el problema, solo que al soltar
     * en vez de al tocar.
     */
    terminar() {
        setTimeout(() => { this.activo = false; }, 120);
    },
};
