/**
 * Familia → subfamilia, más etiquetas transversales. **Decisión 4 del catálogo
 * global** (2026-08-16).
 *
 * ## Lo que se midió antes de escribir esto
 *
 * El plan hablaba de «724 categorías». **No son 724: son 67.** El 724 era el
 * número de *fichas* que tocaba la depuración de categorías, y se copió mal en
 * dos sitios. Contadas sobre las 1.333 filas del catálogo real, hay 67 cadenas
 * distintas — y no son un caos, **llevan la familia escrita dentro**:
 *
 *     FRUTAS FRESCOS · HORTALIZAS FRESCOS · ALGAS FRESCOS · BULBOS FRESCOS…
 *     ESPECIALES MINIS · ESPECIALES KOPPER · ESPECIALES GERMINADOS…
 *     TEQUILA · MEZCAL · RON · GINEBRA · WHISKY · SOTOL · RAICILLA…
 *
 * Eso cambia el trabajo por completo. No hay que pedirle a nadie que
 * reclasifique nada a mano: la taxonomía **ya está ahí**, escrita en una sola
 * cadena porque no había dónde ponerla. Este módulo la lee.
 *
 * ## Lo que hace y lo que NO hace
 *
 * Interpreta una categoría y **propone** familia, subfamilia y etiquetas. No
 * escribe, no fusiona y no decide: devuelve además `confianza` y `motivo`, para
 * que lo dudoso se pueda revisar en vez de aplicarse a ciegas.
 *
 * Las **etiquetas** son la parte que importa de la decisión 4. Obligar a elegir
 * un solo cajón por producto es lo que produce categorías como «FRUTAS
 * CITRICOS» y «FRUTAS Y CÍTRICOS» conviviendo: cuando algo es dos cosas a la
 * vez y solo cabe una, la gente inventa una tercera.
 */

export interface Interpretacion {
    /** Cadena original, intacta. Nunca se pierde. */
    original: string;
    familia: string;
    /** Vacía cuando la categoría ES la familia (p. ej. «CERVEZA»). */
    subfamilia: string;
    /** Transversales: se acumulan, no se excluyen. */
    etiquetas: string[];
    confianza: 'alta' | 'media' | 'ninguna';
    motivo: string;
}

