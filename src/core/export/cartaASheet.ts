import { Recipe } from '../../types';

/**
 * Convierte una carta en una **hoja de cálculo con formato**. Puro: no habla
 * con Google ni con nadie.
 *
 * ## Lo que hay que entender antes de usar esto
 *
 * El «Exportar» de hoy genera HTML y lo manda a `window.print()`: el diseño de
 * la carta es una hoja de estilos **para papel**. Una hoja de cálculo no
 * reproduce eso, y prometerlo sería mentir: no hay portada, ni tipografía de
 * plantilla, ni maqueta de ficha.
 *
 * Lo que sí da una hoja —y la carta impresa no— es **contenido editable**:
 * cambiar un precio, reordenar, añadir una fila, compartirla con alguien que
 * no tiene la app. Eso es lo que se construye aquí, con el formato que una
 * hoja sí sabe llevar: título combinado, cabeceras con color, anchos de
 * columna, negritas y fila congelada.
 *
 * Así que esto **no sustituye** a la carta impresa: es la otra mitad. La
 * impresa es para verla; la hoja, para trabajarla.
 */

export interface FilaCarta {
    /** Vacío en las filas de título y de sección. */
    nombre: string;
    descripcion: string;
    ingredientes: string;
    precio: number | '';
    coste: number | '';
    margen: string;
}

export type TipoFila = 'titulo' | 'concepto' | 'seccion' | 'cabecera' | 'coctel' | 'vacia';

export interface LineaHoja {
    tipo: TipoFila;
    celdas: (string | number)[];
}

export interface HojaCarta {
    titulo: string;
    lineas: LineaHoja[];
    /** Color de acento, para las cabeceras. Sale de la plantilla de la carta. */
    acento: string;
    /** Ancho de cada columna, en píxeles: una hoja sin anchos es ilegible. */
    anchos: number[];
}

export const CABECERAS = ['Cóctel', 'Descripción', 'Ingredientes', 'PVP', 'Coste', 'Margen'];

const eur = (n: number) => Math.round(n * 100) / 100;

const margen = (pvp: number, coste: number): string => {
    if (!(pvp > 0)) return '';
    return `${Math.round(((pvp - coste) / pvp) * 100)}%`;
};

const ingredientesDe = (r: Recipe): string =>
    ((r.ingredientes as any[]) || [])
        .map(l => l?.nombre)
        .filter(Boolean)
        .join(', ');

const esSinAlcohol = (r: Recipe): boolean => {
    const c = r.categorias || [];
    return c.includes('Mocktail') || c.includes('Moctel');
};

export interface EntradaCarta {
    recipe: Recipe;
    coste: number;
}

/**
 * Construye la hoja. **Respeta el orden que recibe**: quien llama ya lo ordenó
 * como manda la carta —con alcohol primero, y dentro de cada bloque la
 * secuencia que fijó el usuario—, y reordenar aquí lo desharía.
 */
export const cartaASheet = (
    entradas: EntradaCarta[],
    meta: { nombre: string; concepto?: string; fecha?: string; acento?: string },
): HojaCarta => {
    const lineas: LineaHoja[] = [];

    lineas.push({ tipo: 'titulo', celdas: [meta.nombre] });
    if (meta.concepto?.trim()) lineas.push({ tipo: 'concepto', celdas: [meta.concepto.trim()] });
    if (meta.fecha) lineas.push({ tipo: 'concepto', celdas: [meta.fecha] });
    lineas.push({ tipo: 'vacia', celdas: [] });

    const conAlcohol = entradas.filter(e => !esSinAlcohol(e.recipe));
    const sinAlcohol = entradas.filter(e => esSinAlcohol(e.recipe));

    const bloque = (titulo: string, lista: EntradaCarta[]) => {
        if (!lista.length) return;
        lineas.push({ tipo: 'seccion', celdas: [titulo] });
        lineas.push({ tipo: 'cabecera', celdas: [...CABECERAS] });
        for (const { recipe, coste } of lista) {
            const pvp = Number((recipe as any).precioVenta) || 0;
            lineas.push({
                tipo: 'coctel',
                celdas: [
                    recipe.nombre || 'Sin nombre',
                    (recipe as any).descripcion || '',
                    ingredientesDe(recipe),
                    pvp > 0 ? eur(pvp) : '',
                    coste > 0 ? eur(coste) : '',
                    margen(pvp, coste),
                ],
            });
        }
        lineas.push({ tipo: 'vacia', celdas: [] });
    };

    // El mismo orden que la carta impresa: con alcohol primero. Es el orden en
    // que se lee una carta, y cambiarlo aquí haría que las dos exportaciones
    // dijeran cosas distintas.
    bloque('CON ALCOHOL', conAlcohol);
    bloque('SIN ALCOHOL', sinAlcohol);

    return {
        titulo: meta.nombre || 'Carta',
        lineas,
        acento: meta.acento || '#0d9488',
        anchos: [200, 320, 320, 90, 90, 90],
    };
};

/** Las filas tal cual las quiere la API de Sheets: matriz de valores. */
export const valoresDe = (hoja: HojaCarta): (string | number)[][] =>
    hoja.lineas.map(l => l.celdas);
