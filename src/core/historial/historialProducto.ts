import { Ingredient, PurchaseEvent, StockMovement } from '../../types';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

/**
 * Todo lo que le ha pasado a un producto, en una sola línea de tiempo.
 * **Punto 8.**
 *
 * ## Por qué esto no existía teniéndolo todo
 *
 * Los tres registros llevan tiempo escribiéndose: `purchases` (qué entró y a
 * qué precio), `stock_movements` (qué salió y por qué) y `audit_log` (qué tocó
 * el asistente). Lo que faltaba era **la vista que los une**, y sin ella
 * responder «¿qué ha pasado con este mezcal?» obliga a abrir tres pantallas y
 * cruzar fechas a mano.
 *
 * Un historial partido en tres no es un historial: son tres listas.
 *
 * ## Se resuelve el producto, no la ficha
 *
 * Los históricos siguen apuntando al documento original —así se diseñó la
 * fusión, y por eso es reversible—, de modo que la línea de tiempo de un
 * producto fusionado **está repartida entre sus fichas**. Se recogen todas.
 * Sin esto, fusionar dos productos escondía media historia de cada uno.
 */

export type TipoEvento = 'compra' | 'salida' | 'ajuste';

export interface EventoProducto {
    fecha: Date;
    tipo: TipoEvento;
    /** Qué pasó, en una frase que se lee sin descifrar nada. */
    texto: string;
    /** Positivo entra, negativo sale. En la unidad del propio registro. */
    cantidad: number;
    unidad: string;
    /** Solo en compras. */
    importe?: number;
    /** De qué ficha vino: importa cuando el producto es una fusión. */
    fichaId: string;
}

const fechaDe = (v: any): Date => {
    if (v instanceof Date) return v;
    if (v?.toDate) return v.toDate();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date(0) : d;
};

const MOTIVO: Record<string, string> = {
    consumption: 'Consumo',
    waste: 'Merma',
    adjustment: 'Ajuste de conteo',
    production: 'Producción',
};

/**
 * La línea de tiempo de un producto, **más reciente primero**.
 *
 * Al revés se leería como un archivo; así se lee como «qué ha pasado
 * últimamente», que es la pregunta que trae a alguien aquí.
 */
export const historialDeProducto = (
    productoId: string,
    ingredientes: Ingredient[],
    compras: PurchaseEvent[],
    movimientos: StockMovement[],
): EventoProducto[] => {
    if (!productoId) return [];

    const porId = indicePorId(ingredientes || []);
    const maestro = resolverMaestro(productoId, porId);

    // Todas las fichas que son este producto: la propia y sus alias.
    const suyas = new Set<string>([maestro, productoId]);
    for (const i of ingredientes || []) {
        if (i?.id && resolverMaestro(i.id, porId) === maestro) suyas.add(i.id);
    }

    const eventos: EventoProducto[] = [];

    for (const c of compras || []) {
        if (!c?.ingredientId || !suyas.has(c.ingredientId) || c.status === 'cancelled') continue;
        const cantidad = Number(c.quantity) || 0;
        const importe = Number(c.totalCost) || (Number(c.unitPrice) || 0) * cantidad;
        eventos.push({
            fecha: fechaDe((c as any).createdAt),
            tipo: 'compra',
            texto: `Compra a ${c.providerName || 'proveedor sin nombre'}`,
            cantidad,
            unidad: c.unit || 'und',
            importe: Math.round(importe * 100) / 100,
            fichaId: c.ingredientId,
        });
    }

    for (const m of movimientos || []) {
        if (!m?.ingredientId || !suyas.has(m.ingredientId)) continue;
        const q = Number(m.quantity) || 0;
        const tipo: TipoEvento = m.type === 'adjustment' ? 'ajuste' : 'salida';
        eventos.push({
            fecha: fechaDe((m as any).date ?? (m as any).createdAt),
            tipo,
            // Un ajuste con signo positivo RESTA —viene del conteo físico: lo
            // digital sobraba— así que decirlo como «salida» sin más engaña.
            texto: MOTIVO[m.type as string] || 'Movimiento',
            cantidad: -q,
            unidad: (m as any).unit || 'und',
            fichaId: m.ingredientId,
        });
    }

    return eventos.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
};

/** Lo que resume una línea de tiempo sin tener que leerla entera. */
export const resumenDeHistorial = (eventos: EventoProducto[]) => {
    const compras = eventos.filter(e => e.tipo === 'compra');
    const gastado = compras.reduce((a, e) => a + (e.importe || 0), 0);
    const fichas = new Set(eventos.map(e => e.fichaId));
    return {
        eventos: eventos.length,
        compras: compras.length,
        gastado: Math.round(gastado * 100) / 100,
        salidas: eventos.filter(e => e.tipo !== 'compra').length,
        primera: eventos.length ? eventos[eventos.length - 1].fecha : undefined,
        ultima: eventos.length ? eventos[0].fecha : undefined,
        /** Más de una ficha significa que este producto es una fusión. */
        fichas: fichas.size,
    };
};
