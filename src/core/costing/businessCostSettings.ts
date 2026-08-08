import { BusinessCostSettings, NivelRentabilidad } from './profitability.types';

/**
 * Configuración de costes del negocio: valores por defecto y umbrales.
 *
 * **Un solo sitio.** Antes los umbrales estaban repartidos: `pricingEngine`
 * multiplicaba el coste por 3, 4 y 5; `utils/costCalculator` sugería precio con
 * un 70% escrito a mano; `costFormatter` pintaba verde a partir del 75% y
 * amarillo del 67%. Tres criterios distintos para «¿esto es rentable?», y
 * ninguno configurable. Aquí se unifican.
 *
 * **Sin supuestos fiscales de ningún país.** El tipo impositivo por defecto es
 * 0 y `precioIncluyeImpuestos` es `true`, que es lo que hace que una app sin
 * configurar se comporte **exactamente como antes**: sin impuestos, el ingreso
 * neto es el precio. Poner aquí un 21% español cambiaría los números de todas
 * las recetas existentes sin que nadie lo haya pedido.
 */
export const AJUSTES_COSTE_POR_DEFECTO: BusinessCostSettings = {
    moneda: 'EUR',

    // Neutro a propósito: sin configurar, no se altera ningún cálculo previo.
    taxRateVenta: 0,
    precioIncluyeImpuestos: true,

    targetBeverageCostPercentage: 20,

    // 0 = no aplicar merma. El punto 3 pide que NO sea obligatoria.
    porcentajeMermaDefault: 0,

    costeLaboralHora: 0,
    incluirManoObraPorDefecto: false,

    overheadPorServicio: 0,
    overheadPercentage: 0,

    costesVariablesDefault: [],

    redondeoPrecio: 0.5,
};

/**
 * Umbrales de rentabilidad, en margen bruto sobre ingreso neto.
 *
 * Se expresan **en relación al objetivo del negocio**, no en absoluto: un bar de
 * coctelería y uno de vinos no comparten el mismo listón. `objetivo` es el
 * margen que corresponde al `targetBeverageCostPercentage` configurado.
 */
export const nivelRentabilidad = (
    margenBrutoPct: number,
    objetivoPct: number,
): NivelRentabilidad => {
    if (!isFinite(margenBrutoPct)) return 'critica';
    if (margenBrutoPct >= objetivoPct) return 'excelente';
    if (margenBrutoPct >= objetivoPct - 8) return 'saludable';
    if (margenBrutoPct >= objetivoPct - 18) return 'ajustada';
    if (margenBrutoPct > 0) return 'baja';
    return 'critica';
};

/** Etiquetas y color de cada nivel. También en un solo sitio. */
export const ETIQUETA_NIVEL: Record<NivelRentabilidad, { texto: string; clase: string }> = {
    excelente: { texto: 'Excelente', clase: 'text-emerald-600 dark:text-emerald-400' },
    saludable: { texto: 'Saludable', clase: 'text-teal-600 dark:text-teal-400' },
    ajustada: { texto: 'Ajustada', clase: 'text-amber-600 dark:text-amber-400' },
    baja: { texto: 'Baja', clase: 'text-orange-600 dark:text-orange-400' },
    critica: { texto: 'Crítica', clase: 'text-rose-600 dark:text-rose-400' },
};

/** Redondea un precio según la regla del negocio. `0` deja el valor intacto. */
export const redondearPrecio = (valor: number, paso: number): number => {
    if (!paso || paso <= 0) return valor;
    return Math.round(valor / paso) * paso;
};
