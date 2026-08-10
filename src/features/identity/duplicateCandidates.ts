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

/** Palabras de envase y formato: nunca identifican nada. Se descartan. */
const RUIDO = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'y', 'con', 'sin', 'para',
    'cl', 'ml', 'l', 'lt', 'lts', 'litro', 'litros', 'g', 'gr', 'kg', 'kgs',
    'botella', 'botellas', 'bot', 'und', 'ud', 'uds', 'unidad', 'unidades',
    'pack', 'caja', 'cajas', 'bandeja', 'bj', 'pz', 'pza', 'mj', 'manojo',
    'x', 'ud.', 'c', 'cc',
]);

/**
 * **Tipos de producto.** Describen la familia, no el producto.
 *
 * Se conservan en la clave —«LICOR CAFÉ» no es «SIROPE CAFÉ»— pero **no
 * cuentan como identidad por sí solos**. Sin esta distinción, el detector
 * proponía fusionar `LICOR` con `LICOR 43`, y sacaba como variantes cercanas
 * a `LICOR AVALLEN`, `LICOR CAFE`, `LICOR ANCHO REYES` y a todo lo que llevara
 * la palabra. Compartir la familia no es evidencia de ser el mismo producto.
 */
const GENERICOS = new Set([
    'licor', 'vodka', 'whisky', 'whiskey', 'ron', 'rum', 'ginebra', 'gin',
    'tequila', 'mezcal', 'raicilla', 'pisco', 'brandy', 'coñac', 'conac', 'cognac',
    'vermut', 'vermouth', 'bitter', 'bitters', 'anis', 'orujo', 'cava', 'vino',
    'cerveza', 'sidra', 'sake', 'destilado', 'destilados', 'aguardiente',
    'zumo', 'jugo', 'sirope', 'jarabe', 'pure', 'nectar', 'refresco', 'tonica',
    'agua', 'soda', 'gaseosa', 'concentrado', 'mixer', 'mixers',
    'cafe', 'te', 'infusion', 'leche', 'crema', 'nata', 'azucar', 'sal',
    'fruta', 'frutas', 'verdura', 'verduras', 'hortaliza', 'hortalizas',
]);

const sinAcentos = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const esNumero = (t: string) => /^[0-9]+([.,][0-9]+)?$/.test(t) || /^[0-9]+(cl|ml|l|g|kg)$/.test(t);

/**
 * Tokens que identifican al producto.
 *
 * Los números se descartan porque casi siempre son formato («70», «0.7»,
 * «700ml»)… **salvo cuando son lo único específico que hay**. En «LICOR 43» el
 * 43 es la marca, y descartarlo dejaba el nombre reducido a «licor», idéntico
 * al de un producto llamado simplemente «LICOR».
 */
export const tokensFuertes = (nombre: string): string[] => {
    const brutos = sinAcentos((nombre || '').toLowerCase())
        .replace(/[^a-z0-9\s.]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .filter(t => t.length > 1 && !RUIDO.has(t));

    const especificos = brutos.filter(t => !GENERICOS.has(t) && !esNumero(t));
    const genericos = brutos.filter(t => GENERICOS.has(t));
    const numeros = brutos.filter(t => esNumero(t));

    // Sin nada específico, los números recuperan su papel identificador.
    return especificos.length > 0
        ? [...especificos, ...genericos]
        : [...numeros, ...genericos];
};

/** ¿Este nombre dice algo más que su familia? Si no, no se agrupa con nadie. */
export const tieneIdentidadPropia = (tokens: string[]): boolean =>
    tokens.some(t => !GENERICOS.has(t));

/** Tokens compartidos que de verdad significan algo (sin contar la familia). */
const comunesEspecificos = (a: Set<string>, b: Set<string>): string[] =>
    [...a].filter(t => b.has(t) && !GENERICOS.has(t));

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
    /** Productos de nombre parecido pero con alguna palabra que los distingue.
     *  Se muestran como contexto y NUNCA se fusionan. */
    variantes: FichaCandidata[];
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
    tokensNucleo: string[],
): { riesgo: RiesgoFusion; motivo: string } => {
    // El núcleo exige el conjunto de palabras IDÉNTICO, así que dos fichas
    // llamadas «LICOR CAFE» sí son candidatas. Pero si el nombre entero es
    // genérico no describe un producto concreto, y eso pide ojo humano.
    if (!tieneIdentidadPropia(tokensNucleo)) {
        return {
            riesgo: 'ALTO',
            motivo: `El nombre está compuesto solo por palabras de familia (${tokensNucleo.join(', ')}), `
                + 'sin marca ni variedad que distinga. Coinciden del todo, pero conviene mirarlo.',
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
            motivo: 'Mismo nombre y misma categoría, con el formato escrito de forma distinta. '
                + 'Hay que normalizar unidades (I1) antes de sumar existencias.',
        };
    }

    return { riesgo: 'BAJO', motivo: 'Mismo nombre, misma categoría y mismo formato.' };
};

/**
 * Suma de existencias.
 *
 * Primero el caso fácil, que es el más común y el que la primera versión se
 * saltaba: **si todas las fichas usan la misma cadena de unidad, sumar es
 * trivialmente correcto** aunque esa cadena no se sepa convertir a una base.
 * Seis «0.700 L» más uno «0.700 L» son siete «0.700 L», y para eso no hace
 * falta I1. Exigir la conversión ahí bloqueaba fusiones que eran seguras.
 *
 * I1 solo hace falta cuando las unidades se escriben distinto.
 */
