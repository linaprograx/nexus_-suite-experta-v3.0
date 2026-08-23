import { PurchaseEvent } from '../../types';

/**
 * **I1 · La mezcla de unidades en las compras.** Punto 9 del plan.
 *
 * ## El defecto, tal cual sigue en el código
 *
 * `buildStockFromPurchases` (`utils/stockUtils.ts:31`) hace:
 *
 * ```
 * const newQuantity = existing.quantityAvailable + purchase.quantity;
 * ```
 *
 * Suma `quantity` **sin mirar `unit`**, y la unidad del ítem se fija con la
 * **primera** compra que se procesa y no se vuelve a mirar. Si un producto
 * entró una vez en botellas y otra en litros, el resultado es un número sin
 * significado con la etiqueta de la primera.
 *
 * De ahí salen los `10813.000 L` de raicilla que se ven en producción: nadie
 * tiene diez mil litros, ese texto **es el campo `unit`** llegado sucio de una
 * importación.
 *
 * ## Qué hace este módulo, y qué NO
 *
 * **Solo mira.** No escribe, no propone conversiones y no arregla nada. Su
 * único trabajo es responder con números a la pregunta que hay que contestar
 * antes de tocar el motor de existencias: **¿a cuántos productos les afecta
 * esto, y cuánto dinero hay detrás?**
 *
 * No convierte porque **no siempre se puede**: «3 BJ» y «0,7 L» del mismo
 * producto no tienen factor conocido, y un factor inventado produciría un
 * stock creíble y falso, que es peor que uno visiblemente absurdo. Lo que no
 * se puede determinar sale marcado y lo decide una persona.
 */

/** Dos escrituras de lo mismo no son dos unidades. `PZ` y `PZA` lo son. */
export const normalizarUnidad = (u: string | null | undefined): string =>
    (u || '')
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .toLowerCase().trim()
        .replace(/\.$/, '')
        .replace(/^(uds?|unds?|und|unidades?|pzas?|pz|piezas?)$/, 'und')
        .replace(/^(lt|lts|litros?)$/, 'l')
        .replace(/^(kgs?|kilos?|kilogramos?)$/, 'kg')
        .replace(/^(grs?|gramos?)$/, 'g')
        .replace(/^(mls?|mililitros?)$/, 'ml');

export interface CompraDeProducto {
    unidad: string;
    unidadCruda: string;
    compras: number;
    cantidad: number;
    importe: number;
    primera: Date;
    ultima: Date;
}

export interface ProductoMezclado {
    ingredientId: string;
    nombre: string;
    /** Las unidades distintas en las que ha entrado, de más a menos gasto. */
    unidades: CompraDeProducto[];
    /** La que hoy gana: la de la primera compra procesada. */
    unidadQueMandaHoy: string;
    /** Suma de `quantity` que hoy se enseña como si fuera una sola unidad. */
    cantidadSumadaHoy: number;
    importeTotal: number;
    /** El texto de unidad no es una unidad: es basura de importación. */
    unidadSospechosa: boolean;
}

export interface InformeMezcla {
    productosConCompras: number;
    productosMezclados: ProductoMezclado[];
    /** Dinero que pasa por productos cuyo stock hoy no significa nada. */
    importeAfectado: number;
    /** Todas las unidades que existen en las compras, con su peso. */
    unidadesDelCatalogo: Array<{ unidad: string; productos: number; importe: number }>;
    /** Textos que aparecen como unidad y no lo son. */
    sospechosas: string[];
}

const fechaDe = (p: PurchaseEvent): Date => {
    const d: any = (p as any).createdAt;
    if (d instanceof Date) return d;
    if (d?.toDate) return d.toDate();
    const n = new Date(d);
    return isNaN(n.getTime()) ? new Date(0) : n;
};

const importeDe = (p: PurchaseEvent): number => {
    const t = Number(p.totalCost);
    if (isFinite(t) && t > 0) return t;
    const u = Number(p.unitPrice), q = Number(p.quantity);
    return isFinite(u) && isFinite(q) && u > 0 && q > 0 ? u * q : 0;
};

/**
 * Una unidad de verdad es corta y no lleva números.
 *
 * `0.700 L` **no es una unidad**: es un formato metido en el campo equivocado,
 * y es exactamente lo que produce los `10813.000 L`. Se marca en vez de
 * intentar interpretarlo: interpretarlo es lo que creó el problema.
 */
