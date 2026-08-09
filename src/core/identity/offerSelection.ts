import { Ingredient } from '../../types';

/**
 * Qué oferta manda cuando un producto maestro tiene varias.
 *
 * **Política decidida por el fundador el 2026-08-09:**
 *
 * 1. Si hay **proveedor preferente** configurado, manda su precio — aunque otro
 *    sea más barato. La preferencia no es solo precio: es plazo, trato,
 *    fiabilidad, mínimo de pedido.
 * 2. Y si otro proveedor es más barato, **se señala**, sin cambiar nada.
 * 3. Si **no** hay preferente, manda el **más barato**, y se avisa de que
 *    conviene configurar uno.
 *
 * Lo que sustituye: hoy `getAnyPackPrice` cae en `Object.values(supplierData)[0]`
 * — la primera entrada del objeto, que es un accidente del orden de las claves.
 *
 * **Fase B: esto todavía no lo consume nadie.** El motor de coste sigue
 * exactamente igual. Conectarlo es Fase D, cuando los maestros tengan de verdad
 * varias ofertas; hasta entonces no hay nada entre lo que elegir, y cambiar el
 * motor ahora sería asumir riesgo a cambio de nada.
 */

export interface OfertaElegida {
    /** `null` cuando el producto no tiene ninguna oferta con precio. */
    proveedorId: string | null;
    precio: number;
    motivo: 'preferente' | 'mas-barato' | 'sin-ofertas';
    /** Hay otro proveedor más barato que el elegido. */
    alternativaMasBarata?: { proveedorId: string; precio: number; ahorro: number };
    /** El usuario debería configurar un proveedor preferente. */
    faltaPreferente: boolean;
}

export const elegirOferta = (ing: Ingredient): OfertaElegida => {
    const ofertas = Object.entries(ing.supplierData || {})
        .map(([proveedorId, d]) => ({ proveedorId, precio: Number(d?.price) || 0 }))
        .filter(o => o.precio > 0);

    if (ofertas.length === 0) {
        return { proveedorId: null, precio: 0, motivo: 'sin-ofertas', faltaPreferente: false };
    }

    const masBarata = ofertas.reduce((a, b) => (b.precio < a.precio ? b : a));
    const preferido = ing.proveedorPreferente
        ? ofertas.find(o => o.proveedorId === ing.proveedorPreferente)
        : undefined;

    // Con preferente configurado manda él, cueste lo que cueste; solo se avisa.
    if (preferido) {
        const hayMejor = masBarata.precio < preferido.precio;
        return {
            proveedorId: preferido.proveedorId,
            precio: preferido.precio,
            motivo: 'preferente',
            faltaPreferente: false,
            ...(hayMejor ? {
                alternativaMasBarata: {
                    proveedorId: masBarata.proveedorId,
                    precio: masBarata.precio,
                    ahorro: preferido.precio - masBarata.precio,
                },
            } : {}),
        };
    }

    // Sin preferente (o el preferente ya no ofrece este producto): el más barato.
    return {
        proveedorId: masBarata.proveedorId,
        precio: masBarata.precio,
        motivo: 'mas-barato',
        faltaPreferente: true,
    };
};
