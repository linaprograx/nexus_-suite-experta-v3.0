/**
 * En qué nivel está un ingrediente respecto a la regla que escribió el usuario.
 *
 * ## Lo que faltaba
 *
 * `useStockRules` solo sabía de **mínimo** y de **cantidad a pedir**. Con eso se
 * puede avisar de lo que falta, pero **no de lo que sobra**: no había techo, así
 * que ningún sitio de la app podía decir «de esto tienes de más». Y sobrar
 * también cuesta dinero — es capital parado en una estantería, y en producto
 * fresco es merma esperando a ocurrir.
 *
 * ## Tres decisiones que conviene no deshacer
 *
 * **1. Sin techo declarado no hay sobrestock.** `maxStock` es opcional, y las
 * 611 reglas que ya existen no lo tienen. Si «sin máximo» se tratara como cero,
 * el inventario entero aparecería sobrestockado el día del despliegue. Ausente
 * significa *no lo he decidido*, y entonces este módulo se calla y devuelve
 * exactamente lo que devolvía antes.
 *
 * **2. Sobrar no es una urgencia, así que no se pinta como tal.** Rojo es «no
 * puedes servir». Ámbar es «te vas a quedar sin». Tener de más no impide servir
 * a nadie: es dinero parado. Darle un color de alarma le robaría atención a los
 * dos estados que sí obligan a moverse hoy. Va en un color propio, informativo.
 *
 * **3. Un máximo por debajo del mínimo se rechaza donde se escribe.** Con
 * `max < min` un mismo número estaría a la vez por debajo del mínimo y por
 * encima del máximo: la regla se contradice a sí misma y ningún estado sería
 * cierto. No se «arregla» en silencio invirtiéndolos — eso sería inventar la
 * intención del usuario. Se le dice al escribirlo.
 */

export interface ReglaDeNivel {
    minStock?: number;
    maxStock?: number;
    active?: boolean;
}

/** `desconocido` es un estado de verdad: no hay regla con la que comparar. */
export type NivelStock = 'rotura' | 'bajo' | 'ok' | 'sobrestock' | 'desconocido';

export interface Nivel {
    nivel: NivelStock;
    /** Frase corta para el `title`: el color solo nunca explica nada. */
    titulo: string;
    /** Cuánto sobra por encima del techo. Solo en `sobrestock`. */
    exceso?: number;
}

const num = (v: any): number | undefined => {
    const n = Number(v);
    return isFinite(n) && n > 0 ? n : undefined;
};

/** La regla, solo si está activa. Desactivar es decidir no automatizar. */
const activa = (regla?: ReglaDeNivel): ReglaDeNivel | undefined =>
    regla && regla.active !== false ? regla : undefined;

export const nivelDeStock = (regla: ReglaDeNivel | undefined, cantidad: number): Nivel => {
    // La ruptura es inequívoca en cualquier unidad y no necesita regla.
    if (!(cantidad > 0)) return { nivel: 'rotura', titulo: 'Sin existencias' };

    const r = activa(regla);
    const min = num(r?.minStock);
    const max = num(r?.maxStock);

    if (min === undefined && max === undefined) {
        return { nivel: 'desconocido', titulo: 'Sin regla de stock: no hay con qué comparar' };
    }

    // Una regla contradictoria no se aplica a medias: se dice que está mal.
    if (min !== undefined && max !== undefined && max <= min) {
        return { nivel: 'desconocido', titulo: `Regla contradictoria: máximo ${max} por debajo del mínimo ${min}` };
    }

    // El mínimo manda sobre el máximo: quedarse corto se arregla hoy.
    if (min !== undefined && cantidad < min) {
        return { nivel: 'bajo', titulo: `Por debajo del mínimo de ${min}` };
    }

    if (max !== undefined && cantidad > max) {
        return {
            nivel: 'sobrestock',
            titulo: `Por encima del máximo de ${max}: sobran ${redondear(cantidad - max)}`,
            exceso: redondear(cantidad - max),
        };
    }

    return { nivel: 'ok', titulo: max !== undefined ? `Entre el mínimo y el máximo de ${max}` : 'Por encima del mínimo' };
};

const redondear = (n: number) => Math.round(n * 100) / 100;

/**
 * Cuánto cabe todavía debajo del techo.
 *
 * Devuelve `undefined` cuando no hay techo — que no es lo mismo que cero, y
 * confundirlos dejaría todo pedido en nada.
 */
export const huecoHastaElMaximo = (
    regla: ReglaDeNivel | undefined,
    cantidad: number,
): number | undefined => {
    const r = activa(regla);
    const max = num(r?.maxStock);
    if (max === undefined) return undefined;
    const min = num(r?.minStock);
    if (min !== undefined && max <= min) return undefined; // regla contradictoria: no se aplica
    return redondear(Math.max(0, max - Math.max(0, Number(cantidad) || 0)));
};

/**
 * Si un máximo es aceptable junto a su mínimo. Para validar al escribirlo, que
 * es donde se puede corregir.
 */
export const maximoValido = (min: number | undefined, max: number | undefined): boolean => {
    const mn = num(min);
    const mx = num(max);
    if (mx === undefined) return true; // no declarar techo siempre vale
    return mn === undefined || mx > mn;
};
