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

export const resolverProveedorDelPedido = (
    pedido: { providerId?: string; providerName?: string },
    ingrediente: { proveedor?: string } | undefined,
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

    // 2. Pedidos anteriores a M2: se deduce como se hacía entonces.
    const delIngrediente = ingrediente?.proveedor;
    if (delIngrediente && !SIN_PROVEEDOR.has(delIngrediente)) {
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
