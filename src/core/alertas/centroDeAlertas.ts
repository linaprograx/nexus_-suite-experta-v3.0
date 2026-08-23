import { Ingredient, Recipe, StockRule, StockItem, PurchaseEvent } from '../../types';
import { nivelDeStock } from '../stock/nivelDeStock';
import { reglasPorMaestro } from '../stock/reglasPorProducto';
import { gastoPorProveedor, concentracion } from '../compras/gastoPorProveedor';
import { proveedoresDeFicha } from '../ofertas/oferta';

/**
 * El centro de alertas. **Puntos 5 y 6.**
 *
 * ## Lo que le faltaba a la bandeja que ya existía
 *
 * `computeGrimorioAlerts` daba título, mensaje y color. Con eso se sabe *qué
 * pasa* y nada más: ni por qué importa, ni cuánto cuesta, ni qué hacer. Una
 * alerta que no se puede accionar es ruido con buena intención, y al cabo de
 * unos días se deja de mirar.
 *
 * Aquí cada alerta responde a las cuatro preguntas del punto 5:
 * **qué pasa · por qué importa · qué impacto tiene · qué se puede hacer**.
 *
 * ## La prioridad, y por qué NO es una puntuación
 *
 * El punto 6 pide priorizar. La tentación es un número del 0 al 100, y sería un
 * error: nadie puede auditar de dónde sale, así que o se cree a ciegas o se
 * ignora. Se usan **tres niveles con un criterio dicho en voz alta**:
 *
 *   · `ahora`         — impide servir hoy, o hay dinero saliendo por la puerta.
 *   · `esta-semana`   — todavía no duele, pero va a doler.
 *   · `cuando-puedas` — deja los datos mejor; no cambia el servicio de hoy.
 *
 * Dentro de cada nivel ordena el **impacto en euros**, que sí es un número que
 * se puede comprobar. Cuando no se puede calcular, se dice — no se estima.
 *
 * ## Las acciones dependen de la causa
 *
 * El plan lo pide explícitamente: *«acciones dependientes de la causa, no un
 * menú genérico»*. Un producto sin precio no se arregla pidiendo más; un
 * sobrestock no se arregla comprando. Cada alerta trae las suyas.
 */

export type Prioridad = 'ahora' | 'esta-semana' | 'cuando-puedas';

export interface AccionAlerta {
    etiqueta: string;
    /** A dónde lleva. La vista decide cómo abrirlo. */
    destino: 'mercado' | 'inventario' | 'recetas' | 'unidades' | 'duplicados' | 'proveedores' | 'precios';
}

export interface Alerta {
    id: string;
    titulo: string;
    /** Qué pasa, en una frase. */
    queOcurre: string;
    /** Por qué importa. Nunca se deja vacío: si no importa, no es una alerta. */
    porQueImporta: string;
    /** El impacto en euros cuando se puede calcular. `undefined` = no se sabe. */
    impacto?: number;
    /** Cómo se explica ese impacto, o por qué no lo hay. */
    impactoTexto: string;
    prioridad: Prioridad;
    acciones: AccionAlerta[];
    /** Cuántos elementos hay detrás. Para decir «27», no «varios». */
    cuantos: number;
}

const eur = (n: number) => `€${n.toFixed(2)}`;

const ORDEN: Record<Prioridad, number> = { ahora: 0, 'esta-semana': 1, 'cuando-puedas': 2 };

/**
 * Ordena: primero por urgencia, después por dinero.
 *
 * Un impacto grande no adelanta a algo que impide servir hoy — cambiar ese
 * orden convertiría la lista en un ranking de importes, y entonces lo urgente
 * se hunde debajo de lo caro.
 */
export const ordenarAlertas = (alertas: Alerta[]): Alerta[] =>
    [...alertas].sort((a, b) =>
        ORDEN[a.prioridad] - ORDEN[b.prioridad] || (b.impacto ?? 0) - (a.impacto ?? 0));

