import { Firestore, doc, updateDoc, deleteField } from 'firebase/firestore';

/**
 * Fijar (o quitar) el **proveedor preferente** de un producto. Punto 19.
 *
 * ## Por qué faltaba esto
 *
 * `proveedorPreferente` se leía en seis sitios —`opcionesDeCompra` para coronar
 * la oferta que manda, la escalera de M2, el libro de escandallos— y **no se
 * escribía en ninguno**. Toda la maquinaria del preferente existía y nadie
 * podía encenderla: la política estaba implementada y era inalcanzable.
 *
 * ## Dos decisiones
 *
 * **La preferencia es del producto, no del negocio.** Se compra el Campari a
 * uno y el limón a otro; un «proveedor por defecto» global no sirve para
 * decidir una compra concreta. Por eso vive en la ficha y no en los ajustes.
 *
 * **Se puede quitar.** Sin una forma de deshacerlo, marcar un preferente por
 * error deja el producto atado a él para siempre, y encima en silencio: la
 * oferta más barata seguiría apareciendo señalada como alternativa sin que
 * nadie entienda por qué no gana.
 */
export const fijarProveedorPreferente = async (
    db: Firestore,
    appId: string,
    userId: string,
    fichaId: string,
    proveedorId: string | null,
): Promise<void> => {
    const ruta = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    await updateDoc(doc(db, ruta, fichaId), {
        // `deleteField` y no cadena vacía: un campo ausente significa «no hay
        // preferente», y una cadena vacía es un id que no existe. Guardar la
        // segunda haría que la comparación con el id del proveedor fallara para
        // siempre sin que se vea de dónde sale.
        proveedorPreferente: proveedorId || deleteField(),
    });
};
