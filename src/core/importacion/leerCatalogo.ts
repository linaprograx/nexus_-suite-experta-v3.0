import { Ingredient } from '../../types';
import { parsePackFromText, resolveStandardPack, formatPackDisplay, BaseUnit } from '../../utils/packNormalization';
import { tokensFuertes } from '../../features/identity/duplicateCandidates';
import { indicePorId, resolverMaestro } from '../identity/masterProduct';

/**
 * Lectura **en seco** de un fichero de catálogo de proveedor. **Decisión 1 del
 * catálogo global** (2026-08-16): entran ficheros que manda el proveedor.
 *
 * ## Lo que este módulo NO hace, y es lo importante
 *
 * **No escribe.** Devuelve lo que pasaría. La importación de un catálogo entero
 * sobre 1.326 fichas reales es la operación más peligrosa que queda por hacer
 * en este proyecto, y va detrás de una previsualización que el fundador
 * aprueba línea a línea.
 *
 * **No empareja por parecido.** Usa el mismo criterio de identidad que ya está
 * aprobado —conjunto IDÉNTICO de palabras fuertes, `tokensFuertes`— y nada más.
 * Un parecido del 90 % no es un producto: «ABSOLUT VODKA» y «ABSOLUT
 * MANDARINA» comparten casi todo y son cosas distintas. Lo que no case exacto
 * sale como **nuevo**, que es reversible; casarlo mal no lo es.
 *
 * **No normaliza unidades por su cuenta.** El formato se lee con
 * `parsePackFromText`, que es la fuente única. Una segunda calculadora de
 * unidades es exactamente el fallo I1 que costó una semana.
 *
 * **No decide el precio.** Marca qué precio cambiaría y en cuánto; aplicarlo es
 * otra decisión, y el histórico dirá lo que pasó.
 *
 * ## Qué precio manda, decidido por el fundador el 2026-08-16
 *
 * **Ninguno sobrescribe a otro.** Un catálogo trae el mismo producto en varios
 * formatos —ABSOLUT 750 ml a 10 €, 1 L a 15 €, 3 L a 25 €— y eso no son tres
 * productos ni un precio con tres valores: son **tres ofertas del mismo
 * producto**. Cada `(proveedor, formato)` es su propia oferta y se guarda
 * aparte; el precio que usa el coste sale de la oferta elegida, que ya decide
 * `opcionesDeCompra` con la política `offerSelection`.
 *
 * Y para poder elegir hay que comparar **por unidad base**, no por el precio de
 * la etiqueta: esos tres formatos salen a 13,33 · 15,00 · 8,33 €/L, así que el
 * más caro de etiqueta es el más barato de contenido. Comparar los 10 € con los
 * 25 € diría exactamente lo contrario de la verdad.
 *
 * El cálculo va por `resolveStandardPack`, que es la fuente única de formatos.
 * Cuando no se puede resolver el formato **no se compara**: se dice. Es la misma
 * regla que en `opcionesDeCompra` («no se corona a ninguna») y en el histórico
 * de precios, y por el mismo motivo.
 */

export type EstadoLinea = 'nuevo' | 'coincide' | 'sube' | 'baja' | 'igual' | 'invalida';

export interface LineaCatalogo {
    /** Número de fila en el fichero, empezando por 1 en la cabecera. */
    fila: number;
    nombre: string;
    precio?: number;
    unidad?: string;
    formatoQty?: number;
    formatoUnidad?: string;
    referencia?: string;
    /** Precio por unidad base (€/ml, €/g, €/und). El único comparable. */
    precioPorBase?: number;
    unidadBase?: BaseUnit;
    /** Formato ya resuelto, para enseñarlo: «0,7 L», «1 kg». */
    formatoLegible?: string;
    /** La ficha del catálogo con la que casa, si casa. */
    ingredienteId?: string;
    ingredienteNombre?: string;
    estado: EstadoLinea;
    /** Precio actual de la ficha, para poder comparar sin ir a buscarlo. */
    precioActual?: number;
    /** El de la ficha, también por unidad base: comparar peras con peras. */
    precioPorBaseActual?: number;
    variacionPct?: number;
    /** Por qué está en ese estado. Nunca un estado sin explicación. */
    motivo: string;
}

