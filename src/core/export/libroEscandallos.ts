import { Recipe, Ingredient, IngredientLineItem } from '../../types';
import { HojaCarta } from './cartaASheet';
import { resolvePricePerBase, recipeTotalVolume, equivalenciaDeLinea } from '../costing/costCalculator';
import { normalizeToBase } from '../../utils/packNormalization';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

/**
 * El **libro de escandallos**: un Google Sheets de varias pestañas, vivo.
 *
 * Portada · una pestaña por cóctel · Materia Prima. Y todo por fórmula: cambias
 * un precio en Materia Prima y los doce cócteles se recalculan solos. Eso es lo
 * que separa una hoja de trabajo de un PDF con cuadrícula.
 *
 * ## La regla que hace que los números cuadren
 *
 * El precio que va a Materia Prima sale de `resolvePricePerBase`, **la misma
 * función que usa el motor de coste** — ya ajustada por la merma de cada
 * ingrediente y por unidad base. Copiar esa fórmula aquí habría creado una
 * segunda verdad del coste, que es justo lo que este proyecto no se puede
 * permitir: la hoja diría un número y Nexus otro, y los dos parecerían buenos.
 *
 * Por eso también las cantidades se escriben **normalizadas a unidad base**: si
 * la receta dice «3 cl», en la hoja va 30 y la unidad ml. Así la fórmula de cada
 * línea es siempre la misma —`cantidad × precio`— sin casos especiales que
 * dividen entre mil unas veces sí y otras no.
 *
 * ## Lo que la hoja calcula y lo que recibe hecho
 *
 * Calcula lo que es aritmética de escandallo: línea, total, PV neto, % de coste
 * y margen. Lo demás —merma de receta, comisiones, mano de obra, estructura—
 * son ajustes del negocio que vive en Nexus: entran como cifras con su etiqueta,
 * no como una reimplementación del motor de rentabilidad.
 *
 * ## El idioma de las fórmulas
 *
 * La hoja se crea con `locale: es_ES`, así que el separador de argumentos es el
 * punto y coma. Sin fijarlo, Google crea el libro en `en_US`, donde el
 * separador es la coma, y **todas las fórmulas entrarían como texto**.
 */

export type Celda = string | number;

export interface Banda {
    /** Fila 0-indexada donde empieza. */
    fila: number;
    filas?: number;
    col?: number;
    cols?: number;
    color: string;
    textoBlanco?: boolean;
    negrita?: boolean;
    tamano?: number;
    combinar?: boolean;
}

export interface RangoFormato {
    fila: number;
    filas: number;
    col: number;
    cols: number;
}

export interface HojaLibro {
    titulo: string;
    valores: Celda[][];
    anchos: number[];
    bandas: Banda[];
    moneda: RangoFormato[];
    porcentaje: RangoFormato[];
    /** Rango de 2×2 (etiqueta, valor) que alimenta el gráfico de tarta. */
    grafico?: { filaDatos: number; colDatos: number; anclaFila: number; anclaCol: number; ancho?: number; alto?: number };
    /** Columnas de servicio que no se enseñan: los datos del gráfico. */
    columnasOcultas?: Array<{ desde: number; hasta: number }>;
    filaCongelada?: number;
    /**
     * Lo que NO se toca: las celdas calculadas.
     *
     * La plantilla del fundador tiene sus zonas bloqueadas, y con razón — en una
     * hoja viva, escribir un número encima de una fórmula la destruye sin
     * avisar, y a partir de ahí esa celda miente para siempre. Se protege lo
     * calculado y se deja abierto lo que se toca a mano: el PVP, las cantidades
     * y los precios de Materia Prima.
     */
    protegidos?: Array<{ fila: number; filas: number; col: number; cols: number; motivo: string }>;
    /** Marcos alrededor de un bloque, como los recuadros de la plantilla. */
    bordes?: Array<{ fila: number; filas: number; col: number; cols: number; interior?: boolean }>;
    /** Filas con altura propia: la banda del negocio, el recuadro de la foto. */
    alturas?: Array<{ fila: number; px: number }>;
    /** Celdas centradas, para las bandas de título. */
    centradas?: RangoFormato[];
    ocultarCuadricula?: boolean;
}

export interface LibroEscandallo {
    titulo: string;
    hojas: HojaLibro[];
    acento: string;
}

