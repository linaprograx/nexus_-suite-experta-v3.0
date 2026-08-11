/**
 * M2 — A quién se le atribuye una compra al recibir un pedido.
 *
 * Vive fuera del componente para poder probarse: es una regla sobre datos, y
 * de ella depende que el historial de compras diga la verdad.
 *
 * ## Lo que arregla
 *
 * Antes se deducía del ingrediente en el momento de recibir, o sea que se
 * respondía a «¿a quién le compras esto HOY?» cuando la pregunta era «¿a quién
 * le compraste ESTO?». Si entre pedir y recibir le cambiabas el proveedor por
 * defecto al ingrediente, la compra se apuntaba al que no era, y con ella el
 * precio. Es lo que impedía agrupar Inventario por proveedor con confianza.
 */

export interface ProveedorResuelto {
    providerId: string;
    providerName: string;
    /** De dónde salió. Útil para explicar el dato, y para las pruebas. */
    origen: 'pedido' | 'ingrediente' | 'ninguno';
}

/** Centinelas de «sin proveedor» que conviven en el código. Ninguno es un id real. */
const SIN_PROVEEDOR = new Set(['', 'unknown', 'generic_provider']);

const valido = (id?: string | null): id is string =>
    typeof id === 'string' && id.trim() !== '' && !SIN_PROVEEDOR.has(id);

/**
 * A quién se le compra un producto, **según la ficha**.
 *
 * Un único sitio para esta pregunta. Antes cada parte miraba donde le parecía:
 * la hoja de reposición leía `ing.proveedor`, que está marcado `@deprecated`
 * desde que existen `proveedores[]` y `proveedorPreferente`. Como el catálogo
 * real ya usa el modelo nuevo, ese campo viejo venía vacío y **todo el
 * inventario caía en «Sin Proveedor Asignado»**: la agrupación por proveedor
 * no agrupaba nada.
 *
 * El orden va de lo más explícito a lo más circunstancial:
 *   1. el preferente, que es una decisión tomada a mano;
 *   2. el primero de los asignados;
 *   3. aquel del que consta una oferta real en `supplierData`;
 *   4. el campo antiguo, que sigue vivo en fichas que nadie ha vuelto a tocar.
 */
export const proveedorDeIngrediente = (ing?: {
    proveedorPreferente?: string;
    proveedores?: string[];
    supplierData?: Record<string, unknown>;
    proveedor?: string;
}): string | undefined => {
    if (!ing) return undefined;
    if (valido(ing.proveedorPreferente)) return ing.proveedorPreferente;

    const asignado = (ing.proveedores || []).find(valido);
    if (asignado) return asignado;

    const conOferta = Object.keys(ing.supplierData || {}).find(valido);
    if (conOferta) return conOferta;

    return valido(ing.proveedor) ? ing.proveedor : undefined;
};

export const resolverProveedorDelPedido = (
    pedido: { providerId?: string; providerName?: string },
    ingrediente: Parameters<typeof proveedorDeIngrediente>[0],
    suppliers: Array<{ id: string; name: string }>,
): ProveedorResuelto => {
    const nombreDe = (id: string) => suppliers.find(s => s.id === id)?.name;

    // 1. Lo que se registró al hacer el pedido. Es el dato, no una deducción.
    const delPedido = pedido.providerId;
    if (delPedido && !SIN_PROVEEDOR.has(delPedido)) {
        return {
            providerId: delPedido,
            // El nombre guardado sirve de respaldo por si el proveedor ya no
            // está en la lista: un proveedor dado de baja no debe borrar de
            // quién era la compra.
            providerName: nombreDe(delPedido) || pedido.providerName || 'Proveedor Desconocido',
            origen: 'pedido',
        };
    }

    // 2. Pedidos anteriores a M2: no traen proveedor, así que se deduce de la
    //    ficha. Por la misma escalera que usa la hoja de reposición, para que
    //    no digan cosas distintas sobre el mismo producto.
    const delIngrediente = proveedorDeIngrediente(ingrediente);
    if (delIngrediente) {
        return {
            providerId: delIngrediente,
            providerName: nombreDe(delIngrediente) || 'Proveedor Desconocido',
            origen: 'ingrediente',
        };
    }

    return { providerId: 'generic_provider', providerName: 'Proveedor Desconocido', origen: 'ninguno' };
};

/**
 * Precio por unidad de una línea de pedido.
 *
 * Dividir entre cero da `Infinity`, y el `|| 0` que había no lo atrapa —solo
 * atrapa `NaN`—, así que ese `Infinity` se escribía en la compra y de ahí
 * pasaba a la valoración del almacén.
 */
export const precioUnitarioDeLinea = (costeEstimado: number, cantidad: number): number => {
    if (!(cantidad > 0)) return 0;
    const p = costeEstimado / cantidad;
    return Number.isFinite(p) && p > 0 ? p : 0;
};