export interface LecturaCatalogo {
    lineas: LineaCatalogo[];
    /** Cabeceras detectadas, y a qué campo se asignó cada una. */
    columnas: Record<string, string>;
    separador: string;
    resumen: {
        total: number; nuevas: number; coinciden: number;
        suben: number; bajan: number; iguales: number; invalidas: number;
    };
    /** Problemas del fichero entero, no de una línea. */
    avisos: string[];
}

/**
 * El separador, deducido de la cabecera.
 *
 * Se cuenta en la primera línea y no en todo el fichero: un nombre de producto
 * con coma («PATATAS, RAICES Y TUBERCULOS» existe en el catálogo) inclinaría el
 * recuento global hacia la coma aunque el fichero sea de punto y coma.
 */
export const deducirSeparador = (cabecera: string): string => {
    const candidatos = [';', ',', '\t', '|'];
    let mejor = ';', max = 0;
    for (const c of candidatos) {
        const n = cabecera.split(c).length - 1;
        if (n > max) { max = n; mejor = c; }
    }
    return max === 0 ? ';' : mejor;
};

/** Parte una línea respetando las comillas: «"PATATAS, RAICES";3,20» son 2 campos. */
export const partirLinea = (linea: string, sep: string): string[] => {
    const campos: string[] = [];
    let actual = '';
    let entreComillas = false;
    for (let i = 0; i < linea.length; i++) {
        const ch = linea[i];
        if (ch === '"') {
            // Dos comillas seguidas dentro de un campo son una comilla literal.
            if (entreComillas && linea[i + 1] === '"') { actual += '"'; i++; continue; }
            entreComillas = !entreComillas;
            continue;
        }
        if (ch === sep && !entreComillas) { campos.push(actual); actual = ''; continue; }
        actual += ch;
    }
    campos.push(actual);
    return campos.map(c => c.trim());
};

/** Sinónimos de cabecera. Lo que no reconozca se ignora y se dice cuál era. */
const CAMPOS: Record<string, string[]> = {
    nombre: ['nombre', 'producto', 'descripcion', 'descripción', 'articulo', 'artículo', 'denominacion', 'denominación', 'concepto'],
    precio: ['precio', 'pvp', 'importe', 'coste', 'costo', 'precio unitario', 'precio ud', 'eur', '€'],
    unidad: ['unidad', 'ud', 'uds', 'medida', 'formato', 'envase', 'presentacion', 'presentación'],
    referencia: ['referencia', 'ref', 'codigo', 'código', 'sku', 'ean'],
};

const normalizarCabecera = (s: string) => s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9€ ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Número europeo o inglés: «1.234,56» y «1,234.56» son el mismo importe. */
export const leerNumero = (valor: string): number | undefined => {
    if (!valor) return undefined;
    let s = valor.replace(/[^\d.,-]/g, '').trim();
    if (!s) return undefined;
    const ultimaComa = s.lastIndexOf(',');
    const ultimoPunto = s.lastIndexOf('.');
    if (ultimaComa > -1 && ultimoPunto > -1) {
        // El último de los dos es el decimal; el otro, separador de millares.
        if (ultimaComa > ultimoPunto) s = s.replace(/\./g, '').replace(',', '.');
        else s = s.replace(/,/g, '');
    } else if (ultimaComa > -1) {
        // Una coma sola: decimal si deja 1-2 cifras detrás, millares si deja 3.
        const detras = s.length - ultimaComa - 1;
        s = detras === 3 ? s.replace(/,/g, '') : s.replace(',', '.');
    }
    const n = Number(s);
    return isFinite(n) ? n : undefined;
};

/** La clave de identidad, la misma que ya usa el catálogo. */
const claveDe = (nombre: string): string => tokensFuertes(nombre).slice().sort().join('|');

