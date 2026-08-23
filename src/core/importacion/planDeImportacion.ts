import { LineaCatalogo } from './leerCatalogo';
import { claveDeOferta } from '../ofertas/oferta';

/**
 * Qué se va a escribir exactamente al importar un catálogo. **Puro: no escribe.**
 *
 * ## La regla que hace esto seguro
 *
 * **La importación NO toca el precio de tus fichas.** Cada línea entra como una
 * **oferta de ese proveedor**, en `supplierData`, bajo la clave
 * `proveedor::formato`. Tu `precioCompra` —el que decide el coste de las
 * recetas— se queda como está.
 *
 * Esa es toda la diferencia entre una importación que se puede deshacer y una
 * que destruye información. Un catálogo de proveedor es *lo que él pide*, no lo
 * que tú pagas: escribirlo encima de tu precio convertiría una tarifa en un
 * hecho, y el motor de coste empezaría a calcular con números que no son tuyos.
 *
 * Si después quieres que esa oferta mande, se elige con la estrella del
 * preferente. Esa decisión es tuya y es reversible; sobrescribir no lo sería.
 *
 * ## Los productos nuevos nacen marcados
 *
 * Con `pendienteRevision`, que ya existe y ya los mantiene fuera de los
 * automatismos. Una ficha importada no la ha mirado nadie: tiene el nombre y el
 * precio del proveedor y nada más. Marcarla es la diferencia entre un catálogo
 * que crece y un catálogo que engorda.
 */

export interface OfertaAEscribir {
    fichaId: string;
    clave: string;
    price: number;
    unit: string;
    formatQty?: number;
    formatUnit?: string;
}

export interface FichaANacer {
    nombre: string;
    categoria: string;
    unidad: string;
    standardUnit: string;
    standardQuantity: number;
    precioCompra: number;
    clave: string;
    price: number;
}

export interface PlanImportacion {
    proveedorId: string;
    /** Ofertas sobre fichas que ya existen. No tocan su `precioCompra`. */
    ofertas: OfertaAEscribir[];
    /** Productos que no estaban. Nacen con `pendienteRevision`. */
    nuevas: FichaANacer[];
    /** Líneas que no se van a escribir, con el motivo. */
    descartadas: Array<{ fila: number; nombre: string; motivo: string }>;
}

/**
 * Construye el plan. `seleccionadas` son las filas que el usuario ha marcado;
 * sin ella no se importa nada — el «importar todo» por defecto es justo lo que
 * convierte un error de fichero en un desastre de catálogo.
 */
export const planificarImportacion = (
    lineas: LineaCatalogo[],
    proveedorId: string,
    seleccionadas: Set<number>,
): PlanImportacion => {
    const plan: PlanImportacion = { proveedorId, ofertas: [], nuevas: [], descartadas: [] };

    for (const l of lineas || []) {
        if (!seleccionadas.has(l.fila)) continue;

        if (l.estado === 'invalida') {
            plan.descartadas.push({ fila: l.fila, nombre: l.nombre, motivo: l.motivo });
            continue;
        }
        if (l.precio === undefined || !(l.precio > 0)) {
            plan.descartadas.push({ fila: l.fila, nombre: l.nombre, motivo: 'Sin precio: no hay oferta que guardar.' });
            continue;
        }
        if (!l.unidadBase || !(l.formatoBaseCantidad && l.formatoBaseCantidad > 0)) {
            plan.descartadas.push({ fila: l.fila, nombre: l.nombre, motivo: 'Sin formato resoluble: no se puede comparar ni costear.' });
            continue;
        }

        const cantidad = l.formatoBaseCantidad!;
        const clave = claveDeOferta(proveedorId, cantidad, l.unidadBase);

        if (l.ingredienteId) {
            plan.ofertas.push({
                fichaId: l.ingredienteId,
                clave,
                price: l.precio,
                unit: l.unidadBase,
                formatQty: cantidad,
                formatUnit: l.unidadBase,
            });
        } else {
            plan.nuevas.push({
                nombre: l.nombre,
                categoria: (l.categoria || '').trim() || 'Sin categoría',
                unidad: l.unidadBase,
                standardUnit: l.unidadBase,
                standardQuantity: cantidad,
                precioCompra: l.precio,
                clave,
                price: l.precio,
            });
        }
    }

    return plan;
};

/** Una frase con lo que va a pasar, para la confirmación. */
export const resumirPlan = (p: PlanImportacion): string => {
    const partes: string[] = [];
    if (p.ofertas.length) partes.push(`${p.ofertas.length} oferta(s) sobre fichas que ya tienes`);
    if (p.nuevas.length) partes.push(`${p.nuevas.length} producto(s) nuevo(s)`);
    if (p.descartadas.length) partes.push(`${p.descartadas.length} línea(s) descartada(s)`);
    return partes.join(' · ') || 'Nada seleccionado.';
};


/**
 * Los límites reales de este motor, medidos y no supuestos.
 *
 * · **500 operaciones por lote** es un tope duro de Firestore, y pasarse
 *   rechaza el lote **entero**: no escribe la mitad, no escribe nada.
 *   `EscrituraPorLotes` trocea por debajo de ese número, así que el tamaño del
 *   fichero no lo rompe — solo lo hace más lento.
 * · **1 MiB por documento**, también de Firestore. Importa porque cada
 *   importación añade una oferta a `supplierData`: un producto con cientos de
 *   ofertas de cientos de formatos acabaría rozándolo. Con decenas, ni cerca.
 * · **20.000 escrituras al día** en el plan gratuito de Firebase. Este es el
 *   límite que de verdad se toca: cada línea importada es una escritura.
 * · El fichero se lee **entero en memoria**. Unos pocos MB no se notan; decenas
 *   sí.
 */
export const LIMITES_IMPORTACION = {
    /** Por encima de esto se avisa: no rompe, pero conviene trocear el fichero. */
    lineasComodas: 2000,
    /** Escrituras diarias del plan gratuito de Firebase. */
    escriturasDiaGratis: 20000,
    /** Tope duro de Firestore por lote. Lo gestiona `EscrituraPorLotes`. */
    operacionesPorLote: 500,
};

/** Qué conviene saber antes de importar un fichero de este tamaño. */
export const avisoDeTamano = (lineas: number): string | null => {
    if (lineas > LIMITES_IMPORTACION.escriturasDiaGratis) {
        return `${lineas} líneas superan las ${LIMITES_IMPORTACION.escriturasDiaGratis.toLocaleString('es')} escrituras diarias del plan gratuito de Firebase. `
            + 'Divide el fichero o impórtalo en varios días.';
    }
    if (lineas > LIMITES_IMPORTACION.lineasComodas) {
        return `${lineas} líneas: se escribirá en ${Math.ceil(lineas / LIMITES_IMPORTACION.operacionesPorLote)} lotes y tardará un rato. `
            + 'No se rompe, pero conviene no cerrar la ventana.';
    }
    return null;
};
