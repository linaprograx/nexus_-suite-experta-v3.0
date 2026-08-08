/**
 * Modelo de rentabilidad de receta.
 *
 * Hasta ahora el proyecto usaba una sola palabra —«coste»— para cosas
 * distintas: el coste de los ingredientes, el coste de servir, el coste con
 * estructura imputada. Eso impide razonar: no se puede comparar el margen de
 * dos recetas si «coste» significa algo distinto en cada pantalla.
 *
 * Aquí cada concepto tiene su nombre, y el orden de la lista es el orden en que
 * se acumulan.
 *
 * **Nada de esto es obligatorio.** Una receta sin ninguno de estos campos
 * produce exactamente el mismo número que antes: los añadidos valen 0 y el
 * `realServedCost` coincide con el `ingredientCost`. La compatibilidad no es un
 * añadido, es el caso por defecto.
 */

/** De dónde sale una cifra. Un dato medido y una imputación no valen igual. */
export type OrigenDelDato =
    /** Medido: ingredientes, consumibles con precio, comisiones contratadas. */
    | 'real'
    /** Estimado: mano de obra, merma sin medir. */
    | 'estimado'
    /** Imputado: estructura repartida por servicio. */
    | 'imputado';

/**
 * Un coste que se consume al servir la receta pero no es un ingrediente.
 * Hielo premium, pajita, envase de reparto, humo aromático, nitrógeno.
 */
export interface DirectAdditionalCost {
    id: string;
    nombre: string;
    categoria?: string;
    costeUnitario: number;
    cantidad: number;
    proveedor?: string;
    notas?: string;
}

/**
 * Un coste que solo existe si la venta ocurre, pero que no forma parte física
 * de la bebida: comisión de TPV, de plataforma, de reparto.
 */
export interface VariableServiceCost {
    id: string;
    nombre: string;
    categoria?: string;
    /** `fixed` = importe por operación. `percentage` = % sobre el precio cobrado. */
    tipo: 'fixed' | 'percentage';
    valor: number;
}

/**
 * Configuración del negocio.
 *
 * Estos valores **no pertenecen a la receta**: son del local. La receta puede
 * sobrescribir alguno cuando tenga sentido (patrón GLOBAL DEFAULT → RECIPE
 * OVERRIDE), pero el sitio natural del IVA o del coste laboral es el negocio.
 *
 * Ningún supuesto fiscal va escrito en el código: el tipo impositivo y si el
 * precio lo incluye son configuración, porque cambian por país y por régimen.
 */
export interface BusinessCostSettings {
    moneda: string;

    /** Tipo impositivo de la VENTA, en tanto por uno (0.10 = 10%). */
    taxRateVenta: number;
    /** Si el precio que ve el cliente ya lleva impuestos incluidos. */
    precioIncluyeImpuestos: boolean;

    /** Objetivo de coste de bebida sobre ingreso neto, en % (20 = 20%). */
    targetBeverageCostPercentage: number;

    /** Merma por defecto, en % del coste directo. 0 = no aplicar. */
    porcentajeMermaDefault: number;

    costeLaboralHora: number;
    /** La mano de obra es una ESTIMACIÓN: fuera del coste técnico salvo que se pida. */
    incluirManoObraPorDefecto: boolean;

    /** Estructura imputada por servicio, en importe fijo… */
    overheadPorServicio: number;
    /** …o como % del coste real servido. Se aplica el que sea > 0; si ambos, se suman. */
    overheadPercentage: number;

    /** Comisiones que aplican a todas las recetas salvo que se sobrescriban. */
    costesVariablesDefault: VariableServiceCost[];

    /** Redondeo de los precios sugeridos. 0.5 = a medios euros. */
    redondeoPrecio: number;
}

/** Campos que una receta puede sobrescribir del negocio. Todos opcionales. */
export interface RecipeCostOverrides {
    costesDirectosAdicionales?: DirectAdditionalCost[];
    /** Sobrescribe `porcentajeMermaDefault`. */
    porcentajeMerma?: number;
    costesVariablesServicio?: VariableServiceCost[];
    tiempoPreparacionMinutos?: number;
    /** Sobrescribe `incluirManoObraPorDefecto` para esta receta. */
    incluirManoObra?: boolean;
    /** Sobrescribe `targetBeverageCostPercentage`. */
    targetBeverageCostPercentage?: number;
}

/** Una línea del desglose, con su procedencia. */
export interface LineaDeCoste {
    concepto: string;
    importe: number;
    origen: OrigenDelDato;
}

/** Clasificación de rentabilidad. Los umbrales viven en un solo sitio. */
export type NivelRentabilidad = 'excelente' | 'saludable' | 'ajustada' | 'baja' | 'critica';

/**
 * Resultado completo. Lo consumen las pantallas **sin recalcular nada**: si una
 * vista necesita un número que no está aquí, se añade aquí, no en la vista.
 */
export interface RecipeProfitability {
    // ── Costes, en orden de acumulación
    ingredientCost: number;
    directAdditionalCost: number;
    /** Ingredientes + adicionales. Es la base del beverage cost. */
    directRecipeCost: number;
    wasteCost: number;
    variableServiceCost: number;
    laborCost: number;
    /** Lo que cuesta de verdad entregar una unidad, antes de estructura. */
    realServedCost: number;
    overheadCost: number;
    fullOperatingCost: number;

    // ── Ingresos
    precioVenta: number;
    taxAmount: number;
    /** Ingreso atribuible al negocio, sin impuestos. Base de todos los márgenes. */
    netRevenue: number;
    /** Lo que paga el cliente, con impuestos incluidos. */
    precioFinalCliente: number;

    // ── Resultado
    grossProfit: number;
    operatingProfit: number;
    grossMarginPercentage: number;
    operatingMarginPercentage: number;
    beverageCostPercentage: number;
    /** Ingreso neto menos costes variables atribuibles. Base del punto de equilibrio. */
    contributionMargin: number;

    // ── Ayudas
    /** Precio NETO que cumpliría el objetivo de coste de bebida. */
    precioObjetivoNeto: number;
    /** El mismo precio, ya en lo que vería el cliente. */
    precioObjetivoCliente: number;
    nivel: NivelRentabilidad;

    /** El desglose listo para pintar, con la procedencia de cada línea. */
    desglose: LineaDeCoste[];
    /** `true` si la receta no aporta ningún dato más allá de los ingredientes. */
    soloIngredientes: boolean;
}
