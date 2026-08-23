import { Ingredient, StockItem } from '../../types';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

/**
 * Zonas de almacenamiento. **Punto 7.**
 *
 * ## Para qué sirve una zona
 *
 * El conteo físico ya existía y ya hacía lo importante —no sobrescribe, genera
 * un ajuste con signo— pero pedía contar **1.326 productos de una sentada**, y
 * eso no se hace: se cuenta la barra, luego el almacén, luego la cámara. Sin
 * zonas, un conteo se empieza y nunca se termina, y un conteo a medias es peor
 * que ninguno porque los ajustes que sí se guardaron parecen un inventario
 * completo.
 *
 * La zona no es una categoría. «MEZCAL» dice qué es; «BARRA» dice **dónde está**
 * y por tanto quién lo cuenta y cuándo.
 *
 * ## Sin zona no es un error
 *
 * La inmensa mayoría del catálogo no tendrá zona el primer día. Eso no es un
 * fallo que haya que señalar en rojo: es el estado normal antes de asignarlas.
 * Se agrupan bajo «Sin zona», visible, para que se puedan ir colocando — y para
 * que un conteo por zonas nunca esconda productos sin querer.
 */

export const SIN_ZONA = 'Sin zona';

/** Nombre de zona normalizado: mayúsculas de inicio, sin dobles espacios. */
export const normalizarZona = (z?: string | null): string => {
    const t = (z || '').replace(/\s+/g, ' ').trim();
    return t || SIN_ZONA;
};

/** Zonas sugeridas para empezar. No son una lista cerrada. */
export const ZONAS_SUGERIDAS = ['Barra', 'Almacén', 'Cámara', 'Congelador', 'Bodega', 'Office'];

/**
 * La zona de un producto, resolviendo el maestro.
 *
 * Una ficha fusionada guarda su zona en el documento que sea; preguntar por el
 * alias tiene que dar la misma respuesta que preguntar por el maestro, o el
 * mismo bote aparecería en dos zonas según por dónde se mire.
 */
export const zonaDe = (ingredientId: string, ingredientes: Ingredient[]): string => {
    const porId = indicePorId(ingredientes || []);
    const maestro = porId.get(resolverMaestro(ingredientId, porId));
    const propia = normalizarZona((maestro as any)?.zona);
    if (propia !== SIN_ZONA) return propia;
    // Si el maestro no la tiene, vale la de cualquiera de sus alias: la zona es
    // del producto físico, y da igual en qué documento se anotó.
    for (const i of ingredientes || []) {
        if (resolverMaestro(i.id, porId) === maestro?.id && normalizarZona((i as any).zona) !== SIN_ZONA) {
            return normalizarZona((i as any).zona);
        }
    }
    return SIN_ZONA;
};

/** Todas las zonas que existen, con «Sin zona» siempre al final. */
export const zonasDelCatalogo = (ingredientes: Ingredient[]): string[] => {
    const set = new Set<string>();
    for (const i of ingredientes || []) {
        const z = normalizarZona((i as any).zona);
        if (z !== SIN_ZONA) set.add(z);
    }
    return [...Array.from(set).sort((a, b) => a.localeCompare(b, 'es')), SIN_ZONA];
};

export interface ZonaConStock {
    zona: string;
    items: StockItem[];
    /** Valor de lo que hay en esa zona: cuánto capital vive ahí. */
    valor: number;
}

/**
 * Las existencias repartidas por zona, para poder contar de una en una.
 *
 * Las zonas vacías no se devuelven: una zona sin nada que contar en una lista de
 * conteo es una casilla que se abre, se mira y se cierra.
 */
export const stockPorZona = (
    stock: StockItem[],
    ingredientes: Ingredient[],
): ZonaConStock[] => {
    const porId = indicePorId(ingredientes || []);
    const zonaCache = new Map<string, string>();
    const zona = (id: string) => {
        let z = zonaCache.get(id);
        if (z === undefined) { z = zonaDe(id, ingredientes); zonaCache.set(id, z); }
        return z;
    };

    const m = new Map<string, ZonaConStock>();
    for (const s of stock || []) {
        if (!s?.ingredientId) continue;
        const z = zona(s.ingredientId);
        const g = m.get(z);
        if (g) { g.items.push(s); g.valor += s.totalValue || 0; }
        else m.set(z, { zona: z, items: [s], valor: s.totalValue || 0 });
    }

    return Array.from(m.values())
        .map(g => ({ ...g, valor: Math.round(g.valor * 100) / 100 }))
        .sort((a, b) => (a.zona === SIN_ZONA ? 1 : b.zona === SIN_ZONA ? -1 : a.zona.localeCompare(b.zona, 'es')));
};

/** Cuánto queda por contar en una zona, dado lo ya contado. */
export const progresoDeZona = (
    items: StockItem[],
    contados: Record<string, string>,
): { total: number; hechos: number; pendientes: number } => {
    const total = items.length;
    const hechos = items.filter(i => {
        const v = contados[i.ingredientId];
        return v !== undefined && v !== '';
    }).length;
    return { total, hechos, pendientes: total - hechos };
};
