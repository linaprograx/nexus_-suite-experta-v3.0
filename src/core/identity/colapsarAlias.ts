import { Ingredient } from '../../types';
import { resolverMaestro, indicePorId } from './masterProduct';

/**
 * Mercado · Fase 1 — los alias ya fusionados dejan de ser fila propia.
 *
 * Cuando el fundador fusiona dos fichas, la oferta del alias se traslada a
 * `supplierData` del maestro y el alias recibe `masterProductId`. Pero Mercado
 * nunca leyó ese campo: el alias seguía apareciendo como un producto más, así
 * que **una decisión ya tomada no se veía por ninguna parte**.
 *
 * Esto no es parecido de nombres ni heurística: es leer una decisión humana
 * explícita. Y se deshace igual que la fusión, quitando el campo.
 *
 * ## Lo que sí tiene trampa
 *
 * **Buscar.** Si escribes el nombre del alias, el filtro encuentra el alias
 * pero no necesariamente el maestro. Colapsar sin más dejaría la búsqueda
 * vacía: habrías escrito un nombre que existe y no saldría nada. Por eso el
 * alias no se descarta, **se sustituye** por su maestro.
 *
 * **Maestros que ya no existen.** `resolverMaestro` sigue la cadena y devuelve
 * el último id al que apunta, exista o no ese documento. Si el maestro se
 * borró, sustituir el alias por él haría **desaparecer la ficha de la
 * pantalla**. Aquí eso se comprueba: si el maestro no está en el catálogo, el
 * alias se queda tal cual, visible.
 */

export interface ResultadoColapso {
    /** Las filas a pintar: maestros y fichas sueltas, sin repetir. */
    filas: Ingredient[];
    /** Cuántas fichas se plegaron dentro de su maestro. */
    colapsados: number;
    /** Alias cuyo maestro ya no existe. Se dejan visibles; conviene saberlo. */
    huerfanos: string[];
}

export const colapsarAlias = (
    visibles: Ingredient[],
    catalogo: Ingredient[],
): ResultadoColapso => {
    const porId = indicePorId(catalogo);
    const filas: Ingredient[] = [];
    const yaPuesto = new Set<string>();
    const huerfanos: string[] = [];
    let colapsados = 0;

    for (const ing of visibles) {
        if (!ing?.id) continue;

        const maestroId = resolverMaestro(ing.id, porId);
        const maestro = maestroId !== ing.id ? porId.get(maestroId) : undefined;

        if (maestroId !== ing.id && !maestro) {
            // Apunta a un documento que no está. Mejor una ficha de más que una
            // ficha desaparecida.
            huerfanos.push(ing.id);
        }

        const fila = maestro ?? ing;
        if (maestro) colapsados++;

        // El orden lo marca la primera aparición: si el maestro ya estaba en la
        // lista, el alias solo desaparece; no reordena nada.
        if (yaPuesto.has(fila.id)) continue;
        yaPuesto.add(fila.id);
        filas.push(fila);
    }

    return { filas, colapsados, huerfanos };
};
