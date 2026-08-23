import { perfilDeProveedor, avisosDelPerfil, CONCENTRACION_ALTA } from '../proveedores/perfilProveedor';
import { Incidencia } from '../proveedores/incidencias';

let fallos = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error('  ✗ ' + m); fallos++; } };

console.log('perfil de proveedor · punto 26');

const HOY = new Date('2026-08-23T12:00:00Z');
const haceDias = (d: number) => new Date(HOY.getTime() - d * 24 * 60 * 60 * 1000);

const ing = (id: string, nombre: string, supplierData: any): any => ({
    id, nombre, categoria: 'Alcohol', costo: 0, unidad: 'ud',
    standardQuantity: 700, standardUnit: 'ml', supplierData,
});

// vinos vende los tres; bordinos solo el vodka, y más barato
const ingredientes = [
    ing('i1', 'ABSOLUT', {
        'vinos::700ml': { price: 14, formatQty: 700, formatUnit: 'ml' },
        'bordinos::700ml': { price: 10, formatQty: 700, formatUnit: 'ml' },
    }),
    ing('i2', 'MEZCAL', { 'vinos::700ml': { price: 60, formatQty: 700, formatUnit: 'ml' } }),
    ing('i3', 'GIN', { 'vinos::700ml': { price: 20, formatQty: 700, formatUnit: 'ml' } }),
];

const compra = (o: any) => ({
    id: o.id, ingredientId: o.ing, ingredientName: '', providerId: o.prov, providerName: o.prov,
    unit: 'ud', quantity: o.q, unitPrice: o.p, totalCost: o.q * o.p,
    createdAt: o.fecha || haceDias(10), status: 'completed' as const,
});

const compras = [
    compra({ id: 'c1', ing: 'i1', prov: 'vinos', q: 6, p: 14 }),
    compra({ id: 'c2', ing: 'i2', prov: 'vinos', q: 2, p: 60 }),
    compra({ id: 'c3', ing: 'i1', prov: 'bordinos', q: 1, p: 10 }),
    compra({ id: 'c4', ing: 'i1', prov: 'vinos', q: 3, p: 14, fecha: haceDias(400) }), // fuera de ventana
];

const p = perfilDeProveedor({ proveedorId: 'vinos', ingredientes, compras, incidencias: [], ahora: HOY });

// --- qué vende y de qué eres rehén
ok(p.productos.length === 3, `vende 3, salió ${p.productos.length}`);
ok(p.fuenteUnica.length === 2, `MEZCAL y GIN solo los vende él, salió ${p.fuenteUnica.length}`);
ok(p.fuenteUnica.every(x => x.nombre !== 'ABSOLUT'), 'el vodka NO es fuente única: bordinos también lo vende');

// --- la alternativa solo cuenta si es MÁS BARATA y comparable
const absolut = p.productos.find(x => x.nombre === 'ABSOLUT')!;
ok(absolut.alternativa?.proveedorId === 'bordinos', 'encuentra la alternativa más barata');
ok(p.productos.find(x => x.nombre === 'MEZCAL')!.alternativa === null,
    'sin otro proveedor no hay alternativa que inventar');

const alReves = perfilDeProveedor({ proveedorId: 'bordinos', ingredientes, compras, incidencias: [], ahora: HOY });
ok(alReves.productos.find(x => x.nombre === 'ABSOLUT')!.alternativa === null,
    'al más barato NO se le ofrece una alternativa más cara');

// --- unidades incomparables no se comparan
const mixto = [ing('i9', 'RARO', {
    'vinos::700ml': { price: 30, formatQty: 700, formatUnit: 'ml' },
    'otro::1und': { price: 2, formatQty: 1, formatUnit: 'und' },
})];
ok(perfilDeProveedor({ proveedorId: 'vinos', ingredientes: mixto, compras: [], incidencias: [], ahora: HOY })
    .productos[0].alternativa === null,
    '€/ml no se compara con €/und, por barato que parezca');

// --- el sobrecoste va en unidad base y solo dentro de la ventana
// 6 envases × 700 ml × (14/700 − 10/700) = 4200 × 0,005714… = 24 €
ok(Math.abs(p.costariaHoyMenos - 24) < 0.01,
    `6 botellas a 4 € de diferencia son 24 €, salió ${p.costariaHoyMenos.toFixed(2)}`);
ok(p.comprasComparadas === 1,
    `solo una compra tenía alternativa dentro de la ventana, salió ${p.comprasComparadas}`);
