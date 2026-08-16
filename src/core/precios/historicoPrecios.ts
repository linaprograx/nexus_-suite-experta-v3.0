import { PurchaseEvent, Ingredient } from '../../types';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

/**
 * Histórico de precios por observación. **Decisión 3 del catálogo global**
 * (2026-08-16): cada precio observado queda con su fecha y no se borra nunca,
 * más una proyección vigente para consultar.
 *
 * ## De dónde salen las observaciones, y por qué no hay colección nueva
 *
 * Ya existían y nadie las estaba leyendo así. **Cada compra es una observación
 * de precio con fecha, proveedor y cantidad**, y `purchases` no se sobrescribe
 * nunca. El histórico estaba escrito desde el primer día; lo que faltaba era
 * leerlo como una serie en vez de como una lista.
 *
 * Crear una colección paralela habría sido inventar una segunda verdad sobre el
 * mismo hecho, y de esas ya se ha pagado una en este proyecto.
 *
 * Lo que **sí** faltará es el precio de *catálogo* —lo que el proveedor pide,
 * se compre o no—, y su sitio natural es la importación de ficheros: es quien
 * lo observa. Hasta entonces, este módulo dice la verdad que hay: lo pagado.
 *
 * ## Dos reglas que no se negocian
 *
 * **1. Solo compara lo comparable.** Un precio de 89,50 € y otro de 3,20 € no
 * son una bajada del 96 % si uno es una botella y el otro un limón: son
 * unidades distintas. Las observaciones se agrupan por unidad, y una serie con
 * unidades mezcladas se marca y **no se calcula la variación**. La alternativa
 * —normalizar a unidad base aquí— sería una segunda calculadora de unidades
 * compitiendo con `packNormalization`, que es la fuente única.
 *
 * **2. Una sola observación no es una tendencia.** Con un punto no hay
 * variación que dar, y devolver 0 % se leería como «no ha cambiado» cuando lo
 * cierto es «no se sabe».
 */

export interface Observacion {
    fecha: Date;
    /** Precio por unidad de compra, tal y como se pagó. */
    precio: number;
    unidad: string;
    proveedorId: string;
    proveedorNombre: string;
    cantidad: number;
    origen: 'compra';
}

export type MotivoSinVariacion = 'una-sola' | 'unidades-mezcladas' | 'sin-datos';

export interface SeriePrecios {
    productoId: string;
    observaciones: Observacion[];
    /** El más reciente. Es la «proyección vigente» de la decisión 3. */
    vigente?: Observacion;
    primera?: Observacion;
    /** Variación entre la primera y la vigente, en %. Ausente si no procede. */
    variacionPct?: number;
    /** Por qué no hay variación, cuando no la hay. */
    motivoSinVariacion?: MotivoSinVariacion;
    /** Unidades distintas encontradas: más de una impide comparar. */
    unidades: string[];
    minimo?: Observacion;
    maximo?: Observacion;
}

const fechaDe = (p: PurchaseEvent): Date => {
    const d = (p as any).createdAt;
    if (d instanceof Date) return d;
    if (d?.toDate) return d.toDate();          // Timestamp de Firestore
    const n = new Date(d);
    return isNaN(n.getTime()) ? new Date(0) : n;
};

const precioDe = (p: PurchaseEvent): number => {
    const u = Number(p.unitPrice);
    if (isFinite(u) && u > 0) return u;
    // Sin precio unitario, se deriva del total: es el mismo dato dicho de otra
    // forma, no una estimación.
    const t = Number(p.totalCost), q = Number(p.quantity);
    return isFinite(t) && isFinite(q) && q > 0 && t > 0 ? t / q : 0;
};

const norm = (u: string) => (u || '').trim().toLowerCase();

/**
 * Las series de precio por producto, resolviendo el maestro.
 *
 * Se resuelve el maestro porque **el precio es del producto, no de la ficha**:
 * si dos fichas fusionadas se compraron a dos proveedores, la serie del
 * producto son las dos, y verlas por separado era justamente lo que escondía
 * que TOMAS CUPREATA se estaba comprando a 89,50 € y a 68,50 €.
 */