export const leerCatalogo = (
    texto: string,
    catalogo: Ingredient[] = [],
): LecturaCatalogo => {
    const avisos: string[] = [];
    const filas = (texto || '').split(/\r?\n/).filter(l => l.trim().length > 0);

    if (filas.length === 0) {
        return { lineas: [], columnas: {}, separador: ';', avisos: ['El fichero está vacío.'],
            resumen: { total: 0, nuevas: 0, coinciden: 0, suben: 0, bajan: 0, iguales: 0, invalidas: 0 } };
    }

    const separador = deducirSeparador(filas[0]);
    const cabeceras = partirLinea(filas[0], separador);

    // Cabecera → campo. Se guarda el mapeo para poder enseñarlo: si el fichero
    // trae la columna equivocada, se ve antes de importar y no después.
    const columnas: Record<string, string> = {};
    const indice: Record<string, number> = {};
    cabeceras.forEach((c, i) => {
        const n = normalizarCabecera(c);
        for (const [campo, alias] of Object.entries(CAMPOS)) {
            if (indice[campo] === undefined && alias.some(a => n === a || n.startsWith(a + ' ') || n.endsWith(' ' + a))) {
                indice[campo] = i;
                columnas[c] = campo;
                return;
            }
        }
        columnas[c] = '—';
    });

    if (indice.nombre === undefined) avisos.push('No se ha encontrado una columna de nombre de producto. Sin ella no se puede emparejar nada.');
    if (indice.precio === undefined) avisos.push('No se ha encontrado una columna de precio. Las líneas se leerán, pero no habrá nada que comparar.');

    // Índice del catálogo por clave de identidad. Se resuelve el maestro para
    // no casar una fila con un alias y creer que es otro producto.
    const porId = indicePorId(catalogo);
    const porClave = new Map<string, Ingredient>();
    for (const ing of catalogo) {
        if (!ing?.nombre) continue;
        const maestroId = resolverMaestro(ing.id, porId);
        const maestro = porId.get(maestroId) || ing;
        const clave = claveDe(maestro.nombre);
        if (clave && !porClave.has(clave)) porClave.set(clave, maestro);
    }

    const lineas: LineaCatalogo[] = [];

    for (let f = 1; f < filas.length; f++) {
        const campos = partirLinea(filas[f], separador);
        const nombre = (indice.nombre !== undefined ? campos[indice.nombre] : '') || '';
        const fila = f + 1;

        if (!nombre.trim()) {
            lineas.push({ fila, nombre: '', estado: 'invalida', motivo: 'Sin nombre de producto: no hay nada que importar.' });
            continue;
        }

        const precio = indice.precio !== undefined ? leerNumero(campos[indice.precio]) : undefined;
        const textoUnidad = indice.unidad !== undefined ? campos[indice.unidad] : '';
        // El formato sale de la columna de unidad y, si no, del propio nombre:
        // «RON 0,70 L» lo lleva escrito. Siempre con `parsePackFromText`.
        const pack = parsePackFromText(textoUnidad) || parsePackFromText(nombre);

        // El formato canónico y, con él, el precio por unidad base: es lo único
        // que permite decir cuál de tres tamaños sale mejor.
        const std = (textoUnidad || nombre)
            ? resolveStandardPack({ name: nombre, unitText: textoUnidad || undefined })
            : undefined;
        const precioPorBase = (precio !== undefined && std && std.standardQuantity > 0)
            ? precio / std.standardQuantity
            : undefined;

        const base: LineaCatalogo = {
            fila,
            nombre: nombre.trim(),
            precio,
            unidad: textoUnidad || undefined,
            formatoQty: pack?.qty,
            formatoUnidad: pack?.unit,
            precioPorBase,
            unidadBase: std?.standardUnit,
            formatoLegible: std ? formatPackDisplay(std.standardQuantity, std.standardUnit) : undefined,
            referencia: indice.referencia !== undefined ? campos[indice.referencia] || undefined : undefined,
            estado: 'nuevo',
            motivo: '',
        };

        if (precio !== undefined && precio < 0) {
            lineas.push({ ...base, estado: 'invalida', motivo: `Precio negativo (${precio}): no se importa.` });
            continue;
        }

        const clave = claveDe(nombre);
        const ficha = clave ? porClave.get(clave) : undefined;

        if (!ficha) {
            lineas.push({
                ...base, estado: 'nuevo',
                motivo: clave
                    ? 'No hay ninguna ficha con exactamente estas palabras: entraría como producto nuevo.'
                    : 'El nombre no tiene ninguna palabra identificativa, así que no se puede emparejar: entraría como nuevo.',
            });
            continue;
        }

        const precioActual = Number((ficha as any).precioCompra) || undefined;

        // El precio por unidad base de la ficha. Se prefiere `standardPrice`,
        // que es el que ya usa `opcionesDeCompra`; si no está, se deriva de su
        // formato con la misma función. Nunca se calcula «a ojo» aquí.
        const stdFicha = resolveStandardPack({
            name: ficha.nombre,
            unitText: (ficha as any).unidadCompra || ficha.unidad,
            explicitQty: Number((ficha as any).cantidad) || undefined,
            explicitUnit: (ficha as any).unidadCompra || ficha.unidad,
        });
        const precioPorBaseActual = Number((ficha as any).standardPrice)
            || (precioActual !== undefined && stdFicha.standardQuantity > 0
                ? precioActual / stdFicha.standardQuantity
                : undefined);

        const comun = {
            ...base,
            ingredienteId: ficha.id,
            ingredienteNombre: ficha.nombre,
            precioActual,
            precioPorBaseActual,
        };

        if (precio === undefined) {
            lineas.push({ ...comun, estado: 'coincide', motivo: 'Casa con una ficha existente, pero la línea no trae precio: no cambiaría nada.' });
            continue;
        }
        if (precioActual === undefined) {
            lineas.push({ ...comun, estado: 'coincide', motivo: 'Casa con una ficha que hoy no tiene precio: este sería el primero.' });
            continue;
        }

        // **Se compara por unidad base, no por el precio de la etiqueta.** Un
        // formato de 3 L a 25 € es más barato que uno de 750 ml a 10 €, y
        // comparar 25 con 10 diría lo contrario de la verdad.
        const comparable = precioPorBase !== undefined
            && precioPorBaseActual !== undefined
            && precioPorBaseActual > 0
            && base.unidadBase === stdFicha.standardUnit;

        if (!comparable) {
            lineas.push({
                ...comun, estado: 'coincide',
                motivo: base.unidadBase && base.unidadBase !== stdFicha.standardUnit
                    ? `Casa con la ficha, pero el formato del fichero está en ${base.unidadBase} y el de tu ficha en ${stdFicha.standardUnit}: no se pueden comparar sin confundir formato con precio.`
                    : 'Casa con la ficha, pero no se ha podido resolver el formato de una de las dos: sin formato no hay precio por unidad que comparar.',
            });
            continue;
        }

        const variacionPct = Math.round(((precioPorBase! - precioPorBaseActual!) / precioPorBaseActual!) * 1000) / 10;
        const porUnidad = `${base.formatoLegible || ''} · ${(precioPorBaseActual! * 1000).toFixed(2)} → ${(precioPorBase! * 1000).toFixed(2)} € por ${base.unidadBase === 'und' ? 'unidad' : base.unidadBase === 'g' ? 'kg' : 'litro'}`;

        if (Math.abs(variacionPct) < 0.05) {
            lineas.push({ ...comun, estado: 'igual', variacionPct: 0, motivo: `Mismo precio por unidad que ya tienes (${porUnidad}).` });
        } else if (variacionPct > 0) {
            lineas.push({ ...comun, estado: 'sube', variacionPct, motivo: `Sube: ${porUnidad}.` });
        } else {
            lineas.push({ ...comun, estado: 'baja', variacionPct, motivo: `Baja: ${porUnidad}.` });
        }
    }

    const cuenta = (e: EstadoLinea) => lineas.filter(l => l.estado === e).length;
    return {
        lineas, columnas, separador, avisos,
        resumen: {
            total: lineas.length,
            nuevas: cuenta('nuevo'),
            coinciden: cuenta('coincide'),
            suben: cuenta('sube'),
            bajan: cuenta('baja'),
            iguales: cuenta('igual'),
            invalidas: cuenta('invalida'),
        },
    };
};