export interface DatosAlertas {
    ingredientes: Ingredient[];
    recetas: Recipe[];
    reglas: StockRule[];
    stock: StockItem[];
    compras: PurchaseEvent[];
}

export const construirAlertas = (d: DatosAlertas): Alerta[] => {
    const alertas: Alerta[] = [];
    const ingredientes = d.ingredientes || [];
    const stock = d.stock || [];

    // ── 1. Rotura y stock bajo. Impide servir: `ahora`.
    const porMaestro = reglasPorMaestro((d.reglas || []).filter(r => r.active), ingredientes);
    const niveles = stock.map(s => ({ item: s, nivel: nivelDeStock(porMaestro.get(s.ingredientId), s.quantityAvailable) }));

    const rotos = niveles.filter(n => n.nivel.nivel === 'rotura');
    if (rotos.length) {
        alertas.push({
            id: 'stock-rotura',
            titulo: 'Sin existencias',
            queOcurre: `${rotos.length} producto(s) a cero.`,
            porQueImporta: 'Cualquier receta que los use no se puede servir. No es un aviso de compra: es una carta con huecos.',
            impactoTexto: 'No se traduce a euros: lo que se pierde son ventas que no llegan a hacerse.',
            prioridad: 'ahora',
            cuantos: rotos.length,
            acciones: [
                { etiqueta: 'Ver en Inventario', destino: 'inventario' },
                { etiqueta: 'Comprar en Mercado', destino: 'mercado' },
            ],
        });
    }

    const bajos = niveles.filter(n => n.nivel.nivel === 'bajo');
    if (bajos.length) {
        alertas.push({
            id: 'stock-bajo',
            titulo: 'Por debajo del mínimo',
            queOcurre: `${bajos.length} producto(s) por debajo del mínimo que tú fijaste.`,
            porQueImporta: 'Todavía se puede servir, pero el margen de maniobra se acabó: la siguiente ronda lo agota.',
            impactoTexto: 'Sin coste hoy; el coste llega si se convierte en rotura.',
            prioridad: 'esta-semana',
            cuantos: bajos.length,
            acciones: [
                { etiqueta: 'Montar pedido', destino: 'inventario' },
                { etiqueta: 'Revisar reglas', destino: 'inventario' },
            ],
        });
    }

    // ── 2. Sobrestock. Dinero parado, y en fresco además caduca.
    const sobra = niveles.filter(n => n.nivel.nivel === 'sobrestock');
    if (sobra.length) {
        const dinero = sobra.reduce((a, n) => {
            const exceso = n.nivel.exceso || 0;
            return a + exceso * (n.item.averageUnitCost || 0);
        }, 0);
        alertas.push({
            id: 'stock-sobra',
            titulo: 'Sobrestock',
            queOcurre: `${sobra.length} producto(s) por encima del máximo que fijaste.`,
            porQueImporta: 'Es capital parado en una estantería, y en producto fresco es merma esperando a ocurrir.',
            impacto: Math.round(dinero * 100) / 100,
            impactoTexto: dinero > 0
                ? `${eur(dinero)} inmovilizados por encima del techo, al coste medio de cada producto.`
                : 'No se puede valorar: esos productos no tienen coste medio calculado.',
            prioridad: 'esta-semana',
            cuantos: sobra.length,
            acciones: [
                { etiqueta: 'Ver cuáles', destino: 'inventario' },
                { etiqueta: 'Ajustar techos', destino: 'inventario' },
            ],
        });
    }

    // ── 3. Sin precio. Rompe el coste de todo lo que los use.
    const sinPrecio = ingredientes.filter(i => {
        const p = Number((i as any).precioCompra) || Number((i as any).standardPrice) || 0;
        return !(p > 0);
    });
    if (sinPrecio.length) {
        alertas.push({
            id: 'sin-precio',
            titulo: 'Productos sin precio',
            queOcurre: `${sinPrecio.length} ficha(s) sin precio de compra.`,
            // Sin asteriscos: esto va a una celda de texto, no a Markdown, y ahí se
            // leen literales. El énfasis se pone con las palabras.
            porQueImporta: 'Toda receta que los use cuesta MENOS de lo que cuesta, sin avisar: el escandallo sale barato y el margen, inflado.',
            impactoTexto: 'El error no se puede medir precisamente porque falta el precio. Ese es el problema.',
            prioridad: 'ahora',
            cuantos: sinPrecio.length,
            acciones: [{ etiqueta: 'Completar en Mercado', destino: 'mercado' }],
        });
    }

    // ── 4. Creados al vuelo. Precio estimado que parece catálogo.
    const porRevisar = ingredientes.filter(i => (i as any).pendienteRevision);
    if (porRevisar.length) {
        alertas.push({
            id: 'por-revisar',
            titulo: 'Fichas por revisar',
            queOcurre: `${porRevisar.length} ficha(s) creadas al vuelo desde una receta.`,
            porQueImporta: 'Sus datos son aproximados. Mientras no se confirmen, un precio estimado se confunde con catálogo real.',
            impactoTexto: 'Sin impacto directo; lo que cambia es cuánto puedes fiarte de los costes que las usan.',
            prioridad: 'cuando-puedas',
            cuantos: porRevisar.length,
            acciones: [{ etiqueta: 'Filtrar «por revisar»', destino: 'mercado' }],
        });
    }

    // ── 5. Dependencia de un solo proveedor. Lo que enseñó el punto 34.
    const gastos = gastoPorProveedor(d.compras || []);
    const pesos = concentracion(gastos);
    const dominante = pesos.find(p => p.pct >= 60 && p.proveedorNombre !== 'Sin proveedor');
    if (dominante) {
        const g = gastos.find(x => x.proveedorNombre === dominante.proveedorNombre);
        alertas.push({
            id: 'dependencia-proveedor',
            titulo: 'Dependes de un proveedor',
            queOcurre: `${dominante.proveedorNombre} se lleva el ${dominante.pct} % de tu gasto.`,
            porQueImporta: 'No es un buen precio, es una dependencia: si sube, falla o deja de servir, no hay plan B montado.',
            impacto: g?.total,
            impactoTexto: g ? `${eur(g.total)} en ${g.compras} compras.` : '',
            prioridad: 'cuando-puedas',
            cuantos: 1,
            acciones: [
                { etiqueta: 'Ver el gasto', destino: 'precios' },
                { etiqueta: 'Buscar alternativas', destino: 'mercado' },
            ],
        });
    }

    // ── 6. Productos con un solo proveedor: el mismo riesgo, por producto.
    const unicos = ingredientes.filter(i => proveedoresDeFicha(i) === 1);
    if (unicos.length) {
        alertas.push({
            id: 'proveedor-unico',
            titulo: 'Productos con una sola fuente',
            queOcurre: `${unicos.length} producto(s) se compran a un único proveedor.`,
            porQueImporta: 'Sin una segunda opción no hay con qué comparar el precio, ni a quién recurrir si falla el pedido.',
            impactoTexto: 'No se valora en euros: es riesgo de suministro, no un coste de hoy.',
            prioridad: 'cuando-puedas',
            cuantos: unicos.length,
            acciones: [{ etiqueta: 'Ver en Mercado', destino: 'mercado' }],
        });
    }

    return ordenarAlertas(alertas);
};

/** Cuántas hay de cada nivel. Para la cifra de cabecera. */
export const resumenDeAlertas = (alertas: Alerta[]) => ({
    total: alertas.length,
    ahora: alertas.filter(a => a.prioridad === 'ahora').length,
    estaSemana: alertas.filter(a => a.prioridad === 'esta-semana').length,
    cuandoPuedas: alertas.filter(a => a.prioridad === 'cuando-puedas').length,
    /** Suma de lo que sí se puede valorar. */
    impacto: Math.round(alertas.reduce((a, x) => a + (x.impacto || 0), 0) * 100) / 100,
});
