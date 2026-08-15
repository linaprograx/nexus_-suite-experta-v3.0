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

export type TipoFila = 'portada' | 'titulo' | 'concepto' | 'seccion' | 'cabecera' | 'coctel' | 'vacia';

export interface LineaHoja {
    tipo: TipoFila;
    celdas: (string | number)[];
}

export interface HojaCarta {
    /** Cuántas filas ocupa la banda de portada, para combinarlas en una sola. */
    filasDePortada: number;
    titulo: string;
    lineas: LineaHoja[];
    /** Color de acento, para las cabeceras. Sale de la plantilla de la carta. */
    acento: string;
    /** Ancho de cada columna, en píxeles: una hoja sin anchos es ilegible. */
    anchos: number[];
}

export const CABECERAS = ['Cóctel', 'Descripción', 'Ingredientes', 'PVP', 'Coste', 'Margen', 'Coste / Beneficio'];

/**
 * El grafiquito de cada fila es un **SPARKLINE**, no un gráfico de verdad.
 *
 * En Sheets los gráficos son **objetos flotantes** que se colocan encima de la
 * cuadrícula, no dentro de una celda. Un pastel por cóctel serían doce objetos
 * sueltos que se descolocan en cuanto ordenas, filtras o insertas una fila —
 * exactamente lo que arruina una hoja que existe para editarse.
 *
 * `SPARKLINE` sí vive dentro de la celda, y además es **fórmula**: si cambias
 * el precio, la barra se redibuja sola. Se pinta apilada —coste a la izquierda,
 * beneficio a la derecha— que es la lectura que se buscaba.
 */
const sparkline = (filaHoja: number): string =>
    `=IF(D${filaHoja}="";"";SPARKLINE({E${filaHoja}\\D${filaHoja}-E${filaHoja}};`
    + `{"charttype"\\"bar";"color1"\\"#c0392b";"color2"\\"#0d9488";"max"\\D${filaHoja}}))`;

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

    /**
     * La portada: cuatro filas combinadas de lado a lado, con fondo y
     * tipografía grande. Una hoja no puede llevar la portada de la carta
     * impresa, pero sí puede abrir con una banda que se lea como una portada en
     * vez de con un texto suelto en A1.
     */
    const FILAS_PORTADA = 4;
    lineas.push({ tipo: 'portada', celdas: [meta.nombre] });
    lineas.push({ tipo: 'portada', celdas: [meta.concepto?.trim() || ''] });
    lineas.push({ tipo: 'portada', celdas: [meta.fecha || ''] });
    lineas.push({ tipo: 'portada', celdas: [''] });
    lineas.push({ tipo: 'vacia', celdas: [] });

    const conAlcohol = entradas.filter(e => !esSinAlcohol(e.recipe));
    const sinAlcohol = entradas.filter(e => esSinAlcohol(e.recipe));

    const bloque = (titulo: string, lista: EntradaCarta[]) => {
        if (!lista.length) return;
        lineas.push({ tipo: 'seccion', celdas: [titulo] });
        lineas.push({ tipo: 'cabecera', celdas: [...CABECERAS] });
        for (const { recipe, coste } of lista) {
            const pvp = Number((recipe as any).precioVenta) || 0;
            // +1 porque las hojas empiezan a contar en 1, no en 0.
            const filaHoja = lineas.length + 1;
            lineas.push({
                tipo: 'coctel',
                celdas: [
                    recipe.nombre || 'Sin nombre',
                    (recipe as any).descripcion || '',
                    ingredientesDe(recipe),
                    pvp > 0 ? eur(pvp) : '',
                    coste > 0 ? eur(coste) : '',
                    margen(pvp, coste),
                    sparkline(filaHoja),
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
        filasDePortada: FILAS_PORTADA,
        titulo: meta.nombre || 'Carta',
        lineas,
        acento: meta.acento || '#0d9488',
        anchos: [200, 300, 300, 80, 80, 80, 150],
    };
};

/** Las filas tal cual las quiere la API de Sheets: matriz de valores. */
export const valoresDe = (hoja: HojaCarta): (string | number)[][] =>
    hoja.lineas.map(l => l.celdas);
