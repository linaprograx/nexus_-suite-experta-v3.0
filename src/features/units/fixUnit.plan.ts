import { Ingredient } from '../../types';
import { calculateIngredientPrice } from '../../utils/costCalculator';

/**
 * I1 — Planificador de la corrección de formato. **Puro: no escribe nada.**
 *
 * Existe separado de la escritura por la misma razón que `mergeMaster.plan`:
 * se puede razonar sobre lo que va a pasar, y probarlo, sin tocar Firestore.
 *
 * La corrección responde a una sola pregunta —«¿de cuántos ml es este
 * envase?»— y de ella se deduce todo lo demás. Nadie teclea el precio por
 * mililitro: sale del precio del envase dividido entre la cantidad, con la
 * merma aplicada, exactamente igual que en el resto del motor.
 */

export interface PlanCorreccionUnidad {
    id: string;
    nombre: string;

    unidadAnterior?: string;
    cantidadAnterior?: number;
    precioBaseAnterior?: number;

    unidadNueva: string;
    cantidadNueva: number;
    precioBaseNuevo?: number;

    /** Precio del envase del que se deduce todo. Si falta, no hay corrección posible. */
    precioEnvase: number;
    merma: number;

    /** Variación del precio por unidad base, en tanto por ciento. */
    impactoPct?: number;
    /** Motivo por el que el plan no puede ejecutarse. Vacío = ejecutable. */
    bloqueo?: string;
}

const num = (v: any): number => {
    const n = typeof v === 'string' ? parseFloat(String(v).replace(',', '.')) : v;
    return typeof n === 'number' && isFinite(n) && n > 0 ? n : 0;
};

/** Unidades base admitidas. Coinciden con las del motor de coste. */
export const UNIDADES_BASE = ['ml', 'g', 'und'] as const;
export type UnidadBase = typeof UNIDADES_BASE[number];

export const planificarCorreccion = (
    ing: Partial<Ingredient>,
    cantidad: number,
    unidad: UnidadBase,
): PlanCorreccionUnidad => {
    const precioEnvase = num((ing as any).precioCompra) || num((ing as any).costo);
    const merma = num((ing as any).merma ?? (ing as any).wastePercentage) || 0;
    const precioBaseAnterior = num(ing.standardPrice) || undefined;

    const precioBaseNuevo = precioEnvase > 0 && cantidad > 0
        ? calculateIngredientPrice(precioEnvase, cantidad, merma)
        : undefined;

    let bloqueo: string | undefined;
    if (!(cantidad > 0)) {
        bloqueo = 'La cantidad tiene que ser mayor que cero.';
    } else if (precioEnvase <= 0) {
        // Sin precio de envase, corregir el formato no arregla el coste: seguiría
        // saliendo a cero. Es el problema M1, no este.
        bloqueo = 'Esta ficha no tiene precio de compra, así que corregir el formato '
            + 'no cambiaría su coste: seguiría saliendo a cero. Primero hay que darle precio.';
    }

    return {
        id: ing.id!,
        nombre: ing.nombre || 'Sin nombre',
        unidadAnterior: ing.standardUnit,
        cantidadAnterior: num(ing.standardQuantity) || undefined,
        precioBaseAnterior,
        unidadNueva: unidad,
        cantidadNueva: cantidad,
        precioBaseNuevo,
        precioEnvase,
        merma,
        impactoPct: precioBaseAnterior && precioBaseNuevo
            ? ((precioBaseNuevo - precioBaseAnterior) / precioBaseAnterior) * 100
            : undefined,
        bloqueo,
    };
};

/**
 * Formatos que se ofrecen de un toque, por unidad base.
 *
 * No son una regla ni un valor por defecto: son los tamaños que más se repiten
 * detrás de una barra, puestos ahí para ahorrar teclear. El que no encaje se
 * escribe a mano, y ninguno se aplica solo.
 */
export const FORMATOS_HABITUALES: Record<UnidadBase, number[]> = {
    ml: [700, 750, 1000, 500, 200, 1500],
    g: [1000, 500, 250, 5000],
    und: [1, 6, 12, 24],
};
