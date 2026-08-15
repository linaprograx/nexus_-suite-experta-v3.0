import { Ingredient } from '../../types';
import { proveedorDeIngrediente } from '../../features/orders/resolverProveedor';

/**
 * Las opciones de compra de un grupo de producto, y cuál manda.
 *
 * Un grupo puede tener varias fichas, y cada ficha varias ofertas en
 * `supplierData`. Una **opción** es la pareja ficha × proveedor: es lo que de
 * verdad se puede comprar.
 *
 * ## La política
 *
 * La que el fundador decidió el 2026-08-09, en `offerSelection.ts`: manda el
 * **preferente** aunque otro sea más barato —la preferencia no es solo precio,
 * es plazo, trato y fiabilidad—, y si hay algo más barato **se señala** sin
 * cambiar nada. Sin preferente, manda el más barato y se avisa.
 *
 * ## Lo que hay que mirar antes de decir «más barato»
 *
 * **Dos precios de formatos distintos no se comparan.** En el catálogo real
 * conviven opciones a «€68,50 / 0.700 L» y a «€77,80 / UND»: decir que una es
 * más barata que la otra sería inventarse una comparación. Aquí solo se compite
 * por **precio por unidad base** (`standardPrice`), que es lo único comparable.
 * Si alguna opción no lo tiene, se listan todas y **no se declara ganador por
 * precio** — decirlo mal es peor que no decirlo.
 */

export interface OpcionCompra {
    fichaId: string;
    fichaNombre: string;
    proveedorId: string | null;
    /** Precio del envase, tal como se compra. */
    precio: number;
    /** Formato del envase, para que el precio se entienda. */
    formato: string;
    /** Precio por unidad base. Es lo ÚNICO comparable entre formatos. */
    precioBase: number | null;
    unidadBase?: string;
    esPreferente: boolean;
}

export type MotivoEleccion = 'preferente' | 'mas-barato' | 'sin-comparar' | 'sin-ofertas';

export interface OfertaDelGrupo {
    opciones: OpcionCompra[];
    elegida: OpcionCompra | null;
    motivo: MotivoEleccion;
    /** Solo cuando manda un preferente y existe algo más barato de verdad. */
    alternativaMasBarata?: { opcion: OpcionCompra; ahorro: number };
    /** Convendría configurar un proveedor preferente. */
    faltaPreferente: boolean;
    /** Los formatos no permiten comparar precios entre sí. */
    formatosDispares: boolean;
}

const num = (v: any): number => {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : 0;
};

const formatoDe = (ing: Ingredient): string => {
    const q = num(ing.standardQuantity);
    if (q > 0 && ing.standardUnit) return `${q} ${ing.standardUnit}`;
    return (ing as any).unidadCompra || ing.unidad || '—';
};

/** Aplana un grupo en opciones de compra reales. */
export const opcionesDelGrupo = (entries: Ingredient[]): OfertaDelGrupo => {
    const opciones: OpcionCompra[] = [];

    for (const ing of entries) {
        if (!ing?.id) continue;
        const precioBase = num(ing.standardPrice) || null;
        const base = {
            fichaId: ing.id,
            fichaNombre: ing.nombre || 'Sin nombre',
            formato: formatoDe(ing),
            precioBase,
            unidadBase: ing.standardUnit,
        };

        const ofertas = Object.entries((ing as any).supplierData || {})
            .map(([proveedorId, d]: [string, any]) => ({ proveedorId, precio: num(d?.price) }))
            .filter(o => o.precio > 0);

        if (ofertas.length > 0) {
            for (const o of ofertas) {
                opciones.push({
                    ...base,
                    proveedorId: o.proveedorId,
                    precio: o.precio,
                    esPreferente: !!ing.proveedorPreferente && o.proveedorId === ing.proveedorPreferente,
                });
            }
            continue;
        }

        // Sin ofertas por proveedor, la ficha misma es una opción: su precio de
        // compra y el proveedor que le corresponda por la escalera de siempre.
        const precio = num((ing as any).precioCompra);
        if (precio > 0) {
            const proveedorId = proveedorDeIngrediente(ing as any) ?? null;
            opciones.push({
                ...base,
                proveedorId,
                precio,
                esPreferente: !!ing.proveedorPreferente && proveedorId === ing.proveedorPreferente,
            });
        }
    }

    if (opciones.length === 0) {
        return { opciones: [], elegida: null, motivo: 'sin-ofertas', faltaPreferente: false, formatosDispares: false };
    }

    const formatos = new Set(opciones.map(o => o.formato));
    const comparables = opciones.filter(o => o.precioBase !== null);
    // Comparables solo si TODAS lo son y comparten unidad base: mezclar ml con
    // und daría un «más barato» sin sentido.
    const unidades = new Set(comparables.map(o => o.unidadBase));
    const sePuedeComparar = comparables.length === opciones.length && unidades.size === 1;

    const preferente = opciones.find(o => o.esPreferente);
    if (preferente) {
        const masBarata = sePuedeComparar
            ? comparables.reduce((a, b) => (b.precioBase! < a.precioBase! ? b : a))
            : null;
        const hayMejor = masBarata && masBarata !== preferente && masBarata.precioBase! < (preferente.precioBase ?? Infinity);
        return {
            opciones,
            elegida: preferente,
            motivo: 'preferente',
            faltaPreferente: false,
            formatosDispares: formatos.size > 1,
            ...(hayMejor ? {
                alternativaMasBarata: {
                    opcion: masBarata!,
                    ahorro: (preferente.precioBase ?? 0) - masBarata!.precioBase!,
                },
            } : {}),
        };
    }

    if (!sePuedeComparar) {
        // Se listan todas y no se corona a ninguna. Sin unidades comparables,
        // «el más barato» sería una afirmación inventada.
        return {
            opciones,
            elegida: opciones.length === 1 ? opciones[0] : null,
            motivo: opciones.length === 1 ? 'mas-barato' : 'sin-comparar',
            faltaPreferente: opciones.length > 1,
            formatosDispares: formatos.size > 1,
        };
    }

    const masBarata = comparables.reduce((a, b) => (b.precioBase! < a.precioBase! ? b : a));
    return {
        opciones,
        elegida: masBarata,
        motivo: 'mas-barato',
        faltaPreferente: opciones.length > 1,
        formatosDispares: formatos.size > 1,
    };
};
