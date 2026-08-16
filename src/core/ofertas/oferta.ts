import { Ingredient } from '../../types';
import { resolveStandardPack, formatPackDisplay, BaseUnit } from '../../utils/packNormalization';
import { proveedorDeIngrediente } from '../../features/orders/resolverProveedor';

/**
 * Una **oferta**: un producto, a un proveedor, en un formato, a un precio.
 * Punto 17 del plan — la mitad que faltaba.
 *
 * ## Los dos defectos que arregla, encontrados el 2026-08-16
 *
 * **1. `supplierData` se indexaba solo por proveedor.** Un catálogo trae el
 * mismo producto en varios tamaños —ABSOLUT 750 ml, 1 L y 3 L del mismo
 * proveedor— y con la clave antigua **eso no se podía ni guardar**: la última
 * escritura pisaba a las otras dos. No es que se enseñara mal; es que no cabía.
 *
 * **2. El precio por unidad base se calculaba una vez por ficha** y se copiaba
 * a todas sus ofertas (`opcionesDeCompra`: `precioBase` salía de
 * `ing.standardPrice` antes del bucle). Así que al coronar «mejor precio» entre
 * las ofertas de una misma ficha se comparaban tres números idénticos y ganaba
 * la primera de la lista. Una corona arbitraria es peor que ninguna, porque se
 * lee como una recomendación.
 *
 * ## La clave, y por qué se puede leer lo viejo
 *
 * `proveedorId::cantidadUnidad` — «prov1::700ml». Las claves antiguas son un id
 * de proveedor a secas, sin `::`, y **se siguen leyendo**: significan «la oferta
 * de ese proveedor en el formato de la ficha», que es exactamente lo que
 * querían decir cuando se escribieron. **Ninguna migración, ningún borrado.**
 *
 * ## Lo que NO hace
 *
 * No elige. Devuelve las ofertas con su precio por unidad base bien calculado —
 * cada una con SU formato— y quien decide sigue siendo `opcionesDeCompra` con
 * la política del usuario. Aquí solo se deja de mentir en el número que esa
 * decisión usa.
 */

export interface Oferta {
    /** `proveedorId::700ml`, o el id a secas si viene de una clave antigua. */
    clave: string;
    fichaId: string;
    fichaNombre: string;
    proveedorId: string | null;
    /** Precio del envase, tal y como se compra. */
    precio: number;
    /** Cantidad del formato en unidad base. */
    formatoCantidad: number;
    formatoUnidad: BaseUnit;
    /** «0,7 L», «1 kg». Para enseñarlo sin que el precio quede desnudo. */
    formatoLegible: string;
    /** €/ml, €/g, €/und. **Calculado con SU formato**, no con el de la ficha. */
    precioPorBase: number | null;
    esPreferente: boolean;
    /** De dónde salió: para poder rastrearla si algo no cuadra. */
    origen: 'supplierData' | 'ficha';
    /** La clave venía sin formato: se asumió el de la ficha. */
    formatoHeredado: boolean;
}

const num = (v: any): number => {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : 0;
};

const SEP = '::';

/** La clave de una oferta. Estable: el mismo proveedor y formato dan la misma. */
export const claveDeOferta = (
    proveedorId: string | null | undefined,
    cantidad: number,
    unidad: BaseUnit | string,
): string => `${proveedorId || 'sin-proveedor'}${SEP}${cantidad}${unidad}`;

/** Parte una clave. Las antiguas (sin `::`) son solo el proveedor. */
export const partirClave = (clave: string): { proveedorId: string; formato: string | null } => {
    const i = clave.indexOf(SEP);
    if (i < 0) return { proveedorId: clave, formato: null };
    return { proveedorId: clave.slice(0, i), formato: clave.slice(i + SEP.length) };
};

/** El formato canónico de la ficha. Es el que heredan las ofertas sin el suyo. */
export const formatoDeFicha = (ing: Ingredient): { cantidad: number; unidad: BaseUnit } => {
    const q = num(ing.standardQuantity);
    if (q > 0 && ing.standardUnit) return { cantidad: q, unidad: ing.standardUnit as BaseUnit };
    const std = resolveStandardPack({
        name: ing.nombre,
        unitText: (ing as any).unidadCompra || ing.unidad,
        explicitQty: num((ing as any).cantidad) || undefined,
        explicitUnit: (ing as any).unidadCompra || ing.unidad,
    });
    return { cantidad: std.standardQuantity, unidad: std.standardUnit };
};

