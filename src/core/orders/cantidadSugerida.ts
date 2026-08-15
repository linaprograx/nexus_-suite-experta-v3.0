/**
 * Qué cantidad proponer en una línea de pedido.
 *
 * ## El problema
 *
 * Toda línea nacía con `quantity: 1`. Por eso los pedidos son listas
 * alfabéticas de «x1 und»: nadie va a teclear a mano trescientas cantidades,
 * así que se envían tal cual y el pedido no dice lo que de verdad hace falta.
 *
 * ## De dónde sale la propuesta
 *
 * No de una fórmula inventada: de lo que el fundador **ya decidió**. Hay 611
 * reglas de stock configuradas, cada una con su mínimo y su cantidad a pedir,
 * y hasta ahora no las miraba nadie al montar un pedido.
 *
 * El orden va de la decisión más explícita a la más circunstancial:
 *
 * 1. **La cantidad a pedir de su regla.** Es literalmente la respuesta a «¿de
 *    esto, cuánto pido?», escrita por quien conoce la barra.
 * 2. **Lo que falta para el mínimo.** Si hay regla con mínimo y el stock está
 *    por debajo, se propone la diferencia, redondeada hacia arriba: pedir 1,4
 *    botellas no significa nada.
 * 3. **Uno.** Como siempre, pero **diciendo que es el valor por defecto**, no
 *    disfrazándolo de recomendación.
 *
 * Y una cosa que no hace: **proponer cero**. Una línea a cero es una línea que
 * no debería estar en el pedido; si sobra, se quita, no se pide nada de ella.
 */

export interface ReglaStock {
    ingredientId?: string;
    minStock?: number;
    reorderQuantity?: number;
    active?: boolean;
}

export type MotivoCantidad = 'regla' | 'hasta-el-minimo' | 'defecto';

export interface SugerenciaCantidad {
    cantidad: number;
    motivo: MotivoCantidad;
    /** Frase corta para que el número no aparezca sin explicación. */
    explicacion: string;
}

const num = (v: any): number => {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : 0;
};

export const sugerirCantidad = (
    regla?: ReglaStock,
    stockActual?: number,
): SugerenciaCantidad => {
    // Una regla desactivada es una decisión de no automatizar: se respeta.
    const activa = regla && regla.active !== false ? regla : undefined;

    const aPedir = num(activa?.reorderQuantity);
    if (aPedir > 0) {
        return {
            cantidad: aPedir,
            motivo: 'regla',
            explicacion: `Tu regla pide ${aPedir} de este producto.`,
        };
    }

    const minimo = num(activa?.minStock);
    const stock = Math.max(0, Number(stockActual) || 0);
    if (minimo > 0 && stock < minimo) {
        const falta = Math.ceil(minimo - stock);
        return {
            cantidad: Math.max(1, falta),
            motivo: 'hasta-el-minimo',
            explicacion: `Te faltan ${falta} para llegar a tu mínimo de ${minimo}.`,
        };
    }

    return {
        cantidad: 1,
        motivo: 'defecto',
        explicacion: 'Sin regla para este producto: 1 por defecto.',
    };
};

/** Índice de reglas por ingrediente, para no recorrer 611 en cada línea. */
export const indiceDeReglas = (reglas: ReglaStock[]): Map<string, ReglaStock> => {
    const m = new Map<string, ReglaStock>();
    for (const r of reglas || []) {
        if (r?.ingredientId) m.set(r.ingredientId, r);
    }
    return m;
};
