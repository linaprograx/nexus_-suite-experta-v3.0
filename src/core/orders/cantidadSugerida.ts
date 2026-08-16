import { huecoHastaElMaximo } from '../stock/nivelDeStock';

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
 *
 * ## El techo recorta, pero nunca bloquea
 *
 * Si la regla tiene `maxStock`, la propuesta se recorta a lo que cabe debajo
 * del techo: no tiene sentido proponer 6 botellas cuando el usuario ha escrito
 * que no quiere pasar de 8 y ya tiene 5.
 *
 * Recorta la **propuesta**, no la línea. Si ya está en el techo se sigue
 * proponiendo 1 y se dice por qué, en vez de dejar la casilla a cero o impedir
 * escribir. Quien tiene una fiesta el sábado sabe algo que la regla no sabe, y
 * una regla de stock no puede vetar una compra.
 */

export interface ReglaStock {
    ingredientId?: string;
    minStock?: number;
    maxStock?: number;
    reorderQuantity?: number;
    active?: boolean;
}

export type MotivoCantidad = 'regla' | 'hasta-el-minimo' | 'defecto' | 'hasta-el-maximo' | 'ya-en-el-maximo';

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
    const stock = Math.max(0, Number(stockActual) || 0);

    const base = ((): SugerenciaCantidad => {
        const aPedir = num(activa?.reorderQuantity);
        if (aPedir > 0) {
            return {
                cantidad: aPedir,
                motivo: 'regla',
                explicacion: `Tu regla pide ${aPedir} de este producto.`,
            };
        }

        const minimo = num(activa?.minStock);
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
    })();

    return recortarPorElTecho(base, activa, stock);
};

/**
 * Recorta la propuesta a lo que cabe bajo el techo. Nunca por debajo de 1: ver
 * la cabecera, la propuesta se ajusta pero la línea no se veta.
 */
const recortarPorElTecho = (
    propuesta: SugerenciaCantidad,
    regla: ReglaStock | undefined,
    stock: number,
): SugerenciaCantidad => {
    const hueco = huecoHastaElMaximo(regla, stock);
    if (hueco === undefined) return propuesta; // sin techo declarado, nada que recortar

    const maximo = num(regla?.maxStock);
    if (hueco <= 0) {
        return {
            cantidad: 1,
            motivo: 'ya-en-el-maximo',
            explicacion: `Ya tienes ${stock} y tu máximo es ${maximo}. Pide solo si sabes algo que la regla no sabe.`,
        };
    }
    if (propuesta.cantidad <= hueco) return propuesta;

    const recortada = Math.max(1, Math.floor(hueco));
    return {
        cantidad: recortada,
        motivo: 'hasta-el-maximo',
        explicacion: `Recortado a ${recortada}: con ${stock} en stock, es lo que cabe bajo tu máximo de ${maximo}.`,
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