export const esUnidadSospechosa = (u: string): boolean => {
    const n = normalizarUnidad(u);
    if (!n) return true;
    if (/\d/.test(n)) return true;
    return n.length > 6;
};

export const informeDeMezcla = (compras: PurchaseEvent[]): InformeMezcla => {
    const porProducto = new Map<string, { nombre: string; orden: string[]; porUnidad: Map<string, CompraDeProducto> }>();

    for (const c of compras || []) {
        if (!c?.ingredientId) continue;
        const cantidad = Number(c.quantity);
        if (!isFinite(cantidad) || cantidad <= 0) continue;

        const clave = normalizarUnidad(c.unit);
        let p = porProducto.get(c.ingredientId);
        if (!p) {
            p = { nombre: c.ingredientName || 'Sin nombre', orden: [], porUnidad: new Map() };
            porProducto.set(c.ingredientId, p);
        }
        if (!p.orden.includes(clave)) p.orden.push(clave);

        const fecha = fechaDe(c);
        const previa = p.porUnidad.get(clave);
        if (previa) {
            previa.compras++;
            previa.cantidad += cantidad;
            previa.importe += importeDe(c);
            if (fecha < previa.primera) previa.primera = fecha;
            if (fecha > previa.ultima) previa.ultima = fecha;
        } else {
            p.porUnidad.set(clave, {
                unidad: clave, unidadCruda: c.unit || '',
                compras: 1, cantidad, importe: importeDe(c),
                primera: fecha, ultima: fecha,
            });
        }
    }

    const mezclados: ProductoMezclado[] = [];
    const porUnidadGlobal = new Map<string, { productos: number; importe: number }>();
    const sospechosas = new Set<string>();
    let importeAfectado = 0;

    for (const [id, p] of porProducto.entries()) {
        const unidades = [...p.porUnidad.values()].sort((a, b) => b.importe - a.importe);
        for (const u of unidades) {
            const g = porUnidadGlobal.get(u.unidad) || { productos: 0, importe: 0 };
            g.productos++; g.importe += u.importe;
            porUnidadGlobal.set(u.unidad, g);
            if (esUnidadSospechosa(u.unidad)) sospechosas.add(u.unidadCruda || u.unidad);
        }

        if (unidades.length <= 1) continue;

        const importeTotal = unidades.reduce((n, u) => n + u.importe, 0);
        importeAfectado += importeTotal;
        mezclados.push({
            ingredientId: id,
            nombre: p.nombre,
            unidades,
            // La primera que se vio al recorrer: es la que `buildStockFromPurchases`
            // deja pegada al ítem para siempre.
            unidadQueMandaHoy: p.orden[0],
            cantidadSumadaHoy: unidades.reduce((n, u) => n + u.cantidad, 0),
            importeTotal,
            unidadSospechosa: unidades.some(u => esUnidadSospechosa(u.unidad)),
        });
    }

    return {
        productosConCompras: porProducto.size,
        productosMezclados: mezclados.sort((a, b) => b.importeTotal - a.importeTotal),
        importeAfectado,
        unidadesDelCatalogo: [...porUnidadGlobal.entries()]
            .map(([unidad, g]) => ({ unidad, ...g }))
            .sort((a, b) => b.importe - a.importe),
        sospechosas: [...sospechosas].sort(),
    };
};

/**
 * **La unidad con la que se guarda una compra.** Normalización en la entrada,
 * que es lo que I1 pedía y no existía.
 *
 * `packNormalization.ts` es la fuente única de formatos desde hace tiempo, pero
 * **no se aplicaba al guardar**: se normalizaba al calcular costes y no al
 * escribir, así que el dato sucio entraba en la base y cada pantalla lo
 * interpretaba a su manera. De ahí los 79 textos distintos en un campo que solo
 * admite ocho valores.
 *
 * La regla es corta: **si el texto lleva un número, es un formato y no una
 * unidad.** El formato ya vive en la ficha (`standardQuantity`), así que aquí
 * se descarta y se guarda la unidad de recuento, que es lo que la cantidad
 * cuenta de verdad: envases.
 *
 * No toca nada de lo ya escrito. Solo impide que crezca.
 */
export const unidadParaGuardar = (
    texto: string | null | undefined,
    respaldo: string = 'und',
): string => {
    const n = normalizarUnidad(texto);
    if (!n) return respaldo;
    if (esUnidadSospechosa(n)) return respaldo;
    // `un` y `und` son la misma; el catálogo real tiene las dos.
    return n === 'un' ? 'und' : n;
};
