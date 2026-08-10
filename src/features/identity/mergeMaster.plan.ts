import { Ingredient } from '../../types';

/**
 * Fusión de un producto duplicado con su maestro — **la parte pura**.
 *
 * Sin dependencias de Firestore a propósito: así el plan se puede razonar y
 * probar sin arrastrar el SDK, y queda claro qué decide y qué solo escribe.
 * La escritura vive en `mergeMaster.ts`.
 *
 * La fusión **no es un borrado: es un traslado**. Antes de marcar el alias hay
 * que llevar su oferta —precio, unidad, formato, proveedor— a `supplierData`
 * del maestro. Si no, se pierde: hoy el «N opc.» de Mercado se alimenta de los
 * documentos duplicados, no de `supplierData`, así que fusionar sin trasladar
 * dejaría el producto con una sola opción de compra.
 *
 * El alias **nunca se borra**. Se le pone `masterProductId` y punto: los
 * históricos siguen apuntando a él y se resuelven en lectura. Quitar el campo
 * deshace la fusión entera.
 */

export interface OfertaTrasladada {
    aliasId: string;
    claveProveedor: string;
    precio: number;
    unidad: string;
    formatoQty?: number;
    formatoUnidad?: string;
    /** El alias no declaraba proveedor: se guarda bajo una clave sintética. */
    sinProveedor: boolean;
}

export interface PlanFusion {
    maestroId: string;
    maestroNombre: string;
    alias: Array<{ id: string; nombre: string }>;
    ofertas: OfertaTrasladada[];
    /** Claves de `supplierData` del maestro que YA existen y se conservan. */
    conflictos: string[];
    advertencias: string[];
}

const num = (v: any): number => {
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    return typeof n === 'number' && isFinite(n) && n > 0 ? n : 0;
};

/** Proveedor bajo el que archivar la oferta de un alias. */
const claveProveedorDe = (ing: Ingredient): { clave: string; sintetica: boolean } => {
    const explicito = (ing as any).proveedor || ing.proveedores?.[0];
    if (explicito) return { clave: String(explicito), sintetica: false };
    // Sin proveedor declarado, la oferta se archiva igualmente: perderla sería
    // peor que guardarla bajo una clave que salta a la vista como incompleta.
    return { clave: `sin-proveedor:${ing.id}`, sintetica: true };
};

/**
 * Qué se va a escribir exactamente. **No escribe nada.** Lo que devuelve es lo
 * que hay que enseñar al usuario antes de pedirle confirmación.
 */
export const planificarFusion = (
    maestro: Ingredient,
    alias: Ingredient[],
): PlanFusion => {
    const ofertas: OfertaTrasladada[] = [];
    const conflictos: string[] = [];
    const advertencias: string[] = [];
    const yaEnMaestro = new Set(Object.keys(maestro.supplierData || {}));

    for (const a of alias) {
        // Si el alias ya tenía su propio mapa de ofertas, se trasladan todas.
        const propias = Object.entries(a.supplierData || {});
        if (propias.length > 0) {
            for (const [clave, d] of propias) {
                if (yaEnMaestro.has(clave)) { conflictos.push(clave); continue; }
                ofertas.push({
                    aliasId: a.id,
                    claveProveedor: clave,
                    precio: num((d as any)?.price),
                    unidad: (d as any)?.unit || a.unidad || '—',
                    formatoQty: (d as any)?.formatQty,
                    formatoUnidad: (d as any)?.formatUnit,
                    sinProveedor: false,
                });
            }
            continue;
        }

        // Si no, se reconstruye desde los campos heredados.
        const precio = num((a as any).precioCompra) || num(a.standardPrice);
        const { clave, sintetica } = claveProveedorDe(a);

        if (precio === 0) {
            advertencias.push(`«${a.nombre}» no tiene precio: se traslada el formato pero no habrá oferta comparable.`);
        }
        if (sintetica) {
            advertencias.push(`«${a.nombre}» no declara proveedor: su oferta se archiva bajo una clave provisional.`);
        }
        if (yaEnMaestro.has(clave)) {
            conflictos.push(clave);
            continue;
        }

        ofertas.push({
            aliasId: a.id,
            claveProveedor: clave,
            precio,
            unidad: (a as any).unidadCompra || a.unidad || '—',
            formatoQty: a.standardQuantity,
            formatoUnidad: a.standardUnit,
            sinProveedor: sintetica,
        });
    }

    if (conflictos.length > 0) {
        advertencias.push(
            `El maestro ya tiene oferta de ${conflictos.length} proveedor(es) que también trae el alias. `
            + 'Se conserva la del maestro: no se pisa un precio existente.',
        );
    }

    return {
        maestroId: maestro.id,
        maestroNombre: maestro.nombre,
        alias: alias.map(a => ({ id: a.id, nombre: a.nombre })),
        ofertas,
        conflictos,
        advertencias,
    };
};

