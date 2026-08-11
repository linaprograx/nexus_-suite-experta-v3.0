import { Ingredient, Recipe, IngredientLineItem } from '../../types';
import { normalizeToBase, parsePackFromText, sanePackSize } from '../../utils/packNormalization';

/**
 * I1 — Auditoría de unidades. **Informe en seco: no escribe nada.**
 *
 * ## El problema que audita
 *
 * `resolveStandardPack` **nunca falla**: si no encuentra evidencia, devuelve
 * «botella de 700 ml» como valor por defecto. Ese número acaba en
 * `standardQuantity`, que es el divisor de `standardPrice` —el precio por
 * unidad base— y por tanto entra en el coste de todas las recetas que usen ese
 * ingrediente.
 *
 * Es decir: un producto del que no se sabe el formato **no aparece como
 * desconocido, aparece como una botella de 700 ml**, y su coste por mililitro
 * sale de esa suposición. Con un catálogo importado por CSV, eso puede afectar
 * a cientos de fichas sin que nada lo indique.
 *
 * ## Lo que hace este módulo
 *
 * Repetir la resolución **anotando de dónde sale cada cifra**, que es lo único
 * que distingue un dato de una suposición. Nada se corrige aquí: se clasifica.
 */

/** De dónde sale el formato propuesto. Determina si se puede confiar en él. */
export type OrigenFormato =
    | 'explicito'      // el documento ya trae cantidad + unidad canónicas
    | 'formato'        // parseado del texto de «unidad de compra» («0,700 L»)
    | 'nombre'         // parseado del nombre del producto («… 200 ML»)
    | 'supuesto'       // unidad desnuda («kg», «l») → se asume 1 kg / 700 ml
    | 'contradictorio' // el documento dice una cosa y su unidad de compra otra
    | 'heredado'       // 700 ml exactos y ninguna evidencia: huella del defecto
    | 'defecto';       // ninguna evidencia → no se propone nada

export type VeredictoUnidad = 'correcto' | 'ajustable' | 'BLOQUEADO';

export interface FilaUnidad {
    id: string;
    nombre: string;
    /** Texto crudo de unidad de compra, tal cual está guardado. */
    unidadActual: string;
    unidadBaseActual?: string;
    cantidadActual?: number;
    precioBaseActual?: number;

    origen: OrigenFormato;
    unidadPropuesta: string;
    cantidadPropuesta: number;
    /** Cuántas unidades base contiene un envase, según la propuesta. */
    factor: number;
    precioBaseResultante?: number;

    stockCantidad: number;
    stockUnidad: string;
    stockValor: number;

    recetas: string[];
    subRecetas: string[];

    /** Variación del precio por unidad base, en tanto por ciento. */
    impactoPct?: number;
    veredicto: VeredictoUnidad;
    motivo: string;
}

const num = (v: any): number => {
    const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
    return typeof n === 'number' && isFinite(n) && n > 0 ? n : 0;
};

/**
 * Resuelve el formato **diciendo de dónde lo saca**.
 *
 * Es `resolveStandardPack` paso a paso, pero sin su paso final: aquí, cuando no
 * hay evidencia, se devuelve `defecto` y quien llame decide. Inventar un número
 * y no decirlo es justo lo que hay que dejar de hacer.
 */
