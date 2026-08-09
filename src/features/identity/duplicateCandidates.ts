import { Ingredient, Recipe, StockRule, StockMovement, PurchaseEvent, IngredientLineItem } from '../../types';
import { StockItem } from '../../utils/stockUtils';
import { normalizeToBase } from '../../utils/packNormalization';

/**
 * Detección de CANDIDATOS a producto duplicado. **Solo lectura, y solo
 * candidatos.**
 *
 * La similitud de texto se usa para *proponer*, nunca para decidir. Esa
 * distinción es todo el módulo: `IngredientListPanel` ya agrupa por parecido de
 * nombre y por eso Mercado enseña «N opc.», pero ese mismo parecido metería
 * ABSOLUT VODKA y ABSOLUT MANDARINA en el mismo saco. Aquí, en cuanto aparece
 * un token que distingue, el grupo sale **BLOQUEADO** y no se propone fusión.
 *
 * Nada de lo que hay aquí escribe en Firestore.
 */

/** Palabras que no distinguen un producto de otro: formato, envase, relleno. */
const RUIDO = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'para',
    'cl', 'ml', 'l', 'lt', 'lts', 'litro', 'litros', 'g', 'gr', 'kg', 'kgs',
    'botella', 'botellas', 'bot', 'und', 'ud', 'uds', 'unidad', 'unidades',
    'pack', 'caja', 'cajas', 'bandeja', 'bj', 'pz', 'pza', 'mj', 'manojo',
    'x', 'ud.', 'c', 'cc',
]);

