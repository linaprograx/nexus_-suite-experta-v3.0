import { Recipe, Ingredient, PurchaseEvent } from '../../types';
import { calculateRecipeCost } from './costCalculator';
import {
    BusinessCostSettings, RecipeCostOverrides, RecipeProfitability,
    LineaDeCoste, VariableServiceCost, DirectAdditionalCost,
} from './profitability.types';
import {
    AJUSTES_COSTE_POR_DEFECTO, nivelRentabilidad, redondearPrecio,
} from './businessCostSettings';

/**
 * Rentabilidad completa de una receta. **Punto único de cálculo.**
 *
 * Las pantallas consumen este resultado y no rehacen fórmulas. Esa es la razón
 * de existir del módulo: los peores fallos de este proyecto han salido siempre
 * de la misma cosa calculada en dos sitios que fueron divergiendo — el margen se
 * pintaba con un umbral en una vista y con otro en la de al lado.
 *
 * El coste de ingredientes **no se recalcula aquí**: se delega en
 * `calculateRecipeCost`, que sigue siendo la fuente única. Este módulo solo
 * añade capas por encima.
 *
 * ## Compatibilidad
 *
 * Una receta sin ninguno de los campos nuevos, con los ajustes por defecto,
 * produce: `realServedCost === ingredientCost`, `netRevenue === precioVenta`, y
 * el mismo margen de siempre. No hay migración que hacer: los ausentes valen 0.
 *
 * ## Orden de acumulación
 *
 * ```
 *   ingredientCost
 * + directAdditionalCost      → directRecipeCost   (base del beverage cost)
 * + wasteCost                 (% sobre directRecipeCost)
 * + variableServiceCost       (fijos + % sobre el precio cobrado)
 * + laborCost                 (opcional, ESTIMACIÓN)
 * = realServedCost
 * + overheadCost              (opcional, IMPUTACIÓN)
 * = fullOperatingCost
 * ```
 *
 * Los impuestos **no entran en el coste**. Se descuentan del ingreso, que es
 * donde ocurren: meter el IVA soportado en el coste de la receta produce una
 * lectura contable falsa, porque buena parte es recuperable.
 */

export interface EntradaRentabilidad {
    recipe: Partial<Recipe>;
    allIngredients: Ingredient[];
    allRecipes?: Recipe[];
    /** Si se pasa, el coste de ingredientes usa compras reales en vez de catálogo. */
    purchaseHistory?: PurchaseEvent[];
    settings?: Partial<BusinessCostSettings>;
    /** Sobrescrituras de la receta. Si no se pasan, se leen de la propia receta. */
    overrides?: RecipeCostOverrides;
    /** Fuerza el precio de venta (p. ej. un simulador). Por defecto, el de la receta. */
    precioVenta?: number;
}

const num = (v: any): number => {
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    return typeof n === 'number' && isFinite(n) ? n : 0;
};

/** Suma de los consumibles directos: unitario × cantidad. */
const sumarAdicionales = (lista: DirectAdditionalCost[] = []): number =>
    lista.reduce((a, c) => a + num(c.costeUnitario) * (num(c.cantidad) || 1), 0);

/**
 * Comisiones. Las fijas son un importe por operación; las porcentuales se
 * aplican **sobre el precio que cobra el cliente**, que es sobre lo que cobran
 * de verdad las pasarelas y plataformas — no sobre el ingreso neto.
 */
const sumarVariables = (lista: VariableServiceCost[] = [], precioCobrado: number): number =>
    lista.reduce((a, c) => a + (c.tipo === 'percentage'
        ? precioCobrado * (num(c.valor) / 100)
        : num(c.valor)), 0);

