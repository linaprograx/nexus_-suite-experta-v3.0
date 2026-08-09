import { Ingredient } from '../../types';

/**
 * Identidad de producto maestro. **Fase B: existe pero nadie lo consume.**
 *
 * `Ingredient.id` ya era el identificador maestro; lo único que faltaba era
 * poder decir «este documento es en realidad el mismo producto que aquel».
 * Eso es `masterProductId`, y se resuelve **en lectura**: los históricos siguen
 * apuntando a su documento original y nadie reescribe nada.
 *
 * Consecuencia deliberada: quitar el `masterProductId` de un documento deshace
 * la fusión por completo. Es lo contrario de una migración destructiva.
 */

/** Cadena alias → maestro, con guarda anti-ciclos y anti-cadenas infinitas. */
export const resolverMaestro = (
    ingredientId: string,
    porId: Map<string, Ingredient>,
): string => {
    let actual = ingredientId;
    const visitados = new Set<string>([actual]);

    for (let saltos = 0; saltos < 10; saltos++) {
        const doc = porId.get(actual);
        const siguiente = doc?.masterProductId;
        if (!siguiente || siguiente === actual) return actual;
        // Un alias que apunta a un alias que apunta al primero dejaría el bucle
        // dando vueltas. Ante un ciclo, se devuelve el punto de partida: es
        // preferible no consolidar a colgarse.
        if (visitados.has(siguiente)) return ingredientId;
        visitados.add(siguiente);
        actual = siguiente;
    }
    return actual;
};

export const indicePorId = (ingredientes: Ingredient[]): Map<string, Ingredient> =>
    new Map(ingredientes.filter(i => i?.id).map(i => [i.id, i]));

/** Todos los alias que apuntan a un maestro dado (incluido él mismo). */
export const aliasDe = (
    maestroId: string,
    ingredientes: Ingredient[],
): string[] => {
    const porId = indicePorId(ingredientes);
    return ingredientes
        .filter(i => resolverMaestro(i.id, porId) === maestroId)
        .map(i => i.id);
};