/** Sin acentos, sin dobles espacios, en mayúsculas. Para comparar, no para mostrar. */
export const normalizar = (s: string): string =>
    (s || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9ÑÜ\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Quita la repetición literal de la cadena entera consigo misma.
 * «FRUTOS SECOS FRUTOS SECOS» → «FRUTOS SECOS». Existe de verdad, con 43 fichas.
 */
export const quitarRepeticion = (s: string): string => {
    const t = normalizar(s);
    const palabras = t.split(' ');
    if (palabras.length % 2 !== 0) return t;
    const mitad = palabras.length / 2;
    const a = palabras.slice(0, mitad).join(' ');
    const b = palabras.slice(mitad).join(' ');
    return a === b ? a : t;
};

/**
 * Singular canónico de las palabras que aparecen en las dos formas.
 *
 * **Solo estas.** Una regla general de plurales convertiría «MICROS» en «MICRO»
 * o destrozaría «PATATAS, RAICES Y TUBERCULOS», y una taxonomía que adivina es
 * peor que una desordenada. Salen de mirar el catálogo, no de gramática:
 * LICOR(51)/LICORES(17), SIROPE(14)/SIROPES(36), REFRESCO(8)/REFRESCOS(6),
 * PURE(13)/PURÉ(3).
 */
const SINONIMOS: Record<string, string> = {
    LICORES: 'LICOR',
    SIROPES: 'SIROPE',
    REFRESCOS: 'REFRESCO',
    'VINOS Y ESPUMOSOS': 'VINO',
    'FRUTAS CITRICOS': 'FRUTAS Y CITRICOS',
    'BOTANICOS Y HIERBAS': 'BOTANICOS Y ESPECIAS',
};

/** Familias de destilado. La familia es «DESTILADOS» y la subfamilia, el tipo. */
const DESTILADOS = new Set([
    'TEQUILA', 'MEZCAL', 'RON', 'GINEBRA', 'WHISKY', 'VODKA', 'RAICILLA',
    'SOTOL', 'BACANORA', 'PISCO', 'BRANDY', 'CACHAZA', 'AGAVE', 'PULQUE',
    'DESTILADOS', 'ALCOHOL BASE',
]);

/** Con alcohol pero no destilado: fermentados y fortificados. */
const FERMENTADOS = new Set(['CERVEZA', 'VINO', 'CHAMPAGNE', 'VERMUT', 'LICOR']);

/** No son categorías: son estados o cosas que se colaron. Se marcan, no se clasifican. */
const NO_SON_CATEGORIA = new Set(['POR REVISAR', 'IMPORTADO', 'SEC', 'PAJITA']);

const FAMILIA_FRESCOS = 'FRESCOS';
const FAMILIA_ESPECIALES = 'ESPECIALES';
const FAMILIA_DESTILADOS = 'DESTILADOS';
const FAMILIA_FERMENTADOS = 'CON ALCOHOL';

/**
 * Interpreta una categoría. Cuatro reglas, en orden, y una salida honesta
 * cuando ninguna aplica.
 */
export const interpretarCategoria = (categoria: string): Interpretacion => {
    const original = (categoria || '').trim();
    const base0 = quitarRepeticion(original);
    const base = SINONIMOS[base0] || base0;

    const vacio = (motivo: string): Interpretacion => ({
        original, familia: '', subfamilia: '', etiquetas: [], confianza: 'ninguna', motivo,
    });

    if (!base) return vacio('Sin categoría.');

    if (NO_SON_CATEGORIA.has(base)) {
        return {
            original, familia: '', subfamilia: '', etiquetas: [], confianza: 'ninguna',
            motivo: `«${base}» no es una categoría: es un estado o una etiqueta. Va como etiqueta, no como familia.`,
        };
    }

    // 1. Sufijo FRESCOS: «ALGAS FRESCOS» → FRESCOS / ALGAS.
    if (base.endsWith(' FRESCOS') || base === 'FRESCOS') {
        const sub = base === 'FRESCOS' ? '' : base.slice(0, -' FRESCOS'.length).trim();
        return {
            original, familia: FAMILIA_FRESCOS, subfamilia: sub,
            etiquetas: ['frío', 'perecedero'], confianza: 'alta',
            motivo: 'El sufijo FRESCOS ya era la familia; lo de delante, la subfamilia.',
        };
    }

    // 2. Prefijo ESPECIALES: «ESPECIALES MINIS» → ESPECIALES / MINIS.
    if (base.startsWith('ESPECIALES ') || base === 'ESPECIALES') {
        const sub = base === 'ESPECIALES' ? '' : base.slice('ESPECIALES '.length).trim();
        return {
            original, familia: FAMILIA_ESPECIALES, subfamilia: sub,
            etiquetas: ['frío', 'perecedero'], confianza: 'alta',
            motivo: 'El prefijo ESPECIALES ya era la familia; lo de detrás, la subfamilia.',
        };
    }

    // 3. Destilados y fermentados: la categoría es el tipo de bebida.
    if (DESTILADOS.has(base)) {
        const esGenerica = base === 'DESTILADOS' || base === 'ALCOHOL BASE';
        return {
            original, familia: FAMILIA_DESTILADOS, subfamilia: esGenerica ? '' : base,
            etiquetas: ['con alcohol', 'seco'], confianza: esGenerica ? 'media' : 'alta',
            motivo: esGenerica
                ? 'Es la familia sin subfamilia: dice que es un destilado, no cuál.'
                : 'Tipo de destilado conocido.',
        };
    }
    if (FERMENTADOS.has(base)) {
        return {
            original, familia: FAMILIA_FERMENTADOS, subfamilia: base,
            etiquetas: ['con alcohol'], confianza: 'alta',
            motivo: 'Lleva alcohol y no es destilado.',
        };
    }

    // 4. Ninguna regla aplica: se conserva como familia propia y se dice.
    return {
        original, familia: base, subfamilia: '',
        etiquetas: [], confianza: 'media',
        motivo: 'Sin patrón conocido: se deja como familia propia, a la espera de que la mires.',
    };
};

/** La clave de dos categorías que son la misma cosa. */
export const claveDeTaxonomia = (i: Interpretacion): string =>
    i.familia ? `${i.familia}▸${i.subfamilia}` : `∅▸${normalizar(i.original)}`;

export interface GrupoTaxonomia {
    familia: string;
    subfamilia: string;
    etiquetas: string[];
    /** Las cadenas originales que caen aquí, con cuántas fichas trae cada una. */
    originales: Array<{ categoria: string; fichas: number }>;
    fichas: number;
    confianza: Interpretacion['confianza'];
    motivo: string;
}

/**
 * El informe. **Solo lee y cuenta.**
 *
 * Lo interesante no es la lista de familias: es ver **qué cadenas distintas
 * caen en la misma casilla**. Ahí es donde se ve que LICOR y LICORES son 68
 * fichas del mismo sitio partidas en dos por una S.
 */
export const informeDeTaxonomia = (
    fichas: Array<{ categoria?: string }>,
): { grupos: GrupoTaxonomia[]; sinClasificar: GrupoTaxonomia[]; totalCategorias: number; totalFichas: number } => {
    const porCategoria = new Map<string, number>();
    for (const f of fichas || []) {
        const c = (f?.categoria || '').trim();
        porCategoria.set(c, (porCategoria.get(c) || 0) + 1);
    }

    const porClave = new Map<string, GrupoTaxonomia>();
    for (const [categoria, n] of porCategoria.entries()) {
        const i = interpretarCategoria(categoria);
        const clave = claveDeTaxonomia(i);
        const g = porClave.get(clave);
        if (g) {
            g.originales.push({ categoria, fichas: n });
            g.fichas += n;
            // Si dos cadenas caen en la misma casilla por caminos de distinta
            // solidez, manda la peor: el grupo solo es tan fiable como su
            // eslabón más flojo.
            if (i.confianza === 'ninguna' || (i.confianza === 'media' && g.confianza === 'alta')) {
                g.confianza = i.confianza;
            }
        } else {
            porClave.set(clave, {
                familia: i.familia, subfamilia: i.subfamilia, etiquetas: i.etiquetas,
                originales: [{ categoria, fichas: n }], fichas: n,
                confianza: i.confianza, motivo: i.motivo,
            });
        }
    }

    const todos = Array.from(porClave.values())
        .map(g => ({ ...g, originales: g.originales.sort((a, b) => b.fichas - a.fichas) }))
        .sort((a, b) => b.fichas - a.fichas);

    return {
        grupos: todos.filter(g => g.familia),
        sinClasificar: todos.filter(g => !g.familia),
        totalCategorias: porCategoria.size,
        totalFichas: fichas?.length || 0,
    };
};

/** Los grupos donde dos o más cadenas distintas dicen lo mismo. */
export const duplicadasDeTaxonomia = (grupos: GrupoTaxonomia[]): GrupoTaxonomia[] =>
    grupos.filter(g => g.originales.length > 1);