export const seriesDePrecio = (
    compras: PurchaseEvent[],
    ingredientes: Ingredient[] = [],
): Map<string, SeriePrecios> => {
    const porId = indicePorId(ingredientes);
    const porProducto = new Map<string, Observacion[]>();

    for (const c of compras || []) {
        if (!c?.ingredientId || c.status === 'cancelled') continue;
        const precio = precioDe(c);
        if (!(precio > 0)) continue;

        const producto = ingredientes.length ? resolverMaestro(c.ingredientId, porId) : c.ingredientId;
        const obs: Observacion = {
            fecha: fechaDe(c),
            precio,
            unidad: c.unit || 'und',
            proveedorId: c.providerId || '',
            proveedorNombre: c.providerName || 'Sin proveedor',
            cantidad: Number(c.quantity) || 0,
            origen: 'compra',
        };
        const lista = porProducto.get(producto);
        if (lista) lista.push(obs); else porProducto.set(producto, [obs]);
    }

    const salida = new Map<string, SeriePrecios>();
    for (const [productoId, obs] of porProducto.entries()) {
        obs.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
        salida.set(productoId, construirSerie(productoId, obs));
    }
    return salida;
};

const construirSerie = (productoId: string, observaciones: Observacion[]): SeriePrecios => {
    const unidades = Array.from(new Set(observaciones.map(o => norm(o.unidad)))).filter(Boolean);
    const primera = observaciones[0];
    const vigente = observaciones[observaciones.length - 1];

    const base: SeriePrecios = { productoId, observaciones, unidades, primera, vigente };

    if (observaciones.length === 0) return { ...base, motivoSinVariacion: 'sin-datos' };

    // Mínimo y máximo solo tienen sentido dentro de una misma unidad.
    if (unidades.length === 1) {
        base.minimo = observaciones.reduce((a, o) => (o.precio < a.precio ? o : a));
        base.maximo = observaciones.reduce((a, o) => (o.precio > a.precio ? o : a));
    }

    if (observaciones.length < 2) return { ...base, motivoSinVariacion: 'una-sola' };
    if (unidades.length > 1) return { ...base, motivoSinVariacion: 'unidades-mezcladas' };
    if (!(primera.precio > 0)) return { ...base, motivoSinVariacion: 'sin-datos' };

    return {
        ...base,
        variacionPct: Math.round(((vigente.precio - primera.precio) / primera.precio) * 1000) / 10,
    };
};

/** Frase corta para enseñar la serie sin que el número aparezca desnudo. */
export const explicarSerie = (s: SeriePrecios): string => {
    if (!s.vigente) return 'Sin compras registradas.';
    switch (s.motivoSinVariacion) {
        case 'una-sola':
            return `Una sola compra, el ${s.vigente.fecha.toLocaleDateString()}: no hay con qué compararla.`;
        case 'unidades-mezcladas':
            return `Comprado en ${s.unidades.length} unidades distintas (${s.unidades.join(', ')}): no se puede comparar sin confundir formato con precio.`;
        case 'sin-datos':
            return 'Sin precios utilizables.';
    }
    const v = s.variacionPct ?? 0;
    if (Math.abs(v) < 0.05) return `Estable en ${s.observaciones.length} compras desde ${s.primera!.fecha.toLocaleDateString()}.`;
    return `${v > 0 ? 'Ha subido' : 'Ha bajado'} un ${Math.abs(v).toFixed(1)} % desde ${s.primera!.fecha.toLocaleDateString()}`
        + ` (${s.primera!.precio.toFixed(2)} € → ${s.vigente.precio.toFixed(2)} €, ${s.observaciones.length} compras).`;
};

/**
 * Los productos que más se han movido. Para el informe, ordenado por lo que
 * duele: la subida mayor primero.
 *
 * `minimoCompras` existe porque dos compras separadas por un día no son una
 * tendencia y llenarían la lista de ruido.
 *
 * **Los estables quedan fuera, y esto no es cosmético.** Una variación de 0 %
 * está *definida*: si se cuela en la lista, ordenar de mayor a menor y cortar
 * por arriba deja los ceros ocupando el ranking y **expulsa a las bajadas**.
 * Pasó en el catálogo real: 125 productos comprados dos veces al mismo precio
 * tapaban al único que sí había bajado, y el panel se contradecía a sí mismo
 * —«1 ha bajado» arriba y «ninguno se ha movido» debajo—.
 */
