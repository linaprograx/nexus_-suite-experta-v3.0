import { Recipe, Ingredient, IngredientLineItem } from '../../types';
import { resolvePricePerBase } from '../costing/costCalculator';
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
    grafico?: { filaDatos: number; colDatos: number; anclaFila: number; anclaCol: number };
    filaCongelada?: number;
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
const ACENTO = '#0d9488';
const GRIS = '#f1f5f9';

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
}

const normalizarLinea = (l: IngredientLineItem, porId: Map<string, Ingredient>): FilaLinea => {
    const maestro = l.ingredientId ? resolverMaestro(l.ingredientId, porId) : '';
    const ing = maestro ? porId.get(maestro) : undefined;
    const norm = normalizeToBase(num(l.cantidad), l.unidad || 'ml');
    return {
        nombre: ing?.nombre || l.nombre || 'Sin nombre',
        cantidadBase: norm.base === 'unknown' ? num(l.cantidad) : redondear(norm.qty, 3),
        unidadBase: norm.base === 'unknown' ? (l.unidad || '') : norm.base,
        huerfana: !ing,
    };
};

/**
 * Una pestaña de cóctel.
 *
 * Todo lo que se puede calcular, se calcula en la hoja. El precio de cada
 * ingrediente se busca en Materia Prima con `BUSCARV`, así que tocar allí un
 * precio mueve esta ficha, el total, el porcentaje de coste y el gráfico.
 */