export const resolverFormatoConOrigen = (ing: Partial<Ingredient>): {
    origen: OrigenFormato; unidad: string; cantidad: number;
} => {
    const nombre = ing.nombre || '';
    const texto = (ing as any).unidadCompra || '';

    const norm = (q: number, u: string) => {
        const n = sanePackSize(normalizeToBase(q, u));
        return n.base === 'unknown' ? null : { unidad: n.base as string, cantidad: n.qty };
    };

    const guardado = num(ing.standardQuantity) > 0 && ing.standardUnit
        ? norm(num(ing.standardQuantity), ing.standardUnit) : null;
    const delTexto = texto ? (parsePackFromText(texto) ?? null) : null;
    const textoNorm = delTexto ? norm(delTexto.qty, delTexto.unit) : null;
    const delNombre = nombre ? (parsePackFromText(nombre) ?? null) : null;
    const nombreNorm = delNombre ? norm(delNombre.qty, delNombre.unit) : null;

    /**
     * El valor guardado NO se cree a ciegas.
     *
     * `standardQuantity` pudo escribirlo `resolveStandardPack` en una pasada
     * anterior… incluyendo su valor por defecto. Un 700 guardado es
     * indistinguible de un 700 inventado, así que hay que contrastarlo con lo
     * que diga el texto del envase.
     */
    if (guardado) {
        if (textoNorm) {
            const mismaBase = textoNorm.unidad === guardado.unidad;
            const ratio = Math.max(textoNorm.cantidad, guardado.cantidad)
                / Math.max(1e-9, Math.min(textoNorm.cantidad, guardado.cantidad));
            // Discrepan de verdad: no es un redondeo, es un dato que no cuadra.
            if (!mismaBase || ratio > 1.2) {
                return { origen: 'contradictorio', unidad: '—', cantidad: 0 };
            }
        } else if (!nombreNorm && guardado.unidad === 'ml' && guardado.cantidad === 700) {
            // La huella exacta del valor por defecto, sin nada que la respalde.
            return { origen: 'heredado', unidad: 'ml', cantidad: 700 };
        }
        return { origen: 'explicito', ...guardado };
    }

    if (textoNorm) return { origen: 'formato', ...textoNorm };
    if (nombreNorm) return { origen: 'nombre', ...nombreNorm };

    // Unidad desnuda: se sabe la magnitud, no el tamaño del envase.
    if (texto) {
        const desnuda = normalizeToBase(1, texto);
        if (desnuda.base === 'g') return { origen: 'supuesto', unidad: 'g', cantidad: 1000 };
        if (desnuda.base === 'ml') return { origen: 'supuesto', unidad: 'ml', cantidad: 700 };
        if (desnuda.base === 'und') return { origen: 'explicito', unidad: 'und', cantidad: 1 };
    }

    return { origen: 'defecto', unidad: '—', cantidad: 0 };
};

/** Recorre líneas de receta incluyendo sub-recetas anidadas. */
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

interface Entrada {
    ingredients: Ingredient[];
    stockItems: Array<{ ingredientId: string; quantityAvailable: number; unit: string; totalValue: number }>;
    recipes: Recipe[];
}

/**
 * El informe. **Solo lectura.**
 *
 * Un ítem sale `BLOQUEADO` cuando su formato no se puede determinar con
 * certeza, o cuando la corrección sería tan grande que lo más probable es que
 * el dato de origen esté corrupto. En ninguno de los dos casos se propone valor.
 */