/**
 * Las ofertas de una ficha.
 *
 * Cuando no hay ninguna en `supplierData`, la propia ficha es una oferta: tiene
 * precio y formato, y descartarla dejaría el producto sin ninguna forma de
 * comprarse habiendo una.
 */
export const ofertasDeFicha = (ing: Ingredient): Oferta[] => {
    if (!ing?.id) return [];

    const dePorSi = formatoDeFicha(ing);
    const preferente = ing.proveedorPreferente || null;
    const salida: Oferta[] = [];

    const construir = (
        clave: string,
        proveedorId: string | null,
        precio: number,
        formato: { cantidad: number; unidad: BaseUnit },
        heredado: boolean,
        origen: Oferta['origen'],
    ): Oferta => ({
        clave,
        fichaId: ing.id,
        fichaNombre: ing.nombre || 'Sin nombre',
        proveedorId,
        precio,
        formatoCantidad: formato.cantidad,
        formatoUnidad: formato.unidad,
        formatoLegible: formatPackDisplay(formato.cantidad, formato.unidad),
        // Sin formato no hay precio por unidad. Se deja en null y quien compare
        // sabrá que esta no entra: inventarlo es lo que produce coronas falsas.
        precioPorBase: formato.cantidad > 0 ? precio / formato.cantidad : null,
        esPreferente: !!preferente && proveedorId === preferente,
        origen,
        formatoHeredado: heredado,
    });

    const supplierData = (ing as any).supplierData || {};
    for (const [clave, d] of Object.entries<any>(supplierData)) {
        const precio = num(d?.price);
        if (precio <= 0) continue;

        const { proveedorId } = partirClave(clave);

        // El formato propio de la oferta, si lo trae. Si no, el de la ficha:
        // es lo que significaba una clave antigua.
        const qty = num(d?.formatQty);
        const unit = d?.formatUnit || d?.unit;
        let formato = dePorSi;
        let heredado = true;
        if (qty > 0 && unit) {
            const std = resolveStandardPack({ explicitQty: qty, explicitUnit: unit });
            formato = { cantidad: std.standardQuantity, unidad: std.standardUnit };
            heredado = false;
        }

        salida.push(construir(clave, proveedorId === 'sin-proveedor' ? null : proveedorId, precio, formato, heredado, 'supplierData'));
    }

    if (salida.length === 0) {
        const precio = num((ing as any).precioCompra);
        if (precio > 0) {
            // La escalera de M2, no un `ing.proveedor` a secas: ese campo está
            // `@deprecated` y viene vacío en el catálogo real, que es lo que
            // metía todo el inventario en «Sin Proveedor Asignado».
            const proveedorId = proveedorDeIngrediente(ing as any) ?? null;
            salida.push(construir(
                claveDeOferta(proveedorId, dePorSi.cantidad, dePorSi.unidad),
                proveedorId, precio, dePorSi, true, 'ficha',
            ));
        }
    }

    return salida;
};

/** Las ofertas de todas las fichas de un producto (maestro y alias fusionados). */
export const ofertasDeProducto = (fichas: Ingredient[]): Oferta[] =>
    (fichas || []).flatMap(ofertasDeFicha);

/**
 * La más barata **por unidad base**, y solo entre las comparables.
 *
 * Devuelve `null` cuando no hay dos ofertas en la misma unidad: comparar €/ml
 * con €/und no es comparar. Es la misma regla que rige en el histórico de
 * precios y en el lector de catálogos, y por el mismo motivo.
 */
export const masBarataComparable = (ofertas: Oferta[]): Oferta | null => {
    const conPrecio = (ofertas || []).filter(o => o.precioPorBase !== null);
    if (conPrecio.length === 0) return null;

    const unidades = new Set(conPrecio.map(o => o.formatoUnidad));
    if (unidades.size > 1) return null;

    return conPrecio.reduce((a, o) => (o.precioPorBase! < a.precioPorBase! ? o : a));
};

/** Si las ofertas se pueden comparar entre sí. */
export const sonComparables = (ofertas: Oferta[]): boolean => {
    const conPrecio = (ofertas || []).filter(o => o.precioPorBase !== null);
    return conPrecio.length > 0 && new Set(conPrecio.map(o => o.formatoUnidad)).size === 1;
};
