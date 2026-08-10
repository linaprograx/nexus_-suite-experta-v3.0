import { Firestore, doc, writeBatch, deleteField } from 'firebase/firestore';
import { PlanFusion } from './mergeMaster.plan';

export * from './mergeMaster.plan';

/**
 * Ejecuta el plan. Dos escrituras y ningún borrado:
 *   1. `supplierData` del maestro recibe las ofertas trasladadas.
 *   2. cada alias recibe `masterProductId`.
 */
export const ejecutarFusion = async (
    db: Firestore,
    appId: string,
    userId: string,
    plan: PlanFusion,
): Promise<{ ofertasTrasladadas: number; aliasMarcados: number }> => {
    const colPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const batch = writeBatch(db);

    if (plan.ofertas.length > 0) {
        const supplierData: Record<string, any> = {};
        for (const o of plan.ofertas) {
            supplierData[`supplierData.${o.claveProveedor}`] = {
                price: o.precio,
                unit: o.unidad,
                ...(o.formatoQty ? { formatQty: o.formatoQty } : {}),
                ...(o.formatoUnidad ? { formatUnit: o.formatoUnidad } : {}),
                lastUpdated: Date.now(),
                // De dónde salió, para poder rastrearla si algo no cuadra.
                origenAliasId: o.aliasId,
            };
        }
        batch.update(doc(db, colPath, plan.maestroId), supplierData);
    }

    for (const a of plan.alias) {
        batch.update(doc(db, colPath, a.id), { masterProductId: plan.maestroId });
    }

    await batch.commit();
    return { ofertasTrasladadas: plan.ofertas.length, aliasMarcados: plan.alias.length };
};

/**
 * Deshace la fusión: quita `masterProductId` de los alias.
 *
 * Las ofertas trasladadas se quedan en el maestro a propósito — son
 * información comercial válida, y borrarlas destruiría datos que el alias ya
 * no va a volver a aportar. Si se quiere limpieza total, se retiran a mano.
 */
export const deshacerFusion = async (
    db: Firestore,
    appId: string,
    userId: string,
    aliasIds: string[],
): Promise<number> => {
    const colPath = `artifacts/${appId}/users/${userId}/grimorio-ingredients`;
    const batch = writeBatch(db);
    for (const id of aliasIds) {
        batch.update(doc(db, colPath, id), { masterProductId: deleteField() });
    }
    await batch.commit();
    return aliasIds.length;
};
