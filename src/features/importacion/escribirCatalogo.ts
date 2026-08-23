import { Firestore, collection, doc } from 'firebase/firestore';
import { EscrituraPorLotes } from '../../services/firestore/escrituraPorLotes';
import { PlanImportacion } from '../../core/importacion/planDeImportacion';

/**
 * Ejecuta un plan de importación. **Solo añade.**
 *
 * ## Lo que escribe, y lo que NO
 *
 * · A las fichas existentes les añade **una oferta** en `supplierData`, bajo la
 *   clave `proveedor::formato`. **No toca su `precioCompra`**, que es el que
 *   decide el coste de las recetas. Un catálogo de proveedor es lo que él pide,
 *   no lo que tú pagas.
 * · Los productos nuevos nacen con `pendienteRevision`, que ya existe y ya los
 *   mantiene fuera de los automatismos hasta que alguien los mire.
 * · **No borra nada. No fusiona nada.**
 *
 * ## Por qué en lotes
 *
 * Firestore rechaza un `writeBatch` de más de 500 operaciones **entero**: no
 * escribe la mitad, no escribe nada. Una tarifa de proveedor pasa de 500 líneas
 * con facilidad, así que se trocea. `EscrituraPorLotes` ya resuelve esto y sabe
 * decir cuántas confirmó si algo falla a mitad.
 */
export const escribirImportacion = async (
    db: Firestore,
    appId: string,
    userId: string,
    plan: PlanImportacion,
): Promise<{ ofertas: number; nuevas: number }> => {
    const ruta = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const lotes = new EscrituraPorLotes(db);

    for (const o of plan.ofertas) {
        await lotes.update(doc(db, ruta, o.fichaId), {
            [`supplierData.${o.clave}`]: {
                price: o.price,
                unit: o.unit,
                formatQty: o.formatQty,
                formatUnit: o.formatUnit,
                lastUpdated: Date.now(),
                origenImportacion: plan.proveedorId,
            },
        });
    }

    for (const n of plan.nuevas) {
        const ref = doc(collection(db, ruta));
        await lotes.set(ref, {
            nombre: n.nombre,
            categoria: n.categoria,
            unidad: n.unidad,
            unidadCompra: n.unidad,
            standardUnit: n.standardUnit,
            standardQuantity: n.standardQuantity,
            precioCompra: n.precioCompra,
            costo: 0,
            // Nadie ha mirado esta ficha: tiene el nombre y el precio del
            // proveedor y nada más. Es la diferencia entre un catálogo que
            // crece y uno que engorda.
            pendienteRevision: true,
            proveedores: [plan.proveedorId],
            supplierData: {
                [n.clave]: {
                    price: n.price,
                    unit: n.standardUnit,
                    formatQty: n.standardQuantity,
                    formatUnit: n.standardUnit,
                    lastUpdated: Date.now(),
                    origenImportacion: plan.proveedorId,
                },
            },
            createdAt: Date.now(),
        });
    }

    await lotes.cerrar();
    return { ofertas: plan.ofertas.length, nuevas: plan.nuevas.length };
};
