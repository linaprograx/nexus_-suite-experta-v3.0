import { Firestore, doc, updateDoc, deleteField } from 'firebase/firestore';

/**
 * Asignar (o quitar) la zona de almacenamiento de un producto. **Punto 7.**
 *
 * Existe por la misma razón que `fijarProveedorPreferente`: un campo que se lee
 * y nadie escribe es una función que no existe. `proveedorPreferente` estuvo
 * así seis lecturas y ninguna escritura, y el resultado era una política
 * implementada e inalcanzable.
 *
 * Se guarda con `deleteField` al vaciarla, no con cadena vacía: ausente
 * significa «todavía sin colocar», que es un estado normal, mientras que una
 * cadena vacía sería una zona con nombre vacío — y aparecería como un grupo
 * fantasma en cualquier agrupación por zona.
 */
export const fijarZonaDeProducto = async (
    db: Firestore,
    appId: string,
    userId: string,
    fichaId: string,
    zona: string | null,
): Promise<void> => {
    const ruta = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const limpia = (zona || '').replace(/\s+/g, ' ').trim();
    await updateDoc(doc(db, ruta, fichaId), {
        zona: limpia ? limpia : deleteField(),
    });
};