export const hojaDeCoctel = (
    receta: Partial<Recipe>,
    catalogo: Ingredient[],
    ajustes: AjustesLibro,
    titulo: string,
): HojaLibro => {
    const porId = indicePorId(catalogo);
    const lineas = lineasDe(receta);
    const directas = lineas.filter(l => !esBloque(l)).map(l => normalizarLinea(l, porId));
    const bloques = lineas.filter(esBloque);

    const pvp = num((receta as any).precioVenta);
    const valores: Celda[][] = [];
    const bandas: Banda[] = [];
    const moneda: RangoFormato[] = [];
    const porcentaje: RangoFormato[] = [];

    // ── Cabecera. «NEXUS» arriba a la izquierda, en gris: Sheets no tiene
    //    marcas de agua de verdad, así que es una celda, no un fondo.
    valores.push(['NEXUS', '', '', '', '', '']);
    valores.push([receta.nombre || 'Sin nombre', '', '', '', '', '']);
    bandas.push({ fila: 1, color: ACENTO, textoBlanco: true, negrita: true, tamano: 18, cols: 6, combinar: true });
    valores.push([]);

    // ── Bloque económico. Las filas se numeran para poder referenciarlas.
    const filaPVP = valores.length + 1;
    valores.push(['PVP al público', pvp || '', '', 'Coste', `=B${filaPVP + 4}`, '']);
    const filaTasa = valores.length + 1;
    valores.push(['Impuesto de venta', ajustes.tasaVenta, '', 'Beneficio', `=B${filaPVP + 5}`, '']);
    const filaNeto = valores.length + 1;
    valores.push([
        'PV neto',
        ajustes.precioIncluyeImpuestos
            ? `=IF(B${filaPVP}="";"";B${filaPVP}/(1+B${filaTasa}))`
            : `=IF(B${filaPVP}="";"";B${filaPVP})`,
        '', '', '', '',
    ]);

    const filaCoste = valores.length + 1;
    valores.push(['Coste de receta', 0, '', '', '', '']);      // se rellena al final
    const filaMargen = valores.length + 1;
    valores.push([`Margen bruto`, `=IF(B${filaNeto}="";"";B${filaNeto}-B${filaCoste})`, '', '', '', '']);
    const filaPct = valores.length + 1;
    valores.push(['% de coste', `=IF(B${filaNeto}="";"";B${filaCoste}/B${filaNeto})`, '', '', '', '']);

    moneda.push({ fila: filaPVP - 1, filas: 1, col: 1, cols: 1 });
    moneda.push({ fila: filaNeto - 1, filas: 3, col: 1, cols: 1 });
    moneda.push({ fila: filaPVP - 1, filas: 2, col: 4, cols: 1 });
    porcentaje.push({ fila: filaTasa - 1, filas: 1, col: 1, cols: 1 });
    porcentaje.push({ fila: filaPct - 1, filas: 1, col: 1, cols: 1 });

    if (ajustes.mermaReceta > 0) {
        valores.push(['Merma de receta (Nexus)', ajustes.mermaReceta / 100, '', '', '', '']);
        porcentaje.push({ fila: valores.length - 1, filas: 1, col: 1, cols: 1 });
    }

    valores.push([]);

    // ── Ingredientes.
    const filaCabecera = valores.length + 1;
    valores.push(['Ingrediente', 'Cantidad', 'Unidad', 'Coste unitario', 'Coste', 'Nota']);
    bandas.push({ fila: filaCabecera - 1, color: GRIS, negrita: true, cols: 6 });

    const primeraLinea = valores.length + 1;
    for (const d of directas) {
        const f = valores.length + 1;
        valores.push([
            d.nombre,
            d.cantidadBase,
            d.unidadBase,
            d.huerfana ? '' : `=IFERROR(VLOOKUP($A${f};'${paraFormula(MATERIA)}'!$A:$D;4;FALSE);"")`,
            d.huerfana ? '' : `=IF(D${f}="";"";B${f}*D${f})`,
            d.huerfana ? 'Sin ficha en el catálogo: no se puede enlazar su precio.' : '',
        ]);
    }
    const ultimaLinea = valores.length;
    const filaTotalDirecto = valores.length + 1;
    valores.push(['', '', '', 'Total ingredientes', `=SUM(E${primeraLinea}:E${ultimaLinea})`, '']);
    bandas.push({ fila: filaTotalDirecto - 1, color: ACENTO, textoBlanco: true, negrita: true, cols: 6 });
    moneda.push({ fila: primeraLinea - 1, filas: (ultimaLinea - primeraLinea + 2), col: 3, cols: 2 });

    // ── Sub-recetas: cada una con su rendimiento, su tabla y su prorrateo.
    const totalesBloques: string[] = [];
    for (const b of bloques) {
        valores.push([]);
        const sub = (b.subItems || []).map(l => normalizarLinea(l, porId));
        const usadoNorm = normalizeToBase(num(b.cantidad), b.unidad || 'ml');
        const usado = usadoNorm.base === 'unknown' ? num(b.cantidad) : redondear(usadoNorm.qty, 3);
        const rendimiento = sub.reduce((a, s) => a + s.cantidadBase, 0);

        const filaTitulo = valores.length + 1;
        valores.push([`${b.nombre || 'Sub-receta'} · rinde ${rendimiento || '?'} ${sub[0]?.unidadBase || ''}`, '', '', '', '', '']);
        bandas.push({ fila: filaTitulo - 1, color: '#334155', textoBlanco: true, negrita: true, cols: 6, combinar: true });

        const filaCab = valores.length + 1;
        valores.push(['Ingrediente', 'Cantidad', 'Unidad', 'Coste unitario', 'Coste', '']);
        bandas.push({ fila: filaCab - 1, color: GRIS, negrita: true, cols: 6 });

        const desde = valores.length + 1;
        for (const s of sub) {
            const f = valores.length + 1;
            valores.push([
                s.nombre, s.cantidadBase, s.unidadBase,
                s.huerfana ? '' : `=IFERROR(VLOOKUP($A${f};'${paraFormula(MATERIA)}'!$A:$D;4;FALSE);"")`,
                s.huerfana ? '' : `=IF(D${f}="";"";B${f}*D${f})`,
                s.huerfana ? 'Sin ficha en el catálogo.' : '',
            ]);
        }
        const hasta = valores.length;
        const filaLote = valores.length + 1;
        valores.push(['', '', '', 'Coste del lote', `=SUM(E${desde}:E${hasta})`, '']);

        const filaProrrateo = valores.length + 1;
        // El prorrateo, escrito para que se pueda auditar: lo que cuesta el lote,
        // por la parte que esta receta usa.
        valores.push([
            `Usado en la receta`, usado, sub[0]?.unidadBase || '',
            `de ${rendimiento || '?'}`,
            rendimiento > 0 ? `=E${filaLote}*${usado}/${rendimiento}` : '',
            '',
        ]);
        bandas.push({ fila: filaProrrateo - 1, color: '#334155', textoBlanco: true, negrita: true, cols: 6 });
        moneda.push({ fila: desde - 1, filas: hasta - desde + 3, col: 3, cols: 2 });
        totalesBloques.push(`E${filaProrrateo}`);
    }

    // El coste de receta: los ingredientes directos más cada sub-receta prorrateada.
    valores[filaCoste - 1][1] = totalesBloques.length
        ? `=E${filaTotalDirecto}+${totalesBloques.join('+')}`
        : `=E${filaTotalDirecto}`;

    return {
        titulo,
        valores,
        anchos: [260, 90, 70, 120, 100, 260],
        bandas,
        moneda,
        porcentaje,
        grafico: { filaDatos: filaPVP - 1, colDatos: 3, anclaFila: 2, anclaCol: 6 },
    };
};