const UMBRAL_ESTABLE = 0.05;

export const mayoresMovimientos = (
    series: Map<string, SeriePrecios>,
    { minimoCompras = 2, limite = 20 }: { minimoCompras?: number; limite?: number } = {},
): SeriePrecios[] =>
    Array.from(series.values())
        .filter(s => s.variacionPct !== undefined
            && Math.abs(s.variacionPct) >= UMBRAL_ESTABLE
            && s.observaciones.length >= minimoCompras)
        .sort((a, b) => (b.variacionPct || 0) - (a.variacionPct || 0))
        .slice(0, limite);

/**
 * Series con el mismo producto comprado a varios proveedores a precios
 * distintos. Es el hallazgo de TOMAS CUPREATA, generalizado.
 */
export const diferenciasEntreProveedores = (
    series: Map<string, SeriePrecios>,
): Array<{ serie: SeriePrecios; barato: Observacion; caro: Observacion; diferenciaPct: number }> => {
    const salida: Array<{ serie: SeriePrecios; barato: Observacion; caro: Observacion; diferenciaPct: number }> = [];

    for (const s of series.values()) {
        // Mezclar unidades aquí daría diferencias falsas del 1.000 %.
        if (s.unidades.length !== 1) continue;

        // El último precio de cada proveedor: comparar el de hoy con el de hace
        // un año diría que uno es más caro cuando lo que pasó es que subieron.
        const ultimoPorProveedor = new Map<string, Observacion>();
        for (const o of s.observaciones) {
            const clave = o.proveedorId || o.proveedorNombre;
            const previo = ultimoPorProveedor.get(clave);
            if (!previo || o.fecha.getTime() >= previo.fecha.getTime()) ultimoPorProveedor.set(clave, o);
        }
        if (ultimoPorProveedor.size < 2) continue;

        const lista = Array.from(ultimoPorProveedor.values());
        const barato = lista.reduce((a, o) => (o.precio < a.precio ? o : a));
        const caro = lista.reduce((a, o) => (o.precio > a.precio ? o : a));
        if (!(barato.precio > 0) || barato.precio === caro.precio) continue;

        salida.push({
            serie: s,
            barato,
            caro,
            diferenciaPct: Math.round(((caro.precio - barato.precio) / barato.precio) * 1000) / 10,
        });
    }

    return salida.sort((a, b) => b.diferenciaPct - a.diferenciaPct);
};

export interface ResumenSeries {
    productos: number;
    /** Con más de una observación: los únicos que pueden decir algo. */
    conHistorial: number;
    subidas: number;
    bajadas: number;
    estables: number;
    unidadesMezcladas: number;
    unaSola: number;
}

/**
 * El desglose. Existe porque un panel con cinco ceros no informa de nada, y los
 * ceros pueden significar cosas muy distintas: que no ha cambiado ningún
 * precio, que solo hay una compra de cada cosa, o que las unidades impiden
 * comparar. Son tres situaciones y una sola cifra no las distingue.
 */
export const resumenDeSeries = (series: Map<string, SeriePrecios>): ResumenSeries => {
    const r: ResumenSeries = { productos: series.size, conHistorial: 0, subidas: 0, bajadas: 0, estables: 0, unidadesMezcladas: 0, unaSola: 0 };
    for (const s of series.values()) {
        if (s.observaciones.length > 1) r.conHistorial++;
        if (s.motivoSinVariacion === 'una-sola') { r.unaSola++; continue; }
        if (s.motivoSinVariacion === 'unidades-mezcladas') { r.unidadesMezcladas++; continue; }
        const v = s.variacionPct;
        if (v === undefined) continue;
        // El mismo umbral que `mayoresMovimientos`: si la cabecera y la lista
        // usaran criterios distintos, volverían a contradecirse.
        if (Math.abs(v) < UMBRAL_ESTABLE) r.estables++;
        else if (v > 0) r.subidas++;
        else r.bajadas++;
    }
    return r;
};