ok(alReves.costariaHoyMenos === 0, 'el más barato no tiene sobrecoste que enseñar');

// --- dinero y dependencia
ok(Math.abs(p.pctDelGasto - (246 / 256) * 100) < 0.5,
    `vinos concentra casi todo el gasto, salió ${p.pctDelGasto.toFixed(1)} %`);

// --- avisos: frases, no puntuaciones
const avisos = avisosDelPerfil(p);
ok(avisos.some(a => a.texto.includes('% de tu gasto')), 'avisa de la concentración');
ok(avisos.some(a => a.texto.includes('solo los vende él')), 'avisa de la fuente única');
ok(avisos.some(a => a.texto.includes('más barato')), 'avisa del sobrecoste');
ok(avisos.every(a => !!a.porQue), 'todo aviso dice por qué importa');
ok(avisos.every(a => !/\b\d+([.,]\d+)?\s*\/\s*10\b/.test(a.texto)), 'ninguna puntuación sintética');
ok(avisos.find(a => a.tono === 'dinero')!.porQue.includes('No es dinero perdido'),
    'el sobrecoste dice en voz alta que compara ofertas de hoy con compras de ayer');

// --- sin nada que decir, no se dice nada
const limpio = perfilDeProveedor({ proveedorId: 'bordinos', ingredientes, compras, incidencias: [], ahora: HOY });
ok(limpio.pctDelGasto < CONCENTRACION_ALTA, 'bordinos no concentra');
ok(avisosDelPerfil(limpio).length === 0, 'sin nada digno de mención, cero avisos — y eso es una respuesta');

// --- las incidencias entran por su módulo, no se recalculan aquí
const incs: Incidencia[] = [1, 2, 3].map((n): Incidencia => ({
    id: `x${n}`, proveedorId: 'vinos', fecha: haceDias(n * 5), tipo: 'retraso', gravedad: 'leve',
}));
const conInc = perfilDeProveedor({ proveedorId: 'vinos', ingredientes, compras, incidencias: incs, ahora: HOY });
ok(conInc.incidencias.patrones.includes('retraso'), 'el patrón lo detecta el módulo de incidencias');
ok(conInc.tasa !== null && conInc.tasa > 0, 'la tasa se calcula sobre las compras recibidas');
ok(avisosDelPerfil(conInc).some(a => a.texto.includes('no son mala suerte')), 'y sale como aviso');

// --- LA TRAMPA DE IDENTIDAD, encontrada en el catálogo real el 2026-08-23
// Dos fichas del MISMO producto, cada una de un proveedor distinto. Contando
// por ficha, las dos salían como «solo lo vende él»: la app diría «no tienes
// alternativa» de algo que sí la tiene, que es la peor clase de error.
const duplicadas = [
    ing('d1', 'CAMPARI BITTER', { 'vinos::700ml': { price: 18, formatQty: 700, formatUnit: 'ml' } }),
    ing('d2', 'CAMPARI BITTER', { 'bordinos::700ml': { price: 15, formatQty: 700, formatUnit: 'ml' } }),
];
const dup = perfilDeProveedor({ proveedorId: 'vinos', ingredientes: duplicadas, compras: [], incidencias: [], ahora: HOY });
ok(dup.productos.length === 1, `dos fichas del mismo producto son UN producto, salió ${dup.productos.length}`);
ok(dup.fuenteUnica.length === 0, 'con el mismo producto en otro proveedor, NO es fuente única');
ok(dup.productos[0].alternativa?.proveedorId === 'bordinos',
    'y la alternativa más barata aparece aunque viva en otra ficha');

// Y las compras siguen encontrando su producto por el id de SU ficha, no por
// el del grupo: si no, el sobrecoste saldría bajo sin que nada lo indicara.
const compraDeDup = [compra({ id: 'cd', ing: 'd1', prov: 'vinos', q: 2, p: 18 })];
const dup2 = perfilDeProveedor({ proveedorId: 'vinos', ingredientes: duplicadas, compras: compraDeDup, incidencias: [], ahora: HOY });
ok(dup2.comprasComparadas === 1, 'la compra encuentra su producto a través del id de su ficha');
ok(Math.abs(dup2.costariaHoyMenos - 6) < 0.01,
    `2 botellas a 3 € de diferencia son 6 €, salió ${dup2.costariaHoyMenos.toFixed(2)}`);

console.log(fallos === 0 ? '  ✓ todo correcto' : `  ${fallos} fallo(s)`);
if (fallos > 0) process.exit(1);