export interface AjustesLibro {
    /** Tasa de venta, en tanto por uno: 0,10 es un 10 %. */
    tasaVenta: number;
    precioIncluyeImpuestos: boolean;
    /** Merma de receta, en porcentaje. Se muestra como línea aparte. */
    mermaReceta: number;
    moneda: string;
}

export const AJUSTES_LIBRO_POR_DEFECTO: AjustesLibro = {
    tasaVenta: 0,
    precioIncluyeImpuestos: true,
    mermaReceta: 0,
    moneda: 'EUR',
};

const MATERIA = 'Materia Prima';

/**
 * La paleta de la plantilla del fundador: azul marino para las bandas, azul
 * claro para las celdas de valor, blanco de fondo. Se copia a propósito — la
 * ficha tiene que reconocerse como suya.
 */
const NAVY = '#1F3864';
const NAVY2 = '#2E5496';
const CABECERA = '#8EA9DB';
const CLARO = '#D9E2F3';
const GRIS = '#F2F2F2';
const ACENTO = NAVY;

/**
 * Un número **para meter dentro de una fórmula** en una hoja en español.
 *
 * El libro se crea con `locale: es_ES`, donde el separador decimal es la coma.
 * Escribir `0.001` dentro de una fórmula la rompe entera: `#ERROR!`. Y no se ve
 * venir, porque en el código el número es perfectamente válido.
 *
 * Es exactamente el mismo problema que el separador de argumentos, y la misma
 * lección: dentro de una fórmula no se escriben números de JavaScript.
 */
export const numeroEnFormula = (n: number): string => String(n).replace('.', ',');

const num = (v: any): number => {
    const n = Number(v);
    return isFinite(n) ? n : 0;
};

const redondear = (n: number, d = 4) => Math.round(n * 10 ** d) / 10 ** d;

/**
 * Nombre de pestaña válido y único.
 *
 * Sheets prohíbe `[ ] * ? / \ :` y limita a 100 caracteres. Y dos pestañas no
 * pueden llamarse igual: si la carta tuviera dos cócteles con el mismo nombre,
 * la creación entera fallaría por un choque que nadie ve venir.
 */