const sinAcentos = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/** Tokens que de verdad identifican al producto: sin ruido y sin números. */
export const tokensFuertes = (nombre: string): string[] => {
    const limpio = sinAcentos((nombre || '').toLowerCase())
        .replace(/[^a-z0-9\s.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return limpio
        .split(' ')
        .filter(t => t.length > 1)
        .filter(t => !RUIDO.has(t))
        // Un número suelto (70, 0.7, 700) es formato, no identidad.
        .filter(t => !/^[0-9]+([.,][0-9]+)?$/.test(t))
        .filter(t => !/^[0-9]+(cl|ml|l|g|kg)$/.test(t));
};

export type RiesgoFusion = 'BAJO' | 'MEDIO' | 'ALTO' | 'BLOQUEADO';

export interface FichaCandidata {
    id: string;
    nombre: string;
    familia: string;
    categoria: string;
    /** Unidad de consumo declarada en el catálogo. */
    unidad: string;
    /** Formato de compra tal cual está guardado — a menudo NO es una unidad. */
    formato: string;
    standardPrice?: number;
    precioCompra?: number;
    stockCantidad: number;
    stockUnidad: string;
    stockValor: number;
    compras: number;
    importeCompras: number;
    movimientos: number;
    tieneRegla: boolean;
    reglaMin?: number;
    recetas: string[];
    subRecetas: string[];
    proveedores: string[];
}

export interface GrupoCandidato {
    clave: string;
    fichas: FichaCandidata[];
    riesgo: RiesgoFusion;
    motivo: string;
    /** Ficha propuesta como maestra. `null` si el grupo está bloqueado. */
    maestroPropuesto: string | null;
    /** Suma de stock, solo si las unidades son comparables. */
    simulacion: { sumable: true; cantidad: number; base: string; valor: number }
    | { sumable: false; motivo: string };
}

interface Entrada {
    allIngredients: Ingredient[];
    allRecipes: Recipe[];
    stockItems: StockItem[];
    purchases: PurchaseEvent[];
    movements: StockMovement[];
    rules: StockRule[];
}

/** Recorre líneas de receta incluyendo sub-recetas y garnish anidados. */
const lineasDe = (r: Recipe): IngredientLineItem[] => {
    const salida: IngredientLineItem[] = [];
    const visitar = (lista: any[]) => {
        for (const l of lista || []) {
            salida.push(l);
            if (l?.subItems?.length) visitar(l.subItems);
        }
    };
    visitar((r.ingredientes as any[]) || []);
    return salida;
};

const construirFicha = (ing: Ingredient, e: Entrada): FichaCandidata => {
    const stock = e.stockItems.find(s => s.ingredientId === ing.id);
    const comprasDe = e.purchases.filter(p => p.ingredientId === ing.id);
    const regla = e.rules.find(r => r.ingredientId === ing.id);

    const recetas: string[] = [];
    const subRecetas: string[] = [];
    for (const r of e.allRecipes) {
        const usa = lineasDe(r).some(l => l.ingredientId === ing.id);
        if (!usa) continue;
        const esPreparacion = r.categorias?.includes('Preparación') || r.categorias?.includes('Garnish');
        (esPreparacion ? subRecetas : recetas).push(r.nombre);
    }

    const proveedores = new Set<string>();
    (ing.proveedores || []).forEach(p => proveedores.add(p));
    if ((ing as any).proveedor) proveedores.add((ing as any).proveedor);
    Object.keys(ing.supplierData || {}).forEach(p => proveedores.add(p));

    return {
        id: ing.id,
        nombre: ing.nombre,
        familia: ing.familia || '—',
        categoria: ing.categoria || '—',
        unidad: ing.unidad || '—',
        formato: (ing as any).unidadCompra || '—',
        standardPrice: ing.standardPrice,
        precioCompra: (ing as any).precioCompra,
        stockCantidad: stock?.quantityAvailable ?? 0,
        stockUnidad: stock?.unit || '—',
        stockValor: stock?.totalValue ?? 0,
        compras: comprasDe.length,
        importeCompras: comprasDe.reduce(
            (a, p) => a + ((p as any).totalCost || (p.quantity || 0) * ((p as any).unitPrice || 0)), 0),
        movimientos: e.movements.filter(m => m.ingredientId === ing.id).length,
        tieneRegla: !!regla,
        reglaMin: regla?.minStock,
        recetas,
        subRecetas,
        proveedores: Array.from(proveedores),
    };
};

/**
 * Decide el riesgo de fusionar un grupo. **Conservador por diseño:** ante
 * cualquier duda, BLOQUEADO. Prefiero cien grupos bloqueados que una fusión
 * equivocada, porque la fusión equivocada se lleva por delante recetas.
 */
const evaluarRiesgo = (
    fichas: FichaCandidata[],
    hayTokenDistintivo: boolean,
): { riesgo: RiesgoFusion; motivo: string } => {
    if (hayTokenDistintivo) {
        return {
            riesgo: 'BLOQUEADO',
            motivo: 'Los nombres se parecen pero uno tiene una palabra que el otro no '
                + '(sabor, variedad, color…). Puede ser otro producto — como ABSOLUT VODKA '
                + 'frente a ABSOLUT MANDARINA. Decisión humana.',
        };
    }

    const categorias = new Set(fichas.map(f => f.categoria));
    if (categorias.size > 1) {
        return {
            riesgo: 'ALTO',
            motivo: `Mismo nombre pero categorías distintas (${Array.from(categorias).join(' · ')}). `
                + 'Puede ser una mala clasificación o dos productos distintos.',
        };
    }

    const formatos = new Set(fichas.map(f => `${f.formato}|${f.stockUnidad}`));
    if (formatos.size > 1) {
        return {
            riesgo: 'MEDIO',
            motivo: 'Mismo producto con formatos escritos de forma distinta. '
                + 'Requiere normalizar unidades (I1) antes de sumar existencias.',
        };
    }

    return { riesgo: 'BAJO', motivo: 'Mismo nombre, misma categoría y mismo formato.' };
};

/** Suma de existencias, solo si las unidades se pueden convertir a una base común. */
const simular = (fichas: FichaCandidata[]): GrupoCandidato['simulacion'] => {
    const conStock = fichas.filter(f => f.stockCantidad > 0);
    if (conStock.length === 0) {
        return { sumable: true, cantidad: 0, base: '—', valor: 0 };
    }

    const normalizadas = conStock.map(f => ({
        f,
        n: normalizeToBase(f.stockCantidad, f.stockUnidad),
    }));

    const bases = new Set(normalizadas.map(x => x.n.base));
    if (bases.has('unknown')) {
        const cuales = normalizadas.filter(x => x.n.base === 'unknown').map(x => `"${x.f.stockUnidad}"`);
        return {
            sumable: false,
            motivo: `No se puede convertir ${cuales.join(', ')} a una unidad base. `
                + 'Es el bloqueo de I1: hasta normalizar unidades, sumar sería inventar.',
        };
    }
    if (bases.size > 1) {
        return {
            sumable: false,
            motivo: `Unidades de bases distintas (${Array.from(bases).join(' y ')}). No se suman.`,
        };
    }

    return {
        sumable: true,
        cantidad: normalizadas.reduce((a, x) => a + x.n.qty, 0),
        base: Array.from(bases)[0],
        valor: conStock.reduce((a, f) => a + f.stockValor, 0),
    };
};

/**
 * Devuelve los grupos candidatos, ordenados por gravedad: primero lo que se
 * puede resolver, al final lo bloqueado.
 */
export const detectarCandidatos = (e: Entrada): GrupoCandidato[] => {
    const conTokens = e.allIngredients
        .filter(i => i?.id && i?.nombre)
        .map(i => ({ ing: i, tokens: tokensFuertes(i.nombre) }))
        .filter(x => x.tokens.length > 0);

    // Índice por token → ingredientes que lo contienen. Evita comparar todos
    // contra todos: con 1.367 referencias eso serían ~934.000 comparaciones.
    const porToken = new Map<string, typeof conTokens>();
    for (const x of conTokens) {
        for (const t of x.tokens) {
            if (!porToken.has(t)) porToken.set(t, []);
            porToken.get(t)!.push(x);
        }
    }

    const yaAgrupado = new Set<string>();
    const grupos: GrupoCandidato[] = [];

    for (const x of conTokens) {
        if (yaAgrupado.has(x.ing.id)) continue;

        const setX = new Set(x.tokens);
        // Solo se comparan los que comparten al menos un token fuerte.
        const vecinos = new Set<typeof conTokens[number]>();
        for (const t of x.tokens) (porToken.get(t) || []).forEach(v => vecinos.add(v));

        const miembros: typeof conTokens = [];
        let hayTokenDistintivo = false;

        for (const v of vecinos) {
            if (v.ing.id === x.ing.id || yaAgrupado.has(v.ing.id)) continue;
            const setV = new Set(v.tokens);

            const comunes = [...setX].filter(t => setV.has(t));
            if (comunes.length === 0) continue;

            const soloX = [...setX].filter(t => !setV.has(t));
            const soloV = [...setV].filter(t => !setX.has(t));

            // Conjuntos idénticos → mismo producto muy probablemente.
            if (soloX.length === 0 && soloV.length === 0) {
                miembros.push(v);
                continue;
            }

            // Uno contiene al otro y lo que sobra son palabras de verdad:
            // es una VARIANTE, no un duplicado. Se muestra, pero bloqueada.
            if (comunes.length >= 1 && (soloX.length + soloV.length) <= 2) {
                miembros.push(v);
                hayTokenDistintivo = true;
            }
        }

        if (miembros.length === 0) continue;

        const todos = [x, ...miembros];
        todos.forEach(m => yaAgrupado.add(m.ing.id));

        const fichas = todos.map(m => construirFicha(m.ing, e));
        const { riesgo, motivo } = evaluarRiesgo(fichas, hayTokenDistintivo);

        // El maestro propuesto es el que más historia tiene: más compras y más
        // recetas dependiendo de él. Absorber hacia el que menos referencias
        // tiene multiplicaría el trabajo de reconciliación.
        const maestro = riesgo === 'BLOQUEADO'
            ? null
            : [...fichas].sort((a, b) =>
                (b.compras + b.recetas.length * 3) - (a.compras + a.recetas.length * 3)
            )[0].id;

        grupos.push({
            clave: [...setX].sort().join(' '),
            fichas,
            riesgo,
            motivo,
            maestroPropuesto: maestro,
            simulacion: simular(fichas),
        });
    }

    const orden: Record<RiesgoFusion, number> = { BAJO: 0, MEDIO: 1, ALTO: 2, BLOQUEADO: 3 };
    return grupos.sort((a, b) => orden[a.riesgo] - orden[b.riesgo] || a.clave.localeCompare(b.clave));
};
