import { PurchaseEvent } from '../../types';

/**
 * Cuánto se le compra a cada proveedor, y cuándo. **Punto 34, escalón barato.**
 *
 * ## Por qué esto ya se podía hacer
 *
 * No hace falta ninguna colección nueva ni ningún dato que no exista: cada
 * compra lleva proveedor, fecha e importe desde el primer día. Lo único que
 * faltaba era sumarlas por las dos dimensiones que importan —quién y cuándo—
 * en vez de mirarlas como una lista.
 *
 * Es la misma idea que el histórico de precios: el dato estaba escrito, nadie
 * lo estaba leyendo así.
 *
 * ## Lo que NO hace
 *
 * No proyecta, no compara con un presupuesto y no dice si un mes es bueno o
 * malo. Eso es el punto 39 y necesita que exista un presupuesto contra el que
 * medir; decirlo antes sería inventarse la referencia.
 */

export interface GastoMes {
    /** `2026-08`, ordenable como texto. */
    mes: string;
    total: number;
    compras: number;
}

export interface GastoProveedor {
    proveedorId: string;
    proveedorNombre: string;
    total: number;
    compras: number;
    /** Productos distintos comprados: dependencia, no solo dinero. */
    productos: number;
    porMes: GastoMes[];
    primera?: Date;
    ultima?: Date;
}

const fechaDe = (p: PurchaseEvent): Date => {
    const d = (p as any).createdAt;
    if (d instanceof Date) return d;
    if (d?.toDate) return d.toDate();
    const n = new Date(d);
    return isNaN(n.getTime()) ? new Date(0) : n;
};

const importeDe = (p: PurchaseEvent): number => {
    const t = Number(p.totalCost);
    if (isFinite(t) && t > 0) return t;
    // Sin total, se deriva: es el mismo dato dicho de otra forma.
    const u = Number(p.unitPrice), q = Number(p.quantity);
    return isFinite(u) && isFinite(q) && u > 0 && q > 0 ? u * q : 0;
};

/** `2026-08` a partir de una fecha. Texto, para que ordene solo. */
export const claveMes = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

interface Acumulado extends GastoProveedor {
    _productos: Set<string>;
    _meses: Map<string, GastoMes>;
}

export const gastoPorProveedor = (compras: PurchaseEvent[]): GastoProveedor[] => {
    const acc = new Map<string, Acumulado>();

    for (const c of compras || []) {
        if (!c || c.status === 'cancelled') continue;
        const importe = importeDe(c);
        if (!(importe > 0)) continue;

        // Sin proveedor NO se descarta: es dinero gastado, y esconderlo haría
        // que los totales no cuadren con lo que se ha pagado de verdad. Se
        // agrupa bajo una clave que salta a la vista como incompleta.
        const id = c.providerId || 'sin-proveedor';
        const nombre = c.providerName || 'Sin proveedor';

        let g = acc.get(id);
        if (!g) {
            g = {
                proveedorId: id, proveedorNombre: nombre, total: 0, compras: 0, productos: 0,
                porMes: [], _productos: new Set<string>(), _meses: new Map<string, GastoMes>(),
            };
            acc.set(id, g);
        }

        const f = fechaDe(c);
        g.total += importe;
        g.compras += 1;
        if (c.ingredientId) g._productos.add(c.ingredientId);
        if (!g.primera || f < g.primera) g.primera = f;
        if (!g.ultima || f > g.ultima) g.ultima = f;

        const mes = claveMes(f);
        const m = g._meses.get(mes);
        if (m) { m.total += importe; m.compras += 1; }
        else g._meses.set(mes, { mes, total: importe, compras: 1 });
    }

    return Array.from(acc.values())
        .map(g => ({
            proveedorId: g.proveedorId,
            proveedorNombre: g.proveedorNombre,
            total: Math.round(g.total * 100) / 100,
            compras: g.compras,
            productos: g._productos.size,
            primera: g.primera,
            ultima: g.ultima,
            porMes: Array.from(g._meses.values())
                .map(m => ({ ...m, total: Math.round(m.total * 100) / 100 }))
                .sort((a, b) => a.mes.localeCompare(b.mes)),
        }))
        .sort((a, b) => b.total - a.total);
};

/** El gasto de todos los proveedores, mes a mes. Para la vista de conjunto. */
export const gastoPorMes = (compras: PurchaseEvent[]): GastoMes[] => {
    const m = new Map<string, GastoMes>();
    for (const g of gastoPorProveedor(compras)) {
        for (const mes of g.porMes) {
            const a = m.get(mes.mes);
            if (a) { a.total = Math.round((a.total + mes.total) * 100) / 100; a.compras += mes.compras; }
            else m.set(mes.mes, { ...mes });
        }
    }
    return Array.from(m.values()).sort((a, b) => a.mes.localeCompare(b.mes));
};

/**
 * Qué parte del gasto se lleva cada proveedor, en tanto por ciento.
 *
 * Es la lectura de **concentración**: un proveedor con el 70 % del gasto no es
 * un buen precio, es una dependencia.
 */
export const concentracion = (gastos: GastoProveedor[]): Array<{ proveedorNombre: string; pct: number }> => {
    const total = gastos.reduce((a, g) => a + g.total, 0);
    if (!(total > 0)) return [];
    return gastos.map(g => ({
        proveedorNombre: g.proveedorNombre,
        pct: Math.round((g.total / total) * 1000) / 10,
    }));
};
