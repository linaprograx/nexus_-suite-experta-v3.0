import { Ingredient, PurchaseEvent, Supplier } from '../../types';
import { ofertasDeFicha, ofertasDeProducto, Oferta } from '../ofertas/oferta';
import { agruparProductos } from '../identity/agruparProductos';
import { gastoPorProveedor, GastoProveedor } from '../compras/gastoPorProveedor';
import { Incidencia, resumenDeIncidencias, tasaDeIncidencia, ResumenProveedor } from './incidencias';

/**
 * **Inteligencia de proveedores.** Punto 26.
 *
 * Hoy `evaluateMarketSignals` solo mira el precio. Un proveedor es más cosas:
 * cuánto dinero se le va, de cuántos productos eres rehén suyo, si cumple, y
 * qué sabes de trabajar con él.
 *
 * ## No compone un número. Compone hechos
 *
 * Nada de «puntuación 7,4 sobre 10». Misma regla que el centro de alertas y que
 * la gravedad de las incidencias: una cifra sintética invita a ordenar por ella
 * y nadie sabe qué la mueve. Aquí cada dato viene con la frase que dice **por
 * qué importa** y con lo que haría falta para cambiarlo.
 *
 * ## Lo que NO reutiliza mal
 *
 * El gasto sale de `gastoPorProveedor`, las ofertas de `ofertasDeFicha` y las
 * incidencias de `incidencias.ts`. Ninguna cifra se recalcula aquí por segunda
 * vía: ese es exactamente el fallo que este proyecto ha arreglado ya en las
 * reglas de stock, en el motor de coste y en el filtro por proveedor.
 *
 * ## La limitación que se dice en voz alta
 *
 * El sobrecoste compara las **ofertas de hoy** con las **compras de ayer**. La
 * alternativa barata puede no haber existido entonces, así que esto NO es
 * «dinero que perdiste»: es **lo que costaría hoy repetir esa misma compra en
 * otro sitio**. La diferencia importa, y por eso el campo se llama
 * `costariaHoy` y no `perdido`.
 */

const DIAS = 24 * 60 * 60 * 1000;
export const VENTANA_COMPRAS_DIAS = 180;

export interface ProductoDelProveedor {
    /** El id del grupo de identidad, no el de una ficha suelta. */
    fichaId: string;
    nombre: string;
    /** La oferta de este proveedor. */
    suya: Oferta;
    /** La más barata comparable de OTRO proveedor, si la hay. */
    alternativa: Oferta | null;
    /** Nadie más lo vende: si este falla, te quedas sin él. */
    fuenteUnica: boolean;
}

export interface PerfilProveedor {
    proveedorId: string;
    nombre: string;
    /** Gasto en todo el histórico, tal y como lo cuenta `gastoPorProveedor`. */
    gasto: GastoProveedor | null;
    /** Porcentaje del gasto total. Es la medida de dependencia económica. */
    pctDelGasto: number;
    productos: ProductoDelProveedor[];
    /** Los que solo vende él. La lista, no solo el número. */
    fuenteUnica: ProductoDelProveedor[];
    /**
     * Lo que costaría hoy repetir en otro sitio lo comprado en la ventana.
     * Negativo nunca: solo suma donde hay alternativa **más barata**.
     */
    costariaHoyMenos: number;
    /** Sobre cuántas compras se calculó. Sin esto la cifra no se puede juzgar. */
    comprasComparadas: number;
    incidencias: ResumenProveedor;
    /** Incidencias por compra recibida. `null` si no hay compras que dividan. */
    tasa: number | null;
    condiciones: { plazoDias?: number; diasReparto?: string[]; pago?: string };
}

const fechaDe = (p: PurchaseEvent): Date => {
    const d: any = (p as any).createdAt;
    if (d instanceof Date) return d;
    if (d?.toDate) return d.toDate();
    const n = new Date(d);
    return isNaN(n.getTime()) ? new Date(0) : n;
};