/** La portada: cada cóctel con su fila, y todo traído por fórmula de su pestaña. */
export const hojaPortada = (
    meta: { nombre: string; concepto?: string; fecha?: string },
    pestanas: Array<{ titulo: string; filaPVP: number; filaCoste: number; filaMargen: number; filaPct: number }>,
): HojaLibro => {
    const valores: Celda[][] = [
        ['NEXUS', '', '', '', ''],
        [meta.nombre || 'Carta', '', '', '', ''],
        [meta.concepto || '', '', '', '', ''],
        [meta.fecha || '', '', '', '', ''],
        [],
        ['Cóctel', 'PVP', 'Coste', 'Margen', '% coste'],
    ];

    for (const p of pestanas) {
        const q = `'${paraFormula(p.titulo)}'`;
        valores.push([
            p.titulo,
            `=${q}!B${p.filaPVP}`,
            `=${q}!B${p.filaCoste}`,
            `=${q}!B${p.filaMargen}`,
            `=${q}!B${p.filaPct}`,
        ]);
    }

    const desde = 7;
    const hasta = 6 + pestanas.length;
    valores.push(['TOTAL', `=SUM(B${desde}:B${hasta})`, `=SUM(C${desde}:C${hasta})`, `=SUM(D${desde}:D${hasta})`, '']);

    return {
        titulo: 'Carta',
        valores,
        anchos: [280, 100, 100, 100, 90],
        bandas: [
            { fila: 1, color: ACENTO, textoBlanco: true, negrita: true, tamano: 20, cols: 5, combinar: true },
            { fila: 5, color: GRIS, negrita: true, cols: 5 },
            { fila: 6 + pestanas.length, color: ACENTO, textoBlanco: true, negrita: true, cols: 5 },
        ],
        moneda: [{ fila: 6, filas: pestanas.length + 1, col: 1, cols: 3 }],
        porcentaje: [{ fila: 6, filas: pestanas.length, col: 4, cols: 1 }],
        filaCongelada: 6,
    };
};

/** El libro entero. */
export const construirLibro = (
    recetas: Partial<Recipe>[],
    catalogo: Ingredient[],
    ajustes: AjustesLibro,
    meta: { nombre: string; concepto?: string; fecha?: string },
): LibroEscandallo => {
    const usados = new Set<string>(['carta', MATERIA.toLowerCase()]);
    const hojasCoctel: HojaLibro[] = [];
    const resumen: Array<{ titulo: string; filaPVP: number; filaCoste: number; filaMargen: number; filaPct: number }> = [];

    for (const r of recetas) {
        const titulo = nombreDePestana(r.nombre || 'Sin nombre', usados);
        const hoja = hojaDeCoctel(r, catalogo, ajustes, titulo);
        hojasCoctel.push(hoja);
        // Las filas del bloque económico son fijas por construcción: 4ª a 9ª.
        resumen.push({ titulo, filaPVP: 4, filaCoste: 7, filaMargen: 8, filaPct: 9 });
    }

    const materia = construirMateriaPrima(recetas, catalogo);

    return {
        titulo: `${meta.nombre || 'Carta'} · escandallos`,
        acento: ACENTO,
        hojas: [hojaPortada(meta, resumen), ...hojasCoctel, hojaMateriaPrima(materia)],
    };
};
