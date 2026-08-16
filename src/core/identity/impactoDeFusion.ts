import { Ingredient, Recipe, StockRule } from '../../types';

/**
 * Qué arrastra una fusión. **Solo lee y cuenta. No escribe nada.**
 *
 * Es la condición 2 de las cinco del punto 17: *informe en seco completo antes
 * de escribir un solo documento*. El plan lo dice con todas las letras —
 * «fusionar mal es recetas que pierden ingredientes y escandallos a cero»— y
 * hasta ahora la fusión enseñaba qué se iba a escribir, pero no **qué colgaba
 * de la ficha absorbida**.
 *
 * ## Los dos avisos que este módulo existe para dar
 *
 * Fusionar **no borra** el documento absorbido, así que nada se rompe de golpe.
 * Lo que ocurre es peor de detectar: **se separa en dos silenciosamente.**
 *
 * **1. Las recetas siguen costeando desde el alias.** `costCalculator.ts:149`
 * busca el ingrediente por id y encuentra el documento del alias, que sigue
 * ahí con su precio. Nadie resuelve `masterProductId` en ese camino. Así que
 * el día que actualices el precio en el maestro —el único que Mercado enseña—
 * la receta seguirá con el precio viejo del alias, sin que nada se queje.
 *
 * **2. Las reglas de stock sobre un alias se quedan gritando.** El stock **sí**
 * se consolida en el maestro (`buildCurrentStock` recibe `resolverMaestro`), y
 * `useStockRules` **no** resuelve nada: la regla busca las existencias de un id
 * que ya no tiene ninguna, encuentra cero, y da stock crítico para siempre
 * sobre un producto que está lleno.
 *
 * Ninguno de los dos es motivo para no fusionar. Son motivo para **arreglar la
 * lectura antes**, y para que el informe diga cuántas recetas y cuántas reglas
 * hay detrás de cada ficha en vez de descubrirlo después.
 */

export interface ImpactoFicha {
    id: string;
    nombre: string;
    /** Nombres de las recetas que la referencian. La lista, no solo el número. */
    recetas: string[];
    reglas: number;
    compras: number;
    movimientos: number;
    /** Si nada cuelga de ella, absorberla no arrastra nada. */
    limpia: boolean;
}

export interface ImpactoFusion {
    maestroId: string;
    fichas: ImpactoFicha[];
    /** Recetas que quedarían costeando desde un alias. El aviso 1. */
    recetasEnAlias: number;
    /** Reglas que se quedarían mirando un id sin existencias. El aviso 2. */
    reglasEnAlias: number;
}

interface Referencias {
    recetas: Recipe[];
    reglas: StockRule[];
    compras: { ingredientId?: string }[];
    movimientos: { ingredientId?: string }[];
}

/**
 * Índice de id de ingrediente → nombres de receta que lo usan.
 *
 * Se construye una vez: recorrer 32 recetas por cada una de las 1.326 fichas
 * serían 42.000 recorridos para responder una pregunta que cabe en un mapa.
 */
export const recetasPorIngrediente = (recetas: Recipe[]): Map<string, string[]> => {
    const m = new Map<string, string[]>();
    for (const r of recetas || []) {
        const lineas = (r.ingredientes as any[]) || [];
        // Una receta que use dos veces el mismo ingrediente se cuenta una.
        const vistos = new Set<string>();
        for (const l of lineas) {
            const id = l?.ingredientId;
            if (!id || vistos.has(id)) continue;
            vistos.add(id);
            const lista = m.get(id);
            if (lista) lista.push(r.nombre || 'Sin nombre');
            else m.set(id, [r.nombre || 'Sin nombre']);
        }
    }
    return m;
};

const cuentaPorIngrediente = (filas: { ingredientId?: string }[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const f of filas || []) {
        const id = f?.ingredientId;
        if (!id) continue;
        m.set(id, (m.get(id) || 0) + 1);
    }
    return m;
};

/** Los índices, calculados una vez para todos los grupos del informe. */
export const indicesDeImpacto = (refs: Referencias) => ({
    recetas: recetasPorIngrediente(refs.recetas),
    reglas: cuentaPorIngrediente((refs.reglas || []).map(r => ({ ingredientId: r.ingredientId }))),
    compras: cuentaPorIngrediente(refs.compras),
    movimientos: cuentaPorIngrediente(refs.movimientos),
});

export type IndicesImpacto = ReturnType<typeof indicesDeImpacto>;

/**
 * El impacto de fusionar un grupo con un maestro concreto.
 *
 * `fichas` son TODAS las del grupo, maestro incluido: lo que cuelga del maestro
 * no es un problema —se queda donde está— pero verlo al lado es lo que permite
 * juzgar cuál debería ser el maestro. Si el 90 % de las recetas apunta a la
 * ficha B, hacer maestra a la A es elegir el trabajo de más.
 */
export const impactoDeFusion = (
    fichas: Pick<Ingredient, 'id' | 'nombre'>[],
    maestroId: string,
    idx: IndicesImpacto,
): ImpactoFusion => {
    const detalle: ImpactoFicha[] = (fichas || []).map(f => {
        const recetas = idx.recetas.get(f.id) || [];
        const reglas = idx.reglas.get(f.id) || 0;
        const compras = idx.compras.get(f.id) || 0;
        const movimientos = idx.movimientos.get(f.id) || 0;
        return {
            id: f.id,
            nombre: f.nombre || 'Sin nombre',
            recetas,
            reglas,
            compras,
            movimientos,
            limpia: recetas.length === 0 && reglas === 0 && compras === 0 && movimientos === 0,
        };
    });

    const alias = detalle.filter(f => f.id !== maestroId);
    return {
        maestroId,
        fichas: detalle,
        recetasEnAlias: alias.reduce((s, f) => s + f.recetas.length, 0),
        reglasEnAlias: alias.reduce((s, f) => s + f.reglas, 0),
    };
};

/**
 * Qué ficha del grupo debería ser el maestro, mirando lo que cuelga de cada
 * una. **Es una sugerencia para el informe, no una decisión.** Manda quien
 * fusiona.
 *
 * Gana la que más recetas arrastra, porque cada receta que apunte a un alias es
 * una receta que se queda costeando por libre. A igualdad, la que más historial
 * de compras tiene: es la que el negocio ha usado de verdad.
 */
export const maestroSugerido = (
    fichas: Pick<Ingredient, 'id' | 'nombre'>[],
    idx: IndicesImpacto,
): string | undefined => {
    let mejor: { id: string; recetas: number; compras: number } | undefined;
    for (const f of fichas || []) {
        const recetas = (idx.recetas.get(f.id) || []).length;
        const compras = idx.compras.get(f.id) || 0;
        if (!mejor
            || recetas > mejor.recetas
            || (recetas === mejor.recetas && compras > mejor.compras)) {
            mejor = { id: f.id, recetas, compras };
        }
    }
    // Sin nada que las distinga no se sugiere nada: inventar un ganador daría
    // una autoridad que este cálculo no tiene.
    if (!mejor || (mejor.recetas === 0 && mejor.compras === 0)) return undefined;
    return mejor.id;
};