/**
 * La oferta más barata **comparable** de cualquier proveedor distinto a éste.
 *
 * «Comparable» es la regla de siempre: misma unidad base. Comparar €/ml con
 * €/und no es comparar, y coronar una alternativa falsa sería peor que no
 * enseñar ninguna — se leería como una recomendación.
 */
const mejorDeOtro = (todas: Oferta[], proveedorId: string): Oferta | null => {
    const suya = todas.find(o => o.proveedorId === proveedorId);
    if (!suya || suya.precioPorBase === null) return null;
    const otras = todas.filter(o =>
        o.proveedorId && o.proveedorId !== proveedorId
        && o.precioPorBase !== null
        && o.formatoUnidad === suya.formatoUnidad);
    if (otras.length === 0) return null;
    const mejor = otras.reduce((a, o) => (o.precioPorBase! < a.precioPorBase! ? o : a));
    return mejor.precioPorBase! < suya.precioPorBase! ? mejor : null;
};

export const perfilDeProveedor = (entrada: {
    proveedorId: string;
    proveedor?: Supplier | null;
    ingredientes: Ingredient[];
    compras: PurchaseEvent[];
    incidencias: Incidencia[];
    ahora?: Date;
}): PerfilProveedor => {
    const { proveedorId, ingredientes, compras, incidencias } = entrada;
    const ahora = entrada.ahora || new Date();

    /**
     * Qué vende y a qué precio frente a los demás — **por producto, no por
     * ficha**.
     *
     * Medido en el catálogo real el 2026-08-23: contando fichas salían 621
     * «productos que solo vende él», y en la lista aparecía dos veces
     * «AGUERRIDO, BENIGNO CUPREATA CAPON». Son dos fichas del mismo producto,
     * así que el número estaba inflado.
     *
     * Y el error grave no era ese: **dos fichas del mismo producto de
     * proveedores distintos se habrían contado las dos como fuente única**, o
     * sea, «no tienes alternativa» dicho de algo que sí la tiene. Es la misma
     * trampa de identidad que ya obligó a rehacer el agrupador de Mercado.
     *
     * Se usa `agruparProductos`, que es la regla aprobada —conjunto idéntico de
     * palabras fuertes—, y no una segunda forma de emparejar inventada aquí.
     */
    const productos: ProductoDelProveedor[] = [];
    const porFicha = new Map<string, { suya: Oferta; alternativa: Oferta | null; fuenteUnica: boolean }>();

    for (const grupo of agruparProductos(ingredientes || [])) {
        const ofertas = ofertasDeProducto(grupo.entries);
        const suya = ofertas.find(o => o.proveedorId === proveedorId);
        if (!suya) continue;

        const otrosProveedores = new Set(
            ofertas.filter(o => o.proveedorId && o.proveedorId !== proveedorId).map(o => o.proveedorId));
        const info = {
            suya,
            alternativa: mejorDeOtro(ofertas, proveedorId),
            fuenteUnica: otrosProveedores.size === 0,
        };
        // Se indexa por CADA ficha del grupo: las compras vienen con el id de
        // la ficha concreta, y si solo se guardara el del grupo, la mitad de
        // las compras no encontraría su producto y el sobrecoste saldría bajo
        // sin que nada lo indicara.
        for (const ing of grupo.entries) porFicha.set(ing.id, info);
        productos.push({
            fichaId: grupo.entries[0]?.id || grupo.id,
            nombre: grupo.entries[0]?.nombre || 'Sin nombre',
            ...info,
        });
    }

    // --- lo que costaría hoy repetir en otro sitio lo comprado en la ventana
    let costariaHoyMenos = 0;
    let comprasComparadas = 0;
    const desde = ahora.getTime() - VENTANA_COMPRAS_DIAS * DIAS;

    for (const c of compras || []) {
        if (c.providerId !== proveedorId) continue;
        if (fechaDe(c).getTime() < desde) continue;
        const info = porFicha.get(c.ingredientId);
        if (!info || !info.alternativa || info.suya.precioPorBase === null) continue;

        // Cantidad en unidad base: la compra dice envases, la oferta dice
        // €/unidad base. Multiplicar sin convertir daría una cifra enorme y
        // creíble, que es la peor clase de error.
        const envases = Number(c.quantity);
        if (!isFinite(envases) || envases <= 0) continue;
        const enBase = envases * info.suya.formatoCantidad;
        const diferencia = info.suya.precioPorBase - info.alternativa.precioPorBase!;
        if (diferencia <= 0) continue;

        costariaHoyMenos += enBase * diferencia;
        comprasComparadas++;
    }

    // --- dinero y dependencia, de la única fuente que ya los cuenta
    const gastos = gastoPorProveedor(compras || []);
    const total = gastos.reduce((n, g) => n + g.total, 0);
    const gasto = gastos.find(g => g.proveedorId === proveedorId) || null;

    const recibidas = (compras || []).filter(c => c.providerId === proveedorId
        && fechaDe(c).getTime() >= ahora.getTime() - 90 * DIAS).length;

    return {
        proveedorId,
        nombre: entrada.proveedor?.name || gasto?.proveedorNombre || proveedorId,
        gasto,
        pctDelGasto: total > 0 && gasto ? (gasto.total / total) * 100 : 0,
        productos: productos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
        fuenteUnica: productos.filter(p => p.fuenteUnica),
        costariaHoyMenos,
        comprasComparadas,
        incidencias: resumenDeIncidencias(incidencias || [], proveedorId, ahora),
        tasa: tasaDeIncidencia(incidencias || [], proveedorId, recibidas, ahora),
        condiciones: {
            plazoDias: entrada.proveedor?.leadTimeDays,
            diasReparto: entrada.proveedor?.deliveryDays,
            pago: entrada.proveedor?.paymentTerms,
        },
    };
};

