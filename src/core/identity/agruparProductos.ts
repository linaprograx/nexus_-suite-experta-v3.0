import { Ingredient } from '../../types';
import { tokensFuertes } from '../../features/identity/duplicateCandidates';

/**
 * Agrupa fichas que son **el mismo producto**. Buscar es otro trabajo.
 *
 * ## Lo que sustituye, y por qué
 *
 * Mercado agrupaba con un emparejador propio que se conformaba con **una sola
 * palabra fuerte en común**, comparando además cada ficha únicamente contra el
 * nombre de la primera del grupo —la comprobación transitiva estaba omitida «por
 * rendimiento»—, lo que hacía que el resultado dependiera del orden.
 *
 * El efecto real, medido sobre el catálogo del fundador:
 *
 *     AGUERRIDO, ANTONIO CUPREATA
 *     AGUERRIDO, BENIGNO CUPREATA CAPON   →  los tres en UN grupo
 *     AGUERRIDO, TOMAS CUPREATA
 *
 * Son tres mezcales distintos —Antonio, Benigno y Tomás— y Mercado enseñaba
 * uno. Los otros dos existían, tenían su precio y su proveedor, y eran
 * invisibles; hasta el punto de que la alerta de stock crítico apuntaba a un
 * producto que su propio buscador no mostraba.
 *
 * ## La regla
 *
 * La que el fundador ya aprobó para el detector de duplicados: **conjunto
 * IDÉNTICO de palabras fuertes**. «ABSOLUT VODKA» y «VODKA ABSOLUT» son el
 * mismo producto; «AGUERRIDO ANTONIO» y «AGUERRIDO BENIGNO» no lo son, porque
 * uno tiene una palabra que el otro no.
 *
 * Es deliberadamente conservadora: **prefiere separar de más a juntar de
 * menos**. Juntar dos productos distintos los esconde y falsea la comparativa
 * de precios; separar dos fichas del mismo producto solo deja una fila de más,
 * que además el informe de duplicados propone fusionar.
 *
 * Sin palabras fuertes —un nombre hecho solo de genéricos— la ficha va sola: no
 * hay identidad que reclamar, y agrupar por familia metería medio catálogo en
 * un cajón.
 */

export interface GrupoProducto {
    /** El id de la primera ficha del grupo: lo que usa la selección y el detalle. */
    id: string;
    nombre: string;
    categoria: string;
    /** Todas las fichas del grupo, en orden de aparición. */
    entries: Ingredient[];
    minPrice: number;
    maxPrice: number;
}

const precio = (i: Ingredient): number => {
    const p = Number((i as any).precioCompra);
    return isFinite(p) && p > 0 ? p : 0;
};

export const claveDeProducto = (nombre: string): string =>
    tokensFuertes(nombre).slice().sort().join('|');

export const agruparProductos = (items: Ingredient[]): GrupoProducto[] => {
    const porClave = new Map<string, GrupoProducto>();
    const orden: GrupoProducto[] = [];

    for (const ing of items) {
        if (!ing?.id) continue;

        const nucleo = claveDeProducto(ing.nombre || '');
        // Sin núcleo no se agrupa: la ficha es su propio grupo.
        const clave = nucleo ? `n:${nucleo}` : `id:${ing.id}`;

        const existente = porClave.get(clave);
        if (existente) {
            existente.entries.push(ing);
            const p = precio(ing);
            if (p > 0) {
                existente.minPrice = existente.minPrice > 0 ? Math.min(existente.minPrice, p) : p;
                existente.maxPrice = Math.max(existente.maxPrice, p);
            }
            continue;
        }

        const p = precio(ing);
        const grupo: GrupoProducto = {
            id: ing.id,
            nombre: ing.nombre || 'Sin nombre',
            categoria: ing.categoria || 'General',
            entries: [ing],
            minPrice: p,
            maxPrice: p,
        };
        porClave.set(clave, grupo);
        orden.push(grupo);
    }

    return orden;
};
