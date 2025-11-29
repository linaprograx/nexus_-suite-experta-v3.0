import { getMarginColor } from './costFormatter';

export interface PricingResult {
    precioMinimoRentable: number;
    precioRecomendado: number;
    precioPremium: number;
    marginStatus: 'green' | 'yellow' | 'red';
}

/**
 * Calculates suggested selling prices based on the recipe's cost.
 * @param costoTotal The total cost of the recipe.
 * @param precioVentaActual The current selling price (optional).
 * @returns An object with different pricing tiers and a margin status.
 */
export const calculatePricing = (
    costoTotal: number,
    precioVentaActual?: number | null
): PricingResult => {

    const precioMinimoRentable = costoTotal * 3.0;
    const precioRecomendado = costoTotal * 4.0;
    const precioPremium = costoTotal * 5.0;

    let marginStatus: 'green' | 'yellow' | 'red' = 'red';

    if (precioVentaActual && precioVentaActual > 0) {
        const margin = ((precioVentaActual - costoTotal) / precioVentaActual) * 100;
        marginStatus = getMarginColor(margin);
    } else if (costoTotal === 0) {
        marginStatus = 'green';
    }

    return {
        precioMinimoRentable,
        precioRecomendado,
        precioPremium,
        marginStatus,
    };
};