/**
 * A partir de qué porcentaje del gasto la dependencia deja de ser una
 * preferencia y pasa a ser un riesgo. Umbral explícito y a la vista, como el de
 * las repeticiones que hacen patrón.
 */
export const CONCENTRACION_ALTA = 50;

/**
 * Lo que hay que decirle al fundador sobre este proveedor, en frases, sin
 * puntuaciones. Vacío cuando no hay nada digno de mención — y eso es una
 * respuesta, no un hueco.
 */
export const avisosDelPerfil = (p: PerfilProveedor): Array<{ texto: string; porQue: string; tono: 'riesgo' | 'dinero' | 'dato' }> => {
    const salida: Array<{ texto: string; porQue: string; tono: 'riesgo' | 'dinero' | 'dato' }> = [];

    if (p.pctDelGasto >= CONCENTRACION_ALTA) {
        salida.push({
            texto: `Concentra el ${p.pctDelGasto.toFixed(1)} % de tu gasto`,
            porQue: 'Una subida suya la notas entera; una caída suya te para la barra.',
            tono: 'riesgo',
        });
    }

    if (p.fuenteUnica.length > 0) {
        salida.push({
            texto: `${p.fuenteUnica.length} producto${p.fuenteUnica.length === 1 ? '' : 's'} solo lo${p.fuenteUnica.length === 1 ? '' : 's'} vende él`,
            porQue: 'Si falla, esos no tienen de dónde salir. Buscar un segundo proveedor para ellos vale más que negociar el precio.',
            tono: 'riesgo',
        });
    }

    if (p.costariaHoyMenos > 0 && p.comprasComparadas > 0) {
        salida.push({
            texto: `Repetir hoy en otro sitio lo comprado saldría €${p.costariaHoyMenos.toFixed(2)} más barato`,
            porQue: `Sobre ${p.comprasComparadas} compra${p.comprasComparadas === 1 ? '' : 's'} con alternativa comparable. No es dinero perdido: la oferta barata puede no haber existido entonces.`,
            tono: 'dinero',
        });
    }

    if (p.incidencias.patrones.length > 0) {
        salida.push({
            texto: 'Sus fallos se repiten, no son mala suerte',
            porQue: 'Tres o más del mismo tipo en 90 días. Es una conversación que tener con él, y ahora se puede demostrar.',
            tono: 'riesgo',
        });
    }

    return salida;
};
