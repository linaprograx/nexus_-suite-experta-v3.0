import { Supplier } from '../../types';

/**
 * Lo que hay que saber de un proveedor **en el momento de elegirlo**. Punto 16.
 *
 * ## Por qué esto no estaba
 *
 * La ficha del proveedor ya guardaba plazo de entrega, días de reparto y
 * condiciones de pago, y **ninguno de esos datos llegaba a donde se compara**.
 * El desplegable de opciones enseñaba nombre y precio, así que la decisión se
 * tomaba con la mitad de la información: elegir proveedor no es solo el precio.
 *
 * Dos euros más barato deja de serlo si tarda cinco días y solo reparte los
 * martes, y eso es justo lo que había que ir a buscar a otra pantalla.
 *
 * ## Lo que no hace
 *
 * No puntúa ni recomienda. Devuelve el dato para que se vea al lado del precio;
 * quien decide sigue siendo quien compra. Un «score» de proveedor con estos tres
 * campos sería una opinión disfrazada de número.
 */

const DIAS_CORTOS: Record<string, string> = {
    lunes: 'L', martes: 'M', miercoles: 'X', miércoles: 'X',
    jueves: 'J', viernes: 'V', sabado: 'S', sábado: 'S', domingo: 'D',
};

/** «L · X · V», o vacío si no hay días declarados. */
export const diasDeReparto = (dias?: string[]): string =>
    (dias || [])
        .map(d => DIAS_CORTOS[String(d).trim().toLowerCase()] || String(d).trim().slice(0, 3))
        .filter(Boolean)
        .join(' · ');

/**
 * Una línea corta para poner bajo el nombre del proveedor.
 *
 * Devuelve cadena vacía cuando no hay ningún dato: escribir «— · —» ocupa sitio
 * y no dice nada, y además hace parecer que el proveedor está mal configurado
 * cuando lo que pasa es que no se ha rellenado todavía.
 */
export const resumenDeProveedor = (p?: Supplier | null): string => {
    if (!p) return '';
    const partes: string[] = [];

    const plazo = Number(p.leadTimeDays);
    if (isFinite(plazo) && plazo > 0) partes.push(plazo === 1 ? '1 día' : `${plazo} días`);

    const dias = diasDeReparto(p.deliveryDays);
    if (dias) partes.push(dias);

    if (p.paymentTerms && String(p.paymentTerms).trim()) partes.push(String(p.paymentTerms).trim());

    return partes.join(' · ');
};
