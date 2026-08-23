/**
 * **Incidencias y conocimiento operativo.** Puntos 27 y 28 del plan.
 *
 * ## Por qué estos dos y no los otros de la Fase 5
 *
 * Los puntos 4, 10 y 12 —consumo, ABC, causa raíz— necesitan consumo real a lo
 * largo del tiempo, y hoy no existe: sin TPV solo se sabe lo comprado, nunca lo
 * gastado. Construirlos ahora sería inventar números.
 *
 * El 27 y el 28 son **captura, no análisis**. No dependen de datos que no
 * existen: los crean. Y son justo lo que el punto 26 —inteligencia de
 * proveedores— necesitará para ser algo más que el precio, que es lo único que
 * `evaluateMarketSignals` sabe mirar hoy.
 *
 * ## Son dos cosas distintas, y por eso son dos tipos
 *
 * Una **incidencia** es un suceso: pasó un día, puede quedar resuelta, y tres
 * iguales son un patrón. Una **nota operativa** es conocimiento vigente: «este
 * repartidor llega antes si le llamas» no ocurrió un martes, es verdad hasta
 * que deje de serlo.
 *
 * Meterlas en un mismo tipo obligaría a poner fecha a lo que no la tiene y a
 * dejar sin resolver lo que no se resuelve. Comparten a quién se refieren, y
 * nada más.
 *
 * ## Lo que NO hace
 *
 * No puntúa proveedores. Cuenta lo que pasó y dice sobre cuántos pedidos, que
 * es la única forma de que el dato signifique algo — ver `tasaDeIncidencia`.
 */

/** A quién se refiere. Al menos uno de los dos. */
export interface Referencia {
    proveedorId?: string;
    fichaId?: string;
}

export type TipoIncidencia =
    | 'retraso'      // llegó tarde o no llegó
    | 'falta'        // faltaba producto del pedido
    | 'estado'       // llegó roto, caducado o en mal estado
    | 'precio'       // cobró distinto de lo acordado
    | 'sustitucion'  // cambió el producto sin avisar
    | 'otro';

/**
 * Qué significa cada tipo y por qué se registra por separado.
 *
 * No es decoración: el tipo es lo que convierte tres sucesos sueltos en «este
 * proveedor llega tarde», que es una frase accionable. Un campo de texto libre
 * único guardaría lo mismo y no permitiría contarlo nunca.
 */
export const TIPOS_INCIDENCIA: Record<TipoIncidencia, { rotulo: string; porQueImporta: string }> = {
    retraso: { rotulo: 'Llegó tarde', porQueImporta: 'Obliga a recomprar de urgencia, casi siempre más caro.' },
    falta: { rotulo: 'Faltaba producto', porQueImporta: 'El pedido no cubre lo que se pidió: el stock recibido miente.' },
    estado: { rotulo: 'Llegó en mal estado', porQueImporta: 'Se paga producto que no se puede servir.' },
    precio: { rotulo: 'Precio distinto', porQueImporta: 'El escandallo se calculó con un precio que no es el que se pagó.' },
    sustitucion: { rotulo: 'Cambió el producto', porQueImporta: 'La receta sale con un ingrediente que nadie aprobó.' },
    otro: { rotulo: 'Otra cosa', porQueImporta: 'Queda registrado aunque no encaje en los anteriores.' },
};

/**
 * Grave o leve. **Dos niveles, no una puntuación del 1 al 5.**
 *
 * Es la misma regla que rige el centro de alertas: una cifra opaca invita a
 * ordenar por ella y a discutirla, y nadie sabe qué separa un 3 de un 4.
 * «Seria» aquí significa una cosa concreta: te impidió servir o te costó
 * dinero. Todo lo demás es «leve».
 */
export type Gravedad = 'leve' | 'seria';

export interface Incidencia extends Referencia {
    id: string;
    proveedorId: string;
    /** Cuándo pasó. No cuándo se apuntó: se registra días después. */
    fecha: Date;
    tipo: TipoIncidencia;
    gravedad: Gravedad;
    /** El pedido al que pertenece, si se registró desde uno. */
    pedidoId?: string;
    nota?: string;
    /** Ausente mientras sigue abierta. Resolver **no borra**. */
    resueltaEl?: Date;
}

export interface NotaOperativa extends Referencia {
    id: string;
    texto: string;
    creadaEl: Date;
    actualizadaEl?: Date;
}

