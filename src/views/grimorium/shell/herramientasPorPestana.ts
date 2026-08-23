import { GrimoriumViewMode } from '../../../context/Grimorium/ItemContext';

/**
 * **En qué pestaña vive cada herramienta de la barra de Grimorio.**
 *
 * ## El defecto, encontrado el 2026-08-23
 *
 * Las nueve herramientas se enseñaban en las tres pestañas. En Mercado eso
 * dejaba cuatro iconos que operan sobre lo que **no** está en pantalla:
 * «Carta» abre las recetas publicadas, «Costes» tiñe el escandallo de una
 * receta, «Duplicados» compara fichas de inventario, «IA» ajusta el asistente
 * de recetas e inventario.
 *
 * Un icono visible es una promesa de que actúa sobre lo que estás viendo.
 * Cuando cuatro de nueve no la cumplen, la barra deja de leerse entera y se
 * navega por memoria — que es justo lo que una barra de herramientas existe
 * para evitar.
 *
 * ## Por qué esto arregla también el desbordamiento
 *
 * Con el menú lateral abierto, nueve pastillas con rótulo no caben y la última
 * se descolgaba a una segunda línea, donde parece otra fila de navegación y no
 * lo es. Recortar el ancho de los botones habría cuadrado la fila **sin tocar
 * la causa**: sobraban cuatro herramientas, no sobraban píxeles.
 *
 * ## La regla
 *
 * `atencion` e `historial` salen en las tres: lo que necesita tu atención no
 * depende de dónde estés mirando, y el historial es de la sesión, no de la
 * pantalla. Todo lo demás vive donde están los datos sobre los que actúa.
 */
export const HERRAMIENTAS_POR_PESTANA: Record<string, GrimoriumViewMode[]> = {
    ia: ['recipes', 'stock'],
    atencion: ['recipes', 'stock', 'market'],
    historial: ['recipes', 'stock', 'market'],
    carta: ['recipes'],
    familias: ['market'],
    precios: ['market'],
    importar: ['market'],
    duplicados: ['stock'],
    costes: ['recipes', 'stock'],
};

/**
 * Cuántas caben en una línea sin descolgarse, con el menú lateral **abierto**
 * y rótulos visibles (≥1024 px). Medido, no supuesto: cinco pastillas de ~110
 * px más separaciones caben en el ancho útil que deja el menú abierto en una
 * pantalla de 1400 px. La prueba lo fija para que añadir una sexta a una
 * pestaña falle aquí y no en la cara del usuario.
 */
export const CABEN_POR_FILA = 5;

/** Las herramientas de una pestaña, en el orden en que se pintan. */
export const herramientasDe = (modo: GrimoriumViewMode): string[] =>
    Object.keys(HERRAMIENTAS_POR_PESTANA).filter(id =>
        HERRAMIENTAS_POR_PESTANA[id].includes(modo));
