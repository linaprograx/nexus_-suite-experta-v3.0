/**
 * Buscador de productos. **Encontrar y ordenar. Agrupar es otro trabajo.**
 *
 * ## Por qué existe
 *
 * Buscar era `nombre.toLowerCase().includes(consulta)`. Eso falla en las tres
 * cosas que un buscador de producto tiene que hacer bien:
 *
 * - **el orden de las palabras**: «vodka absolut» no encontraba «ABSOLUT
 *   VODKA», porque la cadena completa no está contenida;
 * - **los acentos**: «limon» no encontraba «LIMÓN»;
 * - **la relevancia**: el resultado exacto salía donde le tocase por orden
 *   alfabético, detrás de cualquier ficha que lo contuviera de pasada.
 *
 * ## Cómo funciona
 *
 * Lo que hace cualquier buscador de catálogo, sin más invento:
 *
 * 1. Se normaliza todo —minúsculas, sin acentos— para que la comparación no
 *    dependa de cómo se teclee.
 * 2. La consulta se parte en términos y se exigen **TODOS** (`Y`, no `O`).
 *    «aguerrido benigno» devuelve el Benigno, no los tres Aguerridos: cada
 *    palabra que escribes ESTRECHA la búsqueda, que es lo que uno espera.
 * 3. Un término vale si aparece **al principio de alguna palabra** o, en su
 *    defecto, en cualquier posición. Así «abso» encuentra «ABSOLUT» desde la
 *    cuarta letra, sin esperar a que termines.
 * 4. Se ordena por relevancia: primero lo exacto, luego lo que empieza por la
 *    consulta, luego lo que casa por principio de palabra, y al final lo que
 *    solo la contiene. A igualdad, el nombre más corto — es el más específico.
 *
 * **Lo que NO hace, a propósito: descartar.** Si algo coincide, sale. Un
 * buscador que esconde resultados es peor que uno que ordena mal, y esconder
 * producto fue exactamente el fallo que trajo aquí.
 */

/** Minúsculas, sin acentos y sin espacios de más. */
export const normalizar = (valor: string): string =>
    (valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

/** Los términos de una consulta. Vacía = sin términos = no filtra nada. */
export const terminosDe = (consulta: string): string[] =>
    normalizar(consulta).split(' ').filter(Boolean);

const PUNTOS = {
    exacto: 1000,
    empiezaPorLaConsulta: 500,
    principioDePalabra: 60,
    contiene: 10,
};

/**
 * Puntúa un texto contra los términos. `null` si NO casan todos: sin puntuación
 * y sin resultado, que es como se decide qué entra.
 */
const puntuar = (texto: string, terminos: string[], consultaCompleta: string): number | null => {
    const t = normalizar(texto);
    if (!t) return null;

    const palabras = t.split(' ');
    let puntos = 0;

    for (const termino of terminos) {
        const alPrincipioDeUnaPalabra = palabras.some(p => p.startsWith(termino));
        if (alPrincipioDeUnaPalabra) {
            puntos += PUNTOS.principioDePalabra;
            continue;
        }
        if (t.includes(termino)) {
            puntos += PUNTOS.contiene;
            continue;
        }
        return null; // Falta un término: este texto no vale.
    }

    if (t === consultaCompleta) puntos += PUNTOS.exacto;
    else if (t.startsWith(consultaCompleta)) puntos += PUNTOS.empiezaPorLaConsulta;

    return puntos;
};

export interface OpcionesBusqueda<T> {
    /** Los textos donde buscar. El primero pesa más: es el nombre. */
    camposDe: (item: T) => Array<string | undefined>;
}

/**
 * Devuelve los que casan, ordenados por relevancia. Consulta vacía = todos, en
 * su orden original.
 */
export const buscar = <T>(items: T[], consulta: string, opciones: OpcionesBusqueda<T>): T[] => {
    const terminos = terminosDe(consulta);
    if (terminos.length === 0) return items;

    const completa = normalizar(consulta);

    const conPuntos: Array<{ item: T; puntos: number; largo: number }> = [];
    for (const item of items) {
        const campos = opciones.camposDe(item).filter(Boolean) as string[];
        let mejor: number | null = null;
        let largo = Number.MAX_SAFE_INTEGER;

        campos.forEach((campo, i) => {
            const p = puntuar(campo, terminos, completa);
            if (p === null) return;
            // El primer campo es el nombre; los siguientes valen menos, para
            // que coincidir por categoría no adelante a coincidir por nombre.
            const ajustado = i === 0 ? p : Math.round(p / 4);
            if (mejor === null || ajustado > mejor) {
                mejor = ajustado;
                if (i === 0) largo = normalizar(campo).length;
            }
        });

        if (mejor !== null) conPuntos.push({ item, puntos: mejor, largo });
    }

    return conPuntos
        .sort((a, b) => b.puntos - a.puntos || a.largo - b.largo)
        .map(x => x.item);
};
