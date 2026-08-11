import { Firestore, doc, updateDoc, deleteField } from 'firebase/firestore';
import { PlanCorreccionUnidad } from './fixUnit.plan';

export * from './fixUnit.plan';

/**
 * I1 — Escritura de la corrección de formato. **Una ficha por operación.**
 *
 * Nunca en lote. La migración antigua recorría las 1.300 fichas escribiendo
 * el formato que `resolveStandardPack` inventaba; aquí cada cambio lo decide
 * una persona que ha mirado la botella, y cada cambio se puede deshacer.
 *
 * Se escriben tres valores y dos marcas:
 *   - `standardUnit`, `standardQuantity`, `standardPrice`: el formato y el
 *     precio por unidad base que de él se deduce;
 *   - `formatoAntesDeCorregir`: los tres valores anteriores, tal cual, para
 *     que deshacer sea exacto y no una reconstrucción;
 *   - `formatoVerificado`: marca que **una persona lo confirmó**. Es lo que
 *     saca a la ficha del informe para siempre; sin ella, la auditoría la
 *     volvería a bloquear en cuanto se recargara.
 */

const ruta = (appId: string, userId: string) =>
    `artifacts/${appId}/users/${userId}/grimorio-ingredients`;

export const ejecutarCorreccion = async (
    db: Firestore,
    appId: string,
    userId: string,
    plan: PlanCorreccionUnidad,
): Promise<void> => {
    if (plan.bloqueo) throw new Error(plan.bloqueo);

    const cambios: Record<string, any> = {
        standardUnit: plan.unidadNueva,
        standardQuantity: plan.cantidadNueva,
        formatoVerificado: true,
        formatoVerificadoEn: Date.now(),
        // Guardar el estado anterior completo, incluso cuando algún campo
        // venía vacío: al deshacer hay que poder distinguir «era 700» de
        // «no había nada», y para eso el null tiene que constar.
        formatoAntesDeCorregir: {
            standardUnit: plan.unidadAnterior ?? null,
            standardQuantity: plan.cantidadAnterior ?? null,
            standardPrice: plan.precioBaseAnterior ?? null,
        },
    };
    if (plan.precioBaseNuevo !== undefined) cambios.standardPrice = plan.precioBaseNuevo;

    await updateDoc(doc(db, ruta(appId, userId), plan.id), cambios);
};

/**
 * Deshace la corrección devolviendo los tres valores exactos que había.
 *
 * Si un campo estaba vacío antes, se retira con `deleteField()` en vez de
 * escribir un cero: un cero es un dato, y ahí no había ninguno.
 */
export const deshacerCorreccion = async (
    db: Firestore,
    appId: string,
    userId: string,
    ing: { id: string; formatoAntesDeCorregir?: { standardUnit?: string | null; standardQuantity?: number | null; standardPrice?: number | null } },
): Promise<void> => {
    const previo = ing.formatoAntesDeCorregir;
    if (!previo) throw new Error('Esta ficha no tiene un estado anterior guardado; no se puede deshacer.');

    await updateDoc(doc(db, ruta(appId, userId), ing.id), {
        standardUnit: previo.standardUnit ?? deleteField(),
        standardQuantity: previo.standardQuantity ?? deleteField(),
        standardPrice: previo.standardPrice ?? deleteField(),
        formatoVerificado: deleteField(),
        formatoVerificadoEn: deleteField(),
        formatoAntesDeCorregir: deleteField(),
    });
};
