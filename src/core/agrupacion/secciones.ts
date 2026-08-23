/**
 * **Secciones plegables.** Puntos 1 y 18 del plan.
 *
 * Inventario se consulta con «¿tengo ginebra?» y Mercado con «¿a quién se lo
 * pido?». Por eso Inventario agrupa por **familia** y Mercado por
 * **proveedor** — el criterio es de uso, no de estética. La resolución está en
 * `PLAN-INVENTARIO-MERCADO.md` → «Una contradicción resuelta».
 *
 * ## La trampa: un producto puede estar en varias secciones
 *
 * Una ficha tiene **una** categoría, pero la venden **varios** proveedores. Si
 * cada producto cayera en una sola sección de proveedor —la del preferente,
 * por ejemplo— abrir «IN VINO VERITAS» enseñaría una parte de lo que ese
 * proveedor vende, y el resto estaría escondido bajo otro nombre. Eso es
 * exactamente el fallo que este proyecto lleva persiguiendo: **una pantalla
 * que no falla, responde de menos.**
 *
 * Así que `clavesDe` devuelve una **lista**: cero claves (va a «Sin asignar»),
 * una (familia) o varias (los proveedores que lo venden). La consecuencia es
 * que la suma de los contadores puede superar el total, y por eso el total de
 * productos distintos se cuenta aparte y se enseña aparte: un contador que no
 * se explica se lee como un error.
 *
 * ## La jerarquía es presentación
 *
 * Regla del propio plan. Buscar no puede depender de qué haya abierto: la
 * búsqueda atraviesa las secciones y `seccionesConResultados` dice cuáles
 * abrir solas. Si no, plegar mataría el buscador.
 */

export interface Seccion<T> {
    /** Clave estable. Es lo que se guarda como «sección abierta». */
    id: string;
    titulo: string;
    items: T[];
    /** La lista de limpieza: lo que no tiene familia o no tiene proveedor. */
    esSinAsignar: boolean;
}

export const SIN_ASIGNAR = '__sin-asignar__';

export interface OpcionesDeSeccion<T> {
    /** Las secciones a las que pertenece un ítem. Vacío ⇒ «Sin asignar». */
    clavesDe: (item: T) => string[];
    /** Cómo se llama una sección. Por defecto, la propia clave. */
    tituloDe?: (clave: string) => string;
    /** El rótulo de la sección de limpieza. */
    tituloSinAsignar?: string;
}

/**
 * Reparte los ítems en secciones.
 *
 * Orden alfabético, y **«Sin asignar» siempre al final**. Ordenar por número
 * de ítems parecería más útil y no lo es: el orden cambiaría al importar un
 * catálogo, y una lista que se reordena sola obliga a volver a buscar con la
 * vista lo que ayer estaba en el mismo sitio.
 *
 * Las secciones vacías no se pintan. «Sin asignar» tampoco cuando está vacía:
 * ahí no hay nada que limpiar, y un «Sin asignar (0)» permanente es una fila
 * que nunca dice nada.
 */
export const seccionar = <T,>(items: T[], op: OpcionesDeSeccion<T>): Seccion<T>[] => {
    const titulo = op.tituloDe || ((c: string) => c);
    const porClave = new Map<string, T[]>();
    const sinAsignar: T[] = [];

    for (const item of items || []) {
        const claves = (op.clavesDe(item) || []).filter(Boolean);
        if (claves.length === 0) { sinAsignar.push(item); continue; }
        // `Set`: si un proveedor apareciera dos veces para la misma ficha
        // —dos formatos suyos— el producto se pintaría dos veces dentro de su
        // propia sección.
        for (const clave of new Set(claves)) {
            const lista = porClave.get(clave);
            if (lista) lista.push(item); else porClave.set(clave, [item]);
        }
    }

    const salida: Seccion<T>[] = [...porClave.entries()]
        .map(([id, items]) => ({ id, titulo: titulo(id), items, esSinAsignar: false }))
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es', { sensitivity: 'base' }));

    if (sinAsignar.length > 0) {
        salida.push({
            id: SIN_ASIGNAR,
            titulo: op.tituloSinAsignar || 'Sin asignar',
            items: sinAsignar,
            esSinAsignar: true,
        });
    }

    return salida;
};

/**
 * Cuántos ítems **distintos** hay, contando una sola vez el que está en varias
 * secciones. Sumar los contadores de las secciones daría de más.
 */
export const totalDistinto = <T,>(items: T[]): number => new Set(items || []).size;

/**
 * Las secciones que contienen algún resultado de la búsqueda: las que hay que
 * abrir solas para que plegar no mate al buscador.
 */
export const seccionesConResultados = <T,>(
    secciones: Seccion<T>[],
    coincide: (item: T) => boolean,
): string[] => (secciones || [])
    .filter(s => s.items.some(coincide))
    .map(s => s.id);