export const auditarUnidades = (e: Entrada): FilaUnidad[] => {
    const stockPorId = new Map(e.stockItems.map(s => [s.ingredientId, s]));

    /**
     * Qué recetas usan cada ingrediente, resuelto de una vez.
     *
     * Recorrer las recetas dentro del bucle de ingredientes son 1.300 × 30
     * pasadas reconstruyendo las mismas listas de líneas. Aquí es al revés: se
     * recorren las recetas una sola vez y se indexa por ingrediente.
     */
    const usoPorIngrediente = new Map<string, { recetas: string[]; subRecetas: string[] }>();
    for (const r of e.recipes) {
        const esPrep = r.categorias?.includes('Preparación') || r.categorias?.includes('Garnish');
        const vistos = new Set<string>();
        for (const linea of lineasDe(r)) {
            const id = linea.ingredientId;
            // Una receta que repite el mismo ingrediente en dos líneas se cuenta
            // una vez: aquí interesa «qué recetas dependen de esta ficha».
            if (!id || vistos.has(id)) continue;
            vistos.add(id);
            let uso = usoPorIngrediente.get(id);
            if (!uso) { uso = { recetas: [], subRecetas: [] }; usoPorIngrediente.set(id, uso); }
            (esPrep ? uso.subRecetas : uso.recetas).push(r.nombre);
        }
    }

    return e.ingredients.filter(i => i?.id).map(ing => {
        const { origen, unidad, cantidad } = resolverFormatoConOrigen(ing);
        const stock = stockPorId.get(ing.id);

        const { recetas, subRecetas } = usoPorIngrediente.get(ing.id) ?? { recetas: [], subRecetas: [] };

        const precioPack = num((ing as any).precioCompra);
        const precioBaseActual = num(ing.standardPrice) || undefined;
        const precioBaseResultante = cantidad > 0 && precioPack > 0 ? precioPack / cantidad : undefined;
        const impactoPct = precioBaseActual && precioBaseResultante
            ? ((precioBaseResultante - precioBaseActual) / precioBaseActual) * 100
            : undefined;

        let veredicto: VeredictoUnidad;
        let motivo: string;

        if (origen === 'contradictorio') {
            veredicto = 'BLOQUEADO';
            motivo = `El documento guarda ${ing.standardQuantity} ${ing.standardUnit}, pero su unidad de `
                + `compra dice «${(ing as any).unidadCompra}». No cuadran, y no hay forma de saber cuál `
                + 'de los dos es el bueno sin mirar el producto.';
        } else if (origen === 'heredado') {
            veredicto = 'BLOQUEADO';
            motivo = 'Guarda exactamente 700 ml y no hay nada que lo respalde: ni en la unidad de compra '
                + 'ni en el nombre. Es la huella del valor por defecto, así que probablemente nadie '
                + 'llegó a decir cuál es su formato.';
        } else if (origen === 'defecto') {
            veredicto = 'BLOQUEADO';
            motivo = 'No hay ninguna pista del formato: ni en la unidad de compra ni en el nombre. '
                + 'Hoy el sistema le asigna en silencio una botella de 700 ml, y ese número divide '
                + 'al precio. Hay que decidirlo a mano.';
        } else if (origen === 'supuesto') {
            veredicto = 'BLOQUEADO';
            motivo = `La unidad («${(ing as any).unidadCompra}») dice la magnitud pero no el tamaño del `
                + `envase. Se está asumiendo ${cantidad} ${unidad}. Puede ser correcto o puede no serlo: `
                + 'decisión humana.';
        } else if (impactoPct !== undefined && Math.abs(impactoPct) > 500) {
            veredicto = 'BLOQUEADO';
            motivo = `El formato propuesto cambiaría el precio por unidad base un ${impactoPct.toFixed(0)}%. `
                + 'Una diferencia así no es un ajuste: apunta a un dato corrupto en origen.';
        } else if (impactoPct === undefined || Math.abs(impactoPct) < 0.5) {
            veredicto = 'correcto';
            motivo = origen === 'explicito'
                ? 'El documento ya trae cantidad y unidad canónicas.'
                : 'El formato deducido coincide con el guardado.';
        } else {
            veredicto = 'ajustable';
            motivo = `El formato se deduce ${origen === 'formato' ? 'de la unidad de compra' : 'del nombre'} `
                + `y corrige el precio por unidad base un ${impactoPct.toFixed(1)}%.`;
        }

        return {
            id: ing.id,
            nombre: ing.nombre || 'Sin nombre',
            unidadActual: (ing as any).unidadCompra || '—',
            unidadBaseActual: ing.standardUnit,
            cantidadActual: num(ing.standardQuantity) || undefined,
            precioBaseActual,
            origen,
            unidadPropuesta: unidad,
            cantidadPropuesta: cantidad,
            factor: cantidad,
            precioBaseResultante,
            stockCantidad: stock?.quantityAvailable ?? 0,
            stockUnidad: stock?.unit || '—',
            stockValor: stock?.totalValue ?? 0,
            recetas,
            subRecetas,
            impactoPct,
            veredicto,
            motivo,
        };
    });
};

export interface ResumenUnidades {
    total: number;
    correctos: number;
    ajustables: number;
    bloqueados: number;
    /** Bloqueados que además están dentro de alguna receta: los urgentes. */
    bloqueadosEnRecetas: number;
    /** Cuánto valor de inventario cuelga de fichas bloqueadas. */
    valorEnBloqueados: number;
}

export const resumirUnidades = (filas: FilaUnidad[]): ResumenUnidades => ({
    total: filas.length,
    correctos: filas.filter(f => f.veredicto === 'correcto').length,
    ajustables: filas.filter(f => f.veredicto === 'ajustable').length,
    bloqueados: filas.filter(f => f.veredicto === 'BLOQUEADO').length,
    bloqueadosEnRecetas: filas.filter(f => f.veredicto === 'BLOQUEADO'
        && (f.recetas.length > 0 || f.subRecetas.length > 0)).length,
    valorEnBloqueados: filas.filter(f => f.veredicto === 'BLOQUEADO')
        .reduce((a, f) => a + f.stockValor, 0),
});