export const nombreDePestana = (bruto: string, usados: Set<string>): string => {
    let base = (bruto || 'Sin nombre').replace(/[[\]*?/\\:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 90);
    if (!base) base = 'Sin nombre';
    let nombre = base;
    let n = 2;
    while (usados.has(nombre.toLowerCase())) nombre = `${base} (${n++})`;
    usados.add(nombre.toLowerCase());
    return nombre;
};

/** Escapa un nombre para usarlo dentro de una fórmula entre comillas simples. */
const paraFormula = (s: string) => s.replace(/'/g, "''");

export interface LineaMateria {
    clave: string;
    nombre: string;
    unidadBase: string;
    /** €/ml, €/g, €/und — ya ajustado por merma. El que usa el motor. */
    precioPorBase: number;
    /** El mismo, en la unidad que lee una persona: €/L, €/kg, €/und. */
    precioLegible: number;
    unidadLegible: string;
    mermaPct: number;
    proveedor: string;
}

/**
 * La clave con la que las fichas buscan en Materia Prima.
 *
 * Es el nombre, porque es lo que se lee en la ficha y lo que hace la hoja
 * comprensible. Como dos productos podrían llamarse igual, se desambigua al
 * construir la tabla: `BUSCARV` se queda con la primera coincidencia y en
 * silencio, así que dejar dos filas iguales sería sembrar un error mudo.
 */
const claveMateria = (nombre: string) => (nombre || 'Sin nombre').trim();

/** Aplana las líneas de una receta, incluidas las de sub-receta. */
const lineasDe = (r: Partial<Recipe>): IngredientLineItem[] =>
    ((r?.ingredientes as IngredientLineItem[]) || []);

const esBloque = (l: IngredientLineItem) => !!(l.isSubRecipe || l.isGarnish || l.subItems?.length);

/**
 * Construye Materia Prima con **los ingredientes que las recetas usan**.
 *
 * Solo lo usado, y por una razón: es la tabla de la que cuelgan las fórmulas.
 * Mil filas que ninguna ficha consulta no hacen la hoja más útil, la hacen más
 * difícil de compartir —cada fila es un precio de compra— y crean una copia
 * grande del catálogo que empieza a envejecer el mismo día.
 */
export const construirMateriaPrima = (
    recetas: Partial<Recipe>[],
    catalogo: Ingredient[],
): LineaMateria[] => {
    const porId = indicePorId(catalogo);
    const usados = new Map<string, LineaMateria>();

    const registrar = (l: IngredientLineItem) => {
        if (esBloque(l)) { (l.subItems || []).forEach(registrar); return; }
        if (!l?.ingredientId) return;

        const maestroId = resolverMaestro(l.ingredientId, porId);
        const ing = porId.get(maestroId) || porId.get(l.ingredientId);
        if (!ing) return;

        const clave = claveMateria(ing.nombre);
        if (usados.has(clave)) return;

        const precio = resolvePricePerBase(ing);
        const base = precio?.base || 'und';
        const porBase = precio ? redondear(precio.pricePerBase, 8) : 0;

        // A la unidad que lee una persona: €/L y €/kg en vez de €/ml y €/g.
        const factor = base === 'und' ? 1 : 1000;
        const unidadLegible = base === 'ml' ? 'L' : base === 'g' ? 'kg' : 'und';

        usados.set(clave, {
            clave,
            nombre: ing.nombre || 'Sin nombre',
            unidadBase: base,
            precioPorBase: porBase,
            precioLegible: redondear(porBase * factor, 4),
            unidadLegible,
            mermaPct: num((ing as any).merma ?? (ing as any).wastePercentage ?? 0),
            proveedor: (ing as any).proveedorPreferente || (ing as any).proveedor || ing.proveedores?.[0] || '',
        });
    };

    for (const r of recetas) lineasDe(r).forEach(registrar);

    return Array.from(usados.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};

export const hojaMateriaPrima = (lineas: LineaMateria[]): HojaLibro => {
    const valores: Celda[][] = [
        ['NEXUS', '', '', '', '', ''],
        [MATERIA.toUpperCase(), '', '', '', '', ''],
        ['Cambia un precio aquí y todas las fichas se recalculan.', '', '', '', '', ''],
        [],
        ['Producto', 'Coste', 'Unidad', 'Por unidad base', 'Merma %', 'Proveedor'],
    ];

    for (const l of lineas) {
        valores.push([
            l.nombre,
            l.precioLegible,
            l.unidadLegible,
            l.precioPorBase,
            l.mermaPct,
            l.proveedor,
        ]);
    }

    return {
        titulo: MATERIA,
        valores,
        anchos: [280, 90, 70, 130, 80, 160],
        bandas: [
            { fila: 1, color: ACENTO, textoBlanco: true, negrita: true, tamano: 16, cols: 6, combinar: true },
            { fila: 4, color: GRIS, negrita: true, cols: 6 },
        ],
        moneda: [{ fila: 5, filas: lineas.length, col: 1, cols: 1 }],
        porcentaje: [],
        filaCongelada: 5,
    };
};

interface FilaLinea {
    nombre: string;
    cantidadBase: number;
    unidadBase: string;
    /** Sin ingrediente en el catálogo: no se puede enlazar y se dice. */
    huerfana: boolean;
    /** Cuántas unidades de precio equivale una unidad de la receta. */
    factor: number;
    /** Hay ficha, pero sus unidades no permiten costear la línea. */
    sinPrecio: boolean;
    nota: string;
}

const normalizarLinea = (l: IngredientLineItem, porId: Map<string, Ingredient>): FilaLinea => {
    const maestro = l.ingredientId ? resolverMaestro(l.ingredientId, porId) : '';
    const ing = maestro ? porId.get(maestro) : undefined;
    const norm = normalizeToBase(num(l.cantidad), l.unidad || 'ml');

    /**
     * El factor que reconcilia las unidades, **traído del motor**.
     *
     * La primera versión escribía `cantidad × precio` a secas, y eso solo vale
     * cuando la receta y el precio están en la misma unidad. «50 g de VAINILLA
     * EN RAMA» con un precio de 2,17 € **por rama** salía a 108,50 €, y de ahí
     * un cóctel de 42,92 €. El motor ya sabía convertir; lo que faltaba era que
     * la hoja usara su misma cuenta en vez de una versión simplificada.
     */
    const eq = ing ? equivalenciaDeLinea(l, ing) : null;

    return {
        nombre: ing?.nombre || l.nombre || 'Sin nombre',
        cantidadBase: norm.base === 'unknown' ? num(l.cantidad) : redondear(norm.qty, 3),
        unidadBase: norm.base === 'unknown' ? (l.unidad || '') : norm.base,
        huerfana: !ing,
        factor: eq ? eq.factor : 1,
        // Sin equivalencia no se puede costear la línea sin inventar: se dice.
        sinPrecio: !!ing && !eq,
        nota: eq?.nota || '',
    };
};

/**
 * Una línea de ingrediente, con su fórmula.
 *
 * `factor` es lo que reconcilia las unidades. Va escrito en la fórmula —y no
 * aplicado a la cantidad— para que la celda siga diciendo lo que dice la
 * receta: «50 g», no «0,5 und». La nota explica la conversión cuando la hay.
 */
const filaDeIngrediente = (d: FilaLinea, f: number): Celda[] => {
    if (d.huerfana) {
        return [d.nombre, d.cantidadBase, d.unidadBase, '', '', 'Sin ficha en el catálogo: no se puede enlazar su precio.'];
    }
    if (d.sinPrecio) {
        return [d.nombre, d.cantidadBase, d.unidadBase, '', '', 'Su ficha no tiene precio o su formato no permite costear esta cantidad.'];
    }
    const busca = `=IFERROR(VLOOKUP($A${f};'${paraFormula(MATERIA)}'!$A:$D;4;FALSE);"")`;
    const coste = d.factor === 1
        ? `=IF(D${f}="";"";B${f}*D${f})`
        : `=IF(D${f}="";"";B${f}*${numeroEnFormula(d.factor)}*D${f})`;
    return [d.nombre, d.cantidadBase, d.unidadBase, busca, coste, d.nota];
};

/**
 * Una pestaña de cóctel, con el diseño de la plantilla del fundador.
 *
 * ## Por qué una rejilla y no una lista de filas
 *
 * La plantilla coloca las **sub-preparaciones a la derecha**, no debajo, y eso
 * no se puede construir empujando filas: hace falta poder escribir en la fila 7
 * columna A y en la fila 7 columna H sin que una decida el ancho de la otra.
 * Así que se escribe sobre una rejilla dispersa y se materializa al final.
 *
 * ## El reparto
 *
 * Columnas A–F: la ficha —economía, gráfico, ingredientes, método y foto—.
 * Columnas H–M: las sub-preparaciones, cada una con su título y su total.
 */
class Rejilla {
    private celdas = new Map<string, Celda>();
    private maxFila = 0;
    poner(fila: number, col: number, valor: Celda) {
        this.celdas.set(`${fila}|${col}`, valor);
        if (fila > this.maxFila) this.maxFila = fila;
    }
    fila(fila: number, col: number, valores: Celda[]) {
        valores.forEach((v, i) => this.poner(fila, col + i, v));
    }
    materializar(cols: number): Celda[][] {
        const salida: Celda[][] = [];
        for (let f = 1; f <= this.maxFila; f++) {
            const linea: Celda[] = [];
            for (let c = 0; c < cols; c++) linea.push(this.celdas.get(`${f}|${c}`) ?? '');
            salida.push(linea);
        }
        return salida;
    }
}

const COL_SUB = 7;               // H
const COL_DATOS = 13;            // N y O: fuera de la ficha, y ocultas
/**
 * Cuántas columnas materializa la rejilla. **Tiene que llegar hasta las de
 * servicio**: con 13 se cortaba justo antes de la N, así que las dos celdas del
 * gráfico se perdían al construir la matriz y el pastel se quedaba sin datos.
 */
const COLS = COL_DATOS + 2;      // A..O

export const hojaDeCoctel = (
    receta: Partial<Recipe>,
    catalogo: Ingredient[],
    ajustes: AjustesLibro,
    titulo: string,
    negocio = 'NEXUS',
): HojaLibro => {
    const porId = indicePorId(catalogo);
    const lineas = lineasDe(receta);
    // Una línea sin nombre y sin ficha no es un ingrediente: es un hueco que
    // quedó en la receta. Pintarla como «Sin nombre · 0 g» ensucia la ficha y
    // no informa de nada.
    const util = (l: FilaLinea) => !!(l.nombre && l.nombre !== 'Sin nombre') || l.cantidadBase > 0;
    const directas = lineas.filter(l => !esBloque(l)).map(l => normalizarLinea(l, porId)).filter(util);
    const bloques = lineas.filter(esBloque);

    const g = new Rejilla();
    const bandas: Banda[] = [];
    const moneda: RangoFormato[] = [];
    const porcentaje: RangoFormato[] = [];
    const protegidos: HojaLibro['protegidos'] = [];
    const bordes: HojaLibro['bordes'] = [];
    const centradas: RangoFormato[] = [];
    const alturas: Array<{ fila: number; px: number }> = [];

    const banda = (fila: number, col: number, cols: number, color: string, opts: Partial<Banda> = {}) =>
        bandas.push({ fila: fila - 1, col, cols, color, textoBlanco: true, negrita: true, ...opts });

    // ── 1. La marca del negocio, arriba y a todo lo ancho.
    g.poner(1, 0, negocio);
    banda(1, 0, COLS, CABECERA, { tamano: 20, combinar: true });
    centradas.push({ fila: 0, filas: 1, col: 0, cols: COLS });
    alturas.push({ fila: 0, px: 46 });

    // ── 2. El nombre del cóctel, resaltado.
    g.poner(3, 0, receta.nombre || 'Sin nombre');
    banda(3, 0, 6, NAVY, { tamano: 16, combinar: true });
    centradas.push({ fila: 2, filas: 1, col: 0, cols: 6 });
    alturas.push({ fila: 2, px: 34 });

    // ── 3. Economía. Etiqueta en azul marino, valor en azul claro, como la
    //       plantilla: se ve de un vistazo qué se escribe y qué se calcula.
    const eco: Array<[string, Celda, 'eur' | 'pct']> = [
        ['PRECIO DE VENTA AL PÚBLICO', num((receta as any).precioVenta) || '', 'eur'],
        ['IMPUESTOS %', ajustes.tasaVenta, 'pct'],
        ['PRECIO DE VENTA NETO', ajustes.precioIncluyeImpuestos ? '=IF(B5="";"";B5/(1+B6))' : '=B5', 'eur'],
    ];
    let f = 5;
    const filaPVP = f;
    eco.forEach(([etiqueta, valor, tipo], i) => {
        g.fila(f + i, 0, [etiqueta, valor]);
        banda(f + i, 0, 1, NAVY, { tamano: 9 });
        bandas.push({ fila: f + i - 1, col: 1, cols: 1, color: CLARO, negrita: false, tamano: 10 });
        (tipo === 'eur' ? moneda : porcentaje).push({ fila: f + i - 1, filas: 1, col: 1, cols: 1 });
    });
    const filaNeto = f + 2;

    f = 9;
    const filaCoste = f, filaPct = f + 1, filaMargen = f + 2;
    const eco2: Array<[string, Celda, 'eur' | 'pct']> = [
        ['COSTO TOTAL DE LA RECETA', 0, 'eur'],
        ['% COSTO DE LA RECETA', `=IF(B${filaNeto}="";"";B${filaCoste}/B${filaNeto})`, 'pct'],
        ['MARGEN DE BENEFICIO NETO', `=IF(B${filaNeto}="";"";B${filaNeto}-B${filaCoste})`, 'eur'],
    ];
    eco2.forEach(([etiqueta, valor, tipo], i) => {
        g.fila(f + i, 0, [etiqueta, valor]);
        banda(f + i, 0, 1, NAVY, { tamano: 9 });
        bandas.push({ fila: f + i - 1, col: 1, cols: 1, color: CLARO, negrita: false, tamano: 10 });
        (tipo === 'eur' ? moneda : porcentaje).push({ fila: f + i - 1, filas: 1, col: 1, cols: 1 });
    });
    protegidos.push({ fila: filaNeto - 1, filas: 1, col: 1, cols: 1, motivo: 'Calculado' });
    protegidos.push({ fila: filaCoste - 1, filas: 3, col: 1, cols: 1, motivo: 'Calculado' });
    bordes.push({ fila: filaPVP - 1, filas: 7, col: 0, cols: 2, interior: true });

    if (ajustes.mermaReceta > 0) {
        g.fila(12, 0, ['MERMA DE RECETA (NEXUS)', ajustes.mermaReceta / 100]);
        banda(12, 0, 1, NAVY2, { tamano: 9 });
        porcentaje.push({ fila: 11, filas: 1, col: 1, cols: 1 });
    }

    /**
     * Los dos datos que alimentan el gráfico, **fuera de la vista**.
     *
     * Estaban en medio del cuadro, y ahí sobran: al pasar el ratón por encima
     * del pastel Google ya enseña la etiqueta y el importe. Teniéndolos escritos
     * al lado, el mismo número aparecía dos veces y el gráfico no podía ocupar
     * su hueco. Se van a dos columnas que después se ocultan, y el gráfico se
     * queda con todo el recuadro.
     */
    g.fila(1, COL_DATOS, ['Coste Total', `=B${filaCoste}`]);
    g.fila(2, COL_DATOS, ['Beneficio Neto', `=B${filaMargen}`]);

    // ── 5. Ingredientes. Cabecera de dos líneas, como la plantilla.
    const filaCab = 14;
    g.fila(filaCab, 0, ['Nombre del producto', 'Cantidad\nGramos/ml', 'Unidad', 'Coste\nKg/Lt/und', 'Coste Total', 'Nota']);
    banda(filaCab, 0, 6, NAVY2, { tamano: 10 });
    centradas.push({ fila: filaCab - 1, filas: 1, col: 1, cols: 4 });
    alturas.push({ fila: filaCab - 1, px: 34 });

    /**
     * Las sub-preparaciones se resuelven **antes** de pintar la tabla, porque
     * cada una es también **una línea de la ficha**.
     *
     * Es como está en la plantilla del fundador, y es lo correcto: «Cordial de
     * frambuesa y romero · 60 ml · 0,42 €» es un ingrediente del cóctel como
     * cualquier otro; lo que va a la derecha es su despiece, no su sustituto.
     * Antes el detalle estaba a la derecha y la línea no estaba en ninguna
     * parte, así que la ficha no cuadraba con su propio total.
     */
    const subPreparadas = bloques.map(b => {
        const sub = (b.subItems || []).map(l => normalizarLinea(l, porId)).filter(util);
        const rendimiento = redondear(recipeTotalVolume({ ingredientes: b.subItems || [] } as any), 3);
        const unidades = Array.from(new Set(sub.map(x => x.unidadBase))).filter(Boolean);
        const usoNorm = normalizeToBase(num(b.cantidad), b.unidad || 'ml');
        return {
            nombre: (b.nombre || 'Sub-preparación'),
            sub,
            rendimiento,
            unidadLote: unidades.length === 1 ? unidades[0] : 'ml/g',
            usado: usoNorm.base === 'unknown' ? num(b.cantidad) : redondear(usoNorm.qty, 3),
            unidadUso: usoNorm.base === 'unknown' ? (b.unidad || '') : usoNorm.base,
            filaLote: 0,   // se rellena al pintar el bloque de la derecha
        };
    });

    const primera = filaCab + 1;
    directas.forEach((d, i) => {
        const fl = primera + i;
        g.fila(fl, 0, filaDeIngrediente(d, fl));
        if (i % 2 === 1) bandas.push({ fila: fl - 1, col: 0, cols: 6, color: CLARO, negrita: false, tamano: 10 });
    });

    // Una línea por sub-preparación, con su coste por unidad traído del lote.
    const filaSubEnFicha = primera + directas.length;
    subPreparadas.forEach((sp, i) => {
        const fl = filaSubEnFicha + i;
        if ((directas.length + i) % 2 === 1) {
            bandas.push({ fila: fl - 1, col: 0, cols: 6, color: CLARO, negrita: false, tamano: 10 });
        }
    });

    const ultima = primera + Math.max(directas.length + subPreparadas.length, 1) - 1;
    const filaTotal = ultima + 1;
    g.fila(filaTotal, 3, ['COSTE TOTAL', `=SUM(E${primera}:E${ultima})`]);
    banda(filaTotal, 0, 6, NAVY, { tamano: 11 });
    moneda.push({ fila: primera - 1, filas: directas.length + 1, col: 3, cols: 2 });
    protegidos.push({ fila: primera - 1, filas: directas.length + 1, col: 3, cols: 2, motivo: 'Calculado' });
    bordes.push({ fila: filaCab - 1, filas: filaTotal - filaCab + 1, col: 0, cols: 6, interior: true });

    // ── 6. Sub-preparaciones, en la columna de la derecha.
    let fs = 5;
    for (const sp of subPreparadas) {
        const { sub, rendimiento, unidadLote } = sp;

        g.poner(fs, COL_SUB, `${sp.nombre.toUpperCase()} (${rendimiento || '?'} ${unidadLote})`);
        banda(fs, COL_SUB, 6, NAVY, { tamano: 11, combinar: true });
        centradas.push({ fila: fs - 1, filas: 1, col: COL_SUB, cols: 6 });

        const cabSub = fs + 1;
        g.fila(cabSub, COL_SUB, ['Nombre del producto', 'Cantidad\nGramos/ml', 'Unidad', 'Coste\nKg/Lt/und', 'Coste Total', 'Nota']);
        banda(cabSub, COL_SUB, 6, NAVY2, { tamano: 10 });
        alturas.push({ fila: cabSub - 1, px: 34 });

        const desde = cabSub + 1;
        sub.forEach((x, i) => {
            const fl = desde + i;
            const celdas = filaDeIngrediente(x, fl);
            // Las fórmulas de la sub-tabla viven en H..M, así que sus
            // referencias van a esas columnas y no a las de la ficha.
            g.fila(fl, COL_SUB, [
                celdas[0], celdas[1], celdas[2],
                x.huerfana || x.sinPrecio ? '' : `=IFERROR(VLOOKUP($H${fl};'${paraFormula(MATERIA)}'!$A:$D;4;FALSE);"")`,
                x.huerfana || x.sinPrecio ? '' : (x.factor === 1
                    ? `=IF(K${fl}="";"";I${fl}*K${fl})`
                    : `=IF(K${fl}="";"";I${fl}*${numeroEnFormula(x.factor)}*K${fl})`),
                celdas[5],
            ]);
            if (i % 2 === 1) bandas.push({ fila: fl - 1, col: COL_SUB, cols: 6, color: CLARO, negrita: false, tamano: 10 });
        });
        const hastaSub = desde + Math.max(sub.length, 1) - 1;
        const filaLote = hastaSub + 1;
        g.fila(filaLote, COL_SUB + 3, ['COSTE TOTAL', `=SUM(L${desde}:L${hastaSub})`]);
        banda(filaLote, COL_SUB, 6, NAVY, { tamano: 11 });
        moneda.push({ fila: desde - 1, filas: sub.length + 1, col: COL_SUB + 3, cols: 2 });
        protegidos.push({ fila: desde - 1, filas: sub.length + 1, col: COL_SUB + 3, cols: 2, motivo: 'Calculado' });
        bordes.push({ fila: fs - 1, filas: filaLote - fs + 1, col: COL_SUB, cols: 6, interior: true });

        // La fila «usado» ya no vive aquí: es una línea de la ficha, a la
        // izquierda. Aquí queda el despiece y su coste de lote, que es lo que
        // esa línea consulta.
        sp.filaLote = filaLote;
        fs = filaLote + 3;
    }

    // Ahora que se conocen las filas de cada lote, se escriben sus líneas.
    subPreparadas.forEach((sp, i) => {
        const fl = filaSubEnFicha + i;
        const porUnidad = sp.rendimiento > 0
            ? `=L${sp.filaLote}/${numeroEnFormula(sp.rendimiento)}`
            : '';
        g.fila(fl, 0, [
            sp.nombre,
            sp.usado,
            sp.unidadUso,
            porUnidad,
            porUnidad ? `=IF(D${fl}="";"";B${fl}*D${fl})` : '',
            `Sub-preparación · rinde ${sp.rendimiento || '?'} ${sp.unidadLote} · detalle a la derecha`,
        ]);
    });

    // El coste de receta es el total de la tabla, sin sumandos aparte: las
    // sub-preparaciones ya son filas suyas.
    g.poner(filaCoste, 1, `=E${filaTotal}`);

    // ── 7. Método y foto, con su recuadro. Las imágenes no se pueden subir por
    //       esta vía, así que el hueco queda hecho y rotulado: es mejor un
    //       marco que espera una foto que un espacio en blanco sin explicar.
    const filaMetodo = Math.max(filaTotal + 2, fs);
    g.poner(filaMetodo, 0, 'MÉTODO Y DESCRIPCIÓN');
    banda(filaMetodo, 0, 4, NAVY2, { tamano: 10, combinar: true });
    g.poner(filaMetodo + 1, 0, (receta as any).descripcion || (receta as any).preparacion || 'Escribe aquí el método de elaboración.');
    bordes.push({ fila: filaMetodo, filas: 9, col: 0, cols: 4 });
    alturas.push({ fila: filaMetodo, px: 150 });

    g.poner(filaMetodo, 4, 'FOTO');
    banda(filaMetodo, 4, 2, NAVY2, { tamano: 10, combinar: true });
    g.poner(filaMetodo + 1, 4, 'Inserta la foto aquí: Insertar → Imagen → Imagen en la celda.');
    bordes.push({ fila: filaMetodo, filas: 9, col: 4, cols: 2 });

    return {
        titulo,
        valores: g.materializar(COLS),
        anchos: [230, 95, 65, 95, 95, 210, 22, 210, 95, 65, 95, 95, 190, 100, 100],
        bandas, moneda, porcentaje, protegidos, bordes, centradas, alturas,
        ocultarCuadricula: true,
        columnasOcultas: [{ desde: COL_DATOS, hasta: COL_DATOS + 2 }],
        // Anclado en la esquina del recuadro y dimensionado para llenarlo.
        /**
         * El gráfico ocupa **exactamente** las columnas D, E y F (95 + 95 + 210
         * = 400 px) desde la fila 4. Medirlo a ojo era lo que hacía que en cada
         * pestaña quedara un poco corrido: un objeto flotante no se alinea solo,
         * hay que darle la medida de su hueco.
         */
        grafico: { filaDatos: 0, colDatos: COL_DATOS, anclaFila: 3, anclaCol: 3, ancho: 400, alto: 220 },
    };
};

/**
 * La pestaña **Resumen**: el diseño de carta que ya existía, reutilizado.
 *
 * No se ha rehecho: se adapta `cartaASheet`, que ya estaba escrito y probado —
 * portada, secciones CON/SIN ALCOHOL, columnas y la barra de coste/beneficio en
 * cada fila. Rehacerlo aquí habría dejado dos diseños de la misma carta que se
 * separarían al primer cambio.
 *
 * Lo único que se añade es la columna que faltaba cuando la carta vivía sola:
 * **un enlace a la pestaña de cada cóctel**.
 */
export const hojaResumen = (
    carta: HojaCarta,
    enlaces: Map<string, string>,
): HojaLibro => {
    const valores: Celda[][] = [];
    const bandas: Banda[] = [];
    const moneda: RangoFormato[] = [];

    carta.lineas.forEach((l, i) => {
        const celdas: Celda[] = [...l.celdas];
        if (l.tipo === 'cabecera') {
            celdas.push('Ficha');
            bandas.push({ fila: i, color: GRIS, negrita: true, cols: celdas.length });
        } else if (l.tipo === 'seccion') {
            bandas.push({ fila: i, color: carta.acento || ACENTO, textoBlanco: true, negrita: true, cols: 7, combinar: true });
        } else if (l.tipo === 'coctel') {
            const nombre = String(l.celdas[0] || '');
            const pestana = enlaces.get(nombre);
            // Un enlace a su ficha. Sin esto, con catorce pestañas hay que
            // buscar a mano la del cóctel que se está mirando.
            celdas.push(pestana ? `=HYPERLINK("#gid=${pestana}";"Ver ficha")` : '');
        }
        valores.push(celdas);
    });

    bandas.unshift({
        fila: 0, filas: carta.filasDePortada, color: carta.acento || ACENTO,
        textoBlanco: true, negrita: true, tamano: 22, cols: 8, combinar: true,
    });
    moneda.push({ fila: carta.filasDePortada, filas: carta.lineas.length, col: 3, cols: 2 });

    return {
        titulo: 'Resumen',
        valores,
        anchos: [...carta.anchos, 90],
        bandas,
        moneda,
        porcentaje: [],
        filaCongelada: carta.filasDePortada,
    };
};

/**
 * El libro entero: **Resumen · una pestaña por cóctel · Materia Prima**.
 *
 * Un solo botón, tres cosas en el mismo sitio. Tenerlos separados obligaba a
 * elegir entre «la carta» y «los escandallos» antes de saber cuál se quería, y
 * eran dos ficheros distintos en el Drive para una misma carta.
 */
export const construirLibro = (
    recetas: Partial<Recipe>[],
    catalogo: Ingredient[],
    ajustes: AjustesLibro,
    meta: { nombre: string; concepto?: string; fecha?: string },
    carta: HojaCarta,
): LibroEscandallo => {
    const usados = new Set<string>(['resumen', MATERIA.toLowerCase()]);
    const hojasCoctel: HojaLibro[] = [];
    const enlaces = new Map<string, string>();

    recetas.forEach((r, i) => {
        const titulo = nombreDePestana(r.nombre || 'Sin nombre', usados);
        hojasCoctel.push(hojaDeCoctel(r, catalogo, ajustes, titulo));
        // El gid de cada pestaña es su índice: Resumen es 0, los cócteles van
        // detrás. Se fija al crear el libro, así que el enlace es estable.
        enlaces.set(r.nombre || 'Sin nombre', String(i + 1));
    });

    const materia = construirMateriaPrima(recetas, catalogo);

    return {
        titulo: `${meta.nombre || 'Carta'} · escandallos`,
        acento: ACENTO,
        hojas: [hojaResumen(carta, enlaces), ...hojasCoctel, hojaMateriaPrima(materia)],
    };
};
