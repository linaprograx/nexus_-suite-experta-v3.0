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
    grafico?: { filaDatos: number; colDatos: number; anclaFila: number; anclaCol: number };
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
        : `=IF(D${f}="";"";B${f}*${d.factor}*D${f})`;
    return [d.nombre, d.cantidadBase, d.unidadBase, busca, coste, d.nota];
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
    const protegidos: HojaLibro['protegidos'] = [];

    const fila = () => valores.length + 1;   // fila 1-indexada de la PRÓXIMA que se empuje

    // ── Cabecera. «NEXUS» en A1 y en gris: Sheets no tiene marcas de agua de
    //    verdad, así que es una celda. Fingir lo contrario sería peor.
    valores.push(['NEXUS', '', '', '', '', '']);
    valores.push([receta.nombre || 'Sin nombre', '', '', '', '', '']);
    bandas.push({ fila: 1, color: ACENTO, textoBlanco: true, negrita: true, tamano: 18, cols: 6, combinar: true });
    valores.push([(receta.categorias || []).join(' · ') || 'Ficha de escandallo', '', '', '', '', '']);
    bandas.push({ fila: 2, color: '#e2e8f0', tamano: 9, cols: 6, combinar: true });
    valores.push([]);

    // ── Dos bloques en la misma banda, cada uno en su sitio: la economía a la
    //    izquierda y el reparto —lo que alimenta el gráfico— a la derecha.
    //    Antes compartían filas sin rótulo y las etiquetas «Coste/Beneficio»
    //    aparecían flotando en medio de la ficha sin decir de qué eran.
    const filaSeccion = fila();
    valores.push(['ECONOMÍA', '', '', 'REPARTO', '', '']);
    bandas.push({ fila: filaSeccion - 1, color: '#334155', textoBlanco: true, negrita: true, cols: 3, combinar: true });
    bandas.push({ fila: filaSeccion - 1, col: 3, cols: 3, color: '#334155', textoBlanco: true, negrita: true, combinar: true });

    const filaPVP = fila();
    valores.push(['PVP al público', pvp || '', '', 'Coste', '', '']);
    const filaTasa = fila();
    valores.push(['Impuesto de venta', ajustes.tasaVenta, '', 'Beneficio', '', '']);
    const filaNeto = fila();
    valores.push([
        'PV neto',
        ajustes.precioIncluyeImpuestos
            ? `=IF(B${filaPVP}="";"";B${filaPVP}/(1+B${filaTasa}))`
            : `=IF(B${filaPVP}="";"";B${filaPVP})`,
        '', '', '', '',
    ]);
    const filaCoste = fila();
    valores.push(['Coste de receta', 0, '', '', '', '']);
    const filaMargen = fila();
    valores.push(['Margen bruto', `=IF(B${filaNeto}="";"";B${filaNeto}-B${filaCoste})`, '', '', '', '']);
    const filaPct = fila();
    valores.push(['% de coste', `=IF(B${filaNeto}="";"";B${filaCoste}/B${filaNeto})`, '', '', '', '']);

    // El gráfico se alimenta de estas dos celdas, y ahora apuntan a lo que
    // dicen: coste y margen, no a la fila de al lado.
    valores[filaPVP - 1][4] = `=B${filaCoste}`;
    valores[filaTasa - 1][4] = `=B${filaMargen}`;

    moneda.push({ fila: filaPVP - 1, filas: 1, col: 1, cols: 1 });
    moneda.push({ fila: filaNeto - 1, filas: 3, col: 1, cols: 1 });
    moneda.push({ fila: filaPVP - 1, filas: 2, col: 4, cols: 1 });
    porcentaje.push({ fila: filaTasa - 1, filas: 1, col: 1, cols: 1 });
    porcentaje.push({ fila: filaPct - 1, filas: 1, col: 1, cols: 1 });
    // Calculadas: PV neto, coste, margen y %. El PVP y el impuesto se tocan.
    protegidos.push({ fila: filaNeto - 1, filas: 4, col: 1, cols: 1, motivo: 'Calculado por fórmula' });
    protegidos.push({ fila: filaPVP - 1, filas: 2, col: 4, cols: 1, motivo: 'Calculado por fórmula' });

    if (ajustes.mermaReceta > 0) {
        const f = fila();
        valores.push(['Merma de receta (Nexus)', ajustes.mermaReceta / 100, '', '', '', '']);
        porcentaje.push({ fila: f - 1, filas: 1, col: 1, cols: 1 });
    }

    valores.push([]);

    // ── Ingredientes.
    const filaTituloIng = fila();
    valores.push(['INGREDIENTES', '', '', '', '', '']);
    bandas.push({ fila: filaTituloIng - 1, color: '#334155', textoBlanco: true, negrita: true, cols: 6, combinar: true });

    const filaCabecera = fila();
    valores.push(['Ingrediente', 'Cantidad', 'Unidad', 'Coste unitario', 'Coste', 'Nota']);
    bandas.push({ fila: filaCabecera - 1, color: GRIS, negrita: true, cols: 6 });

    const primeraLinea = fila();
    for (const d of directas) valores.push(filaDeIngrediente(d, fila()));
    const ultimaLinea = valores.length;
    const filaTotalDirecto = fila();
    valores.push(['', '', '', 'Total ingredientes', `=SUM(E${primeraLinea}:E${ultimaLinea})`, '']);
    bandas.push({ fila: filaTotalDirecto - 1, color: ACENTO, textoBlanco: true, negrita: true, cols: 6 });
    moneda.push({ fila: primeraLinea - 1, filas: (ultimaLinea - primeraLinea + 2), col: 3, cols: 2 });
    if (directas.length) {
        protegidos.push({ fila: primeraLinea - 1, filas: directas.length + 1, col: 3, cols: 2, motivo: 'Calculado por fórmula' });
    }

    // ── Sub-recetas.
    const totalesBloques: string[] = [];
    for (const b of bloques) {
        valores.push([]);
        const sub = (b.subItems || []).map(l => normalizarLinea(l, porId));

        // El rendimiento sale de `recipeTotalVolume`, la MISMA función con la
        // que Nexus prorratea. Suma las cantidades normalizadas aunque mezclen
        // gramos y mililitros —el motor asume densidad 1 en todas partes—, así
        // que aquí no se etiqueta con una unidad concreta: decir «1000 g» de un
        // lote que son 500 g y 500 ml sería inventarse la mitad.
        const rendimiento = redondear(recipeTotalVolume({ ingredientes: b.subItems || [] } as any), 3);
        const unidades = Array.from(new Set(sub.map(x => x.unidadBase))).filter(Boolean);
        const unidadLote = unidades.length === 1 ? unidades[0] : 'ml/g';
        const usoNorm = normalizeToBase(num(b.cantidad), b.unidad || 'ml');
        const usado = usoNorm.base === 'unknown' ? num(b.cantidad) : redondear(usoNorm.qty, 3);
        const unidadUso = usoNorm.base === 'unknown' ? (b.unidad || '') : usoNorm.base;

        const filaTitulo = fila();
        valores.push([`${b.nombre || 'Sub-receta'}`, `rinde ${rendimiento || '?'} ${unidadLote}`, '', '', '', '']);
        bandas.push({ fila: filaTitulo - 1, color: '#475569', textoBlanco: true, negrita: true, cols: 6 });

        const filaCab = fila();
        valores.push(['Ingrediente', 'Cantidad', 'Unidad', 'Coste unitario', 'Coste', 'Nota']);
        bandas.push({ fila: filaCab - 1, color: GRIS, negrita: true, cols: 6 });

        const desde = fila();
        for (const x of sub) valores.push(filaDeIngrediente(x, fila()));
        const hasta = valores.length;
        const filaLote = fila();
        valores.push(['', '', '', 'Coste del lote', `=SUM(E${desde}:E${hasta})`, '']);

        const filaProrrateo = fila();
        // El prorrateo, auditable de un vistazo, y la explicación en la columna
        // de notas — no en la de importes, donde antes había un «de 1000» que
        // era texto dentro de una columna de moneda.
        valores.push([
            'Usado en la receta', usado, unidadUso, '',
            rendimiento > 0 ? `=E${filaLote}*${usado}/${rendimiento}` : '',
            `Coste del lote × ${usado} ÷ ${rendimiento || '?'}`,
        ]);
        bandas.push({ fila: filaProrrateo - 1, color: '#475569', textoBlanco: true, negrita: true, cols: 6 });
        moneda.push({ fila: desde - 1, filas: hasta - desde + 3, col: 3, cols: 2 });
        protegidos.push({ fila: desde - 1, filas: sub.length + 2, col: 3, cols: 2, motivo: 'Calculado por fórmula' });
        totalesBloques.push(`E${filaProrrateo}`);
    }

    valores[filaCoste - 1][1] = totalesBloques.length
        ? `=E${filaTotalDirecto}+${totalesBloques.join('+')}`
        : `=E${filaTotalDirecto}`;

    return {
        titulo,
        valores,
        anchos: [250, 100, 80, 120, 110, 300],
        bandas,
        moneda,
        porcentaje,
        protegidos,
        grafico: { filaDatos: filaPVP - 1, colDatos: 3, anclaFila: filaSeccion + 1, anclaCol: 6 },
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