const simular = (fichas: FichaCandidata[]): GrupoCandidato['simulacion'] => {
    const conStock = fichas.filter(f => f.stockCantidad > 0);
    if (conStock.length === 0) {
        return { sumable: true, cantidad: 0, base: '—', valor: 0 };
    }

    const unidades = new Set(conStock.map(f => (f.stockUnidad || '').trim().toLowerCase()));
    const valor = conStock.reduce((a, f) => a + f.stockValor, 0);

    if (unidades.size === 1) {
        return {
            sumable: true,
            cantidad: conStock.reduce((a, f) => a + f.stockCantidad, 0),
            base: conStock[0].stockUnidad,
            valor,
        };
    }

    // Unidades distintas: solo se pueden sumar si se convierten a la misma base.
    const normalizadas = conStock.map(f => ({ f, n: normalizeToBase(f.stockCantidad, f.stockUnidad) }));
    const bases = new Set(normalizadas.map(x => x.n.base));

    if (bases.has('unknown')) {
        const cuales = normalizadas.filter(x => x.n.base === 'unknown').map(x => `"${x.f.stockUnidad}"`);
        return {
            sumable: false,
            motivo: `Las unidades se escriben distinto y no se puede convertir ${cuales.join(', ')} `
                + 'a una base común. Hasta normalizar unidades (I1), sumar sería inventar.',
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
        valor,
    };
};

export const detectarCandidatos = (e: Entrada): GrupoCandidato[] => {
    const conTokens = e.allIngredients
        .filter(i => i?.id && i?.nombre)
        .map(i => ({ ing: i, tokens: tokensFuertes(i.nombre), clave: tokensFuertes(i.nombre).slice().sort().join(' ') }))
        .filter(x => x.tokens.length > 0);

    /**
     * El núcleo de un grupo son SOLO los nombres con el mismo conjunto exacto de
     * palabras fuertes. «ABSOLUT VODKA» y «VODKA ABSOLUT» comparten núcleo;
     * «VODKA ABSOLUT MANDARINA» no, porque trae una palabra de más.
     *
     * La primera versión agrupaba también a los parecidos, y el resultado fue
     * que MANDARINA contaminaba el grupo entero y bloqueaba la fusión legítima
     * de los otros dos. Seguro, pero inútil: el informe se llenaba de bloqueos
     * sin proponer nada. Ahora la variante se muestra al lado, como contexto.
     */
    const porClave = new Map<string, typeof conTokens>();
    for (const x of conTokens) {
        if (!porClave.has(x.clave)) porClave.set(x.clave, []);
        porClave.get(x.clave)!.push(x);
    }

    // Índice por token para localizar variantes sin comparar todos contra todos.
    const porToken = new Map<string, typeof conTokens>();
    for (const x of conTokens) {
        for (const t of x.tokens) {
            if (!porToken.has(t)) porToken.set(t, []);
            porToken.get(t)!.push(x);
        }
    }

    const grupos: GrupoCandidato[] = [];

    for (const [clave, miembros] of porClave.entries()) {
        if (miembros.length < 2) continue;   // sin duplicado, no hay nada que informar

        const setNucleo = new Set(miembros[0].tokens);

        // Variantes: comparten alguna palabra, pero traen o les faltan otras.
        const vistas = new Set<string>();
        const variantes: typeof conTokens = [];
        for (const t of setNucleo) {
            for (const v of porToken.get(t) || []) {
                if (v.clave === clave || vistas.has(v.ing.id)) continue;
                const setV = new Set(v.tokens);
                // La familia compartida NO cuenta: que dos cosas sean «licor» no
                // las acerca. Hace falta al menos una palabra específica en común.
                const comunes = comunesEspecificos(setNucleo, setV);
                const distintos = [...setNucleo].filter(k => !setV.has(k)).length
                    + [...setV].filter(k => !setNucleo.has(k)).length;
                // Cerca, pero no igual. Más de dos palabras de diferencia ya es otro producto.
                if (comunes.length >= 1 && distintos <= 2) {
                    vistas.add(v.ing.id);
                    variantes.push(v);
                }
            }
        }

        const fichas = miembros.map(m => construirFicha(m.ing, e));
        const { riesgo, motivo } = evaluarRiesgo(fichas, miembros[0].tokens);

        /**
         * Maestro propuesto = **la ficha con más historia** (compras, y recetas
         * con triple peso). Absorber hacia la que menos referencias tiene
         * multiplicaría el trabajo de reconciliación.
         *
         * Deliberadamente **NO se elige por precio**. El maestro es una
         * identidad, no una oferta: tras la fusión tendrá las dos ofertas en
         * `supplierData`, y qué precio manda lo decide `offerSelection.ts`
         * —proveedor preferente, y si no, el más barato—. Elegir el maestro
         * por precio no cambia el precio resultante y sí empeora lo único que
         * esta decisión gobierna de verdad: cuántos documentos quedan
         * apuntando al alias.
         */
        const maestro = [...fichas].sort((a, b) =>
            (b.compras + b.recetas.length * 3) - (a.compras + a.recetas.length * 3)
        )[0].id;

        grupos.push({
            clave,
            fichas,
            variantes: variantes.map(v => construirFicha(v.ing, e)),
            riesgo,
            motivo,
            maestroPropuesto: maestro,
            simulacion: simular(fichas),
        });
    }

    const orden: Record<RiesgoFusion, number> = { BAJO: 0, MEDIO: 1, ALTO: 2, BLOQUEADO: 3 };
    return grupos.sort((a, b) => orden[a.riesgo] - orden[b.riesgo] || a.clave.localeCompare(b.clave));
};
