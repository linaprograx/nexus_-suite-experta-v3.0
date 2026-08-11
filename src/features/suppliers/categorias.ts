/**
 * Categorías de proveedor de hostelería.
 *
 * No son una taxonomía cerrada: son los tipos que se repiten en una barra, para
 * no tener que teclearlos cada vez ni acabar con «Fruteria», «FRUTERIA» y
 * «frutas» conviviendo como tres cosas distintas.
 *
 * Un proveedor puede tener **varias** —el catálogo real ya trae «ALCOHOL,
 * MIXERS»—, así que se guardan separadas por coma, que es exactamente el
 * formato que ya existe. No hay migración: lo que había sigue leyéndose.
 */
export const CATEGORIAS_PROVEEDOR = [
    'Alcoholes',
    'Vinos',
    'Cervezas',
    'Refrescos',
    'Aguas',
    'Mixers',
    'Café e infusiones',
    'Carnes',
    'Pescados',
    'Frutas y verduras',
    'Lácteos',
    'Panadería',
    'Secos',
    'Congelados',
    'Texturizantes',
    'Limpieza',
    'Desechables',
    'Equipamiento',
    'Otros',
] as const;

export type CategoriaProveedor = typeof CATEGORIAS_PROVEEDOR[number];

const normalizar = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

/** Las categorías de un proveedor, tal como están guardadas: «A, B» → ['A','B']. */
export const leerCategorias = (valor?: string): string[] =>
    (valor || '').split(',').map(s => s.trim()).filter(Boolean);

/** Vuelve al formato guardado. */
export const escribirCategorias = (lista: string[]): string => lista.join(', ');

/**
 * Si una categoría guardada es una de las conocidas, ignorando mayúsculas y
 * acentos. Sirve para que «FRUTERIA» de un proveedor antiguo no aparezca como
 * seleccionada Y como texto suelto a la vez.
 */
export const esCategoriaConocida = (valor: string): boolean =>
    CATEGORIAS_PROVEEDOR.some(c => normalizar(c) === normalizar(valor));

export const alternarCategoria = (actuales: string[], categoria: string): string[] =>
    actuales.some(c => normalizar(c) === normalizar(categoria))
        ? actuales.filter(c => normalizar(c) !== normalizar(categoria))
        : [...actuales, categoria];
