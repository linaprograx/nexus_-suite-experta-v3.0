import { Ingredient } from '../../types';
import { ofertasDeProducto } from '../ofertas/oferta';

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

/**
 * Aplana un grupo en opciones de compra reales.
 *
 * **Las opciones las construye `core/ofertas/oferta.ts`, y no este fichero.**
 * Antes se montaban aquí, y con dos defectos: el precio por unidad base salía
 * de la ficha *antes* del bucle y se copiaba a todas sus ofertas, así que al
 * coronar «mejor precio» se comparaban números idénticos y ganaba la primera de
 * la lista. Una corona arbitraria se lee como una recomendación, que es peor que
 * no decir nada. Y el mismo proveedor no podía tener dos formatos.
 *
 * La decisión —preferente, más barato, o no coronar a nadie— **no ha cambiado**:
 * es la de siempre, ahora aplicada sobre números que significan algo.
 */
export const opcionesDelGrupo = (entries: Ingredient[]): OfertaDelGrupo => {
    const opciones: OpcionCompra[] = ofertasDeProducto(entries || []).map(o => ({
        fichaId: o.fichaId,
        fichaNombre: o.fichaNombre,
        proveedorId: o.proveedorId,
        precio: o.precio,
        formato: o.formatoLegible,
        precioBase: o.precioPorBase,
        unidadBase: o.formatoUnidad,
        esPreferente: o.esPreferente,
    }));

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