export const calculateRecipeProfitability = (entrada: EntradaRentabilidad): RecipeProfitability => {
    const { recipe, allIngredients, allRecipes = [], purchaseHistory } = entrada;
    const s: BusinessCostSettings = { ...AJUSTES_COSTE_POR_DEFECTO, ...(entrada.settings || {}) };

    // GLOBAL DEFAULT → RECIPE OVERRIDE
    const ov: RecipeCostOverrides = entrada.overrides || (recipe as any)?.costes || {};

    // ── 1. Ingredientes (fuente única: no se recalcula aquí)
    const ingredientCost = calculateRecipeCost(recipe, allIngredients, purchaseHistory, allRecipes).costoTotal || 0;

    // ── 2. Consumibles directos
    const adicionales = ov.costesDirectosAdicionales || [];
    const directAdditionalCost = sumarAdicionales(adicionales);
    const directRecipeCost = ingredientCost + directAdditionalCost;

    // ── 3. Merma. Opcional por diseño: 0 si nadie la ha configurado.
    const mermaPct = ov.porcentajeMerma !== undefined ? num(ov.porcentajeMerma) : num(s.porcentajeMermaDefault);
    const wasteCost = directRecipeCost * (mermaPct / 100);

    // ── 4. Ingresos e impuestos. Se resuelven antes que las comisiones porque
    //      las porcentuales se calculan sobre el precio cobrado.
    const precioVenta = entrada.precioVenta !== undefined ? num(entrada.precioVenta) : num(recipe?.precioVenta);
    const tasa = num(s.taxRateVenta);

    let netRevenue: number;
    let taxAmount: number;
    let precioFinalCliente: number;

    if (s.precioIncluyeImpuestos) {
        netRevenue = tasa > 0 ? precioVenta / (1 + tasa) : precioVenta;
        taxAmount = precioVenta - netRevenue;
        precioFinalCliente = precioVenta;
    } else {
        netRevenue = precioVenta;
        taxAmount = precioVenta * tasa;
        precioFinalCliente = precioVenta + taxAmount;
    }

    // ── 5. Comisiones de venta
    const variables = ov.costesVariablesServicio || s.costesVariablesDefault || [];
    const variableServiceCost = sumarVariables(variables, precioFinalCliente);

    // ── 6. Mano de obra. ESTIMACIÓN, y opcional: fuera salvo que se active.
    const incluirMO = ov.incluirManoObra !== undefined ? ov.incluirManoObra : s.incluirManoObraPorDefecto;
    const minutos = num(ov.tiempoPreparacionMinutos);
    const laborCost = incluirMO && minutos > 0 ? (minutos / 60) * num(s.costeLaboralHora) : 0;

    // ── 7. Coste real servido
    const realServedCost = directRecipeCost + wasteCost + variableServiceCost + laborCost;

    // ── 8. Estructura. IMPUTACIÓN: se muestra aparte, nunca mezclada.
    const overheadCost = num(s.overheadPorServicio) + realServedCost * (num(s.overheadPercentage) / 100);
    const fullOperatingCost = realServedCost + overheadCost;

    // ── 9. Resultado
    const grossProfit = netRevenue - realServedCost;
    const operatingProfit = netRevenue - fullOperatingCost;
    const pct = (parte: number) => (netRevenue > 0 ? (parte / netRevenue) * 100 : 0);
    const grossMarginPercentage = pct(grossProfit);
    const operatingMarginPercentage = pct(operatingProfit);
    const beverageCostPercentage = pct(directRecipeCost);
    const contributionMargin = netRevenue - (directRecipeCost + wasteCost + variableServiceCost);

    // ── 10. Precio objetivo. Sugerencia: nunca toca el precio guardado.
    const objetivoPct = num(ov.targetBeverageCostPercentage) || num(s.targetBeverageCostPercentage);
    const precioObjetivoNetoBruto = objetivoPct > 0 ? directRecipeCost / (objetivoPct / 100) : 0;
    const precioObjetivoNeto = redondearPrecio(precioObjetivoNetoBruto, s.redondeoPrecio);
    const precioObjetivoCliente = redondearPrecio(
        s.precioIncluyeImpuestos ? precioObjetivoNetoBruto * (1 + tasa) : precioObjetivoNetoBruto,
        s.redondeoPrecio,
    );

    // El margen que corresponde al objetivo de coste: si buscas un 20% de coste,
    // el margen equivalente es 80%. Así el nivel se juzga contra TU objetivo.
    const margenObjetivo = 100 - objetivoPct;

    const lineas: LineaDeCoste[] = [
        { concepto: 'Ingredientes', importe: ingredientCost, origen: 'real' },
        ...adicionales.map((c): LineaDeCoste => ({
            concepto: c.nombre || 'Coste adicional',
            importe: num(c.costeUnitario) * (num(c.cantidad) || 1),
            origen: 'real',
        })),
        ...(wasteCost > 0 ? [{ concepto: `Merma (${mermaPct}%)`, importe: wasteCost, origen: 'estimado' as const }] : []),
        ...variables.map((c): LineaDeCoste => ({
            concepto: c.nombre || 'Comisión',
            importe: c.tipo === 'percentage' ? precioFinalCliente * (num(c.valor) / 100) : num(c.valor),
            origen: 'real',
        })),
        ...(laborCost > 0 ? [{ concepto: `Mano de obra (${minutos} min)`, importe: laborCost, origen: 'estimado' as const }] : []),
    ];
    const desglose = lineas.filter(l => l.importe > 0 || l.concepto === 'Ingredientes');

    return {
        ingredientCost, directAdditionalCost, directRecipeCost,
        wasteCost, variableServiceCost, laborCost,
        realServedCost, overheadCost, fullOperatingCost,
        precioVenta, taxAmount, netRevenue, precioFinalCliente,
        grossProfit, operatingProfit,
        grossMarginPercentage, operatingMarginPercentage, beverageCostPercentage,
        contributionMargin,
        precioObjetivoNeto, precioObjetivoCliente,
        nivel: nivelRentabilidad(grossMarginPercentage, margenObjetivo),
        desglose,
        soloIngredientes: directAdditionalCost === 0 && wasteCost === 0
            && variableServiceCost === 0 && laborCost === 0 && overheadCost === 0,
    };
};