const DIAS = 24 * 60 * 60 * 1000;

/** La ventana en la que un suceso todavía dice algo del proveedor de hoy. */
export const VENTANA_DIAS = 90;

/**
 * A partir de aquí deja de ser mala suerte.
 *
 * Tres del mismo tipo en la ventana. El umbral es discutible y por eso está
 * aquí, con nombre y a la vista, en vez de escondido en un `if` dentro de una
 * pantalla: si resulta ser demasiado laxo se cambia en un sitio.
 */
export const REPETICIONES_PARA_PATRON = 3;

export const enVentana = (i: Incidencia, ahora: Date = new Date(), dias = VENTANA_DIAS): boolean =>
    ahora.getTime() - i.fecha.getTime() <= dias * DIAS;

export interface ResumenProveedor {
    proveedorId: string;
    /** En la ventana. */
    total: number;
    serias: number;
    abiertas: number;
    porTipo: Record<string, number>;
    /** Los tipos que se repiten lo bastante como para llamarlos patrón. */
    patrones: TipoIncidencia[];
}

export const resumenDeIncidencias = (
    incidencias: Incidencia[],
    proveedorId: string,
    ahora: Date = new Date(),
): ResumenProveedor => {
    const suyas = (incidencias || []).filter(i => i.proveedorId === proveedorId && enVentana(i, ahora));
    const porTipo: Record<string, number> = {};
    for (const i of suyas) porTipo[i.tipo] = (porTipo[i.tipo] || 0) + 1;

    return {
        proveedorId,
        total: suyas.length,
        serias: suyas.filter(i => i.gravedad === 'seria').length,
        abiertas: suyas.filter(i => !i.resueltaEl).length,
        porTipo,
        patrones: (Object.keys(porTipo) as TipoIncidencia[])
            .filter(t => porTipo[t] >= REPETICIONES_PARA_PATRON)
            .sort((a, b) => porTipo[b] - porTipo[a]),
    };
};

/**
 * Incidencias **por pedido**, no en bruto.
 *
 * El defecto que esto evita: al proveedor al que más le compras le pasarán más
 * cosas, siempre. Ordenar proveedores por número de incidencias corona como
 * peor al que más trabaja contigo, y esa lectura es falsa — es exactamente el
 * mismo error que los contadores que este proyecto ya ha tenido que arreglar
 * dos veces.
 *
 * Devuelve `null` cuando no hay pedidos en la ventana: sin denominador no hay
 * tasa, y **un cero inventado se lee como «perfecto»**, que es peor que no
 * decir nada.
 */
export const tasaDeIncidencia = (
    incidencias: Incidencia[],
    proveedorId: string,
    pedidosEnVentana: number,
    ahora: Date = new Date(),
): number | null => {
    if (!pedidosEnVentana || pedidosEnVentana <= 0) return null;
    return resumenDeIncidencias(incidencias, proveedorId, ahora).total / pedidosEnVentana;
};

/** Las notas vigentes de un proveedor o de una ficha, la más reciente primero. */
export const notasDe = (notas: NotaOperativa[], ref: Referencia): NotaOperativa[] =>
    (notas || [])
        .filter(n => (ref.proveedorId ? n.proveedorId === ref.proveedorId : true)
            && (ref.fichaId ? n.fichaId === ref.fichaId : true)
            && (ref.proveedorId || ref.fichaId ? true : false))
        .sort((a, b) => (b.actualizadaEl || b.creadaEl).getTime() - (a.actualizadaEl || a.creadaEl).getTime());

/**
 * Una frase para la cabecera del proveedor. Vacía cuando no hay nada que decir:
 * un «0 incidencias» permanente ocupa sitio y no informa de nada.
 */
export const fraseDeProveedor = (r: ResumenProveedor): string => {
    if (r.total === 0) return '';
    if (r.patrones.length > 0) {
        const t = r.patrones[0];
        return `${r.porTipo[t]} veces «${TIPOS_INCIDENCIA[t].rotulo.toLowerCase()}» en ${VENTANA_DIAS} días`;
    }
    const cuerpo = r.total === 1 ? '1 incidencia' : `${r.total} incidencias`;
    return r.abiertas > 0 ? `${cuerpo}, ${r.abiertas} sin resolver` : cuerpo;
};
