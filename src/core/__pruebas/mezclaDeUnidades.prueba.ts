import { informeDeMezcla, normalizarUnidad, esUnidadSospechosa, unidadParaGuardar } from '../unidades/mezclaDeUnidades';

let fallos = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error('  ✗ ' + m); fallos++; } };

console.log('mezcla de unidades · I1');

// --- dos escrituras de lo mismo no son dos unidades
ok(normalizarUnidad('PZ') === normalizarUnidad('PZA'), 'PZ y PZA son la misma');
ok(normalizarUnidad('UND') === normalizarUnidad('uds'), 'UND y uds, la misma');
ok(normalizarUnidad('LT') === 'l' && normalizarUnidad('Litros') === 'l', 'LT y Litros son litros');
ok(normalizarUnidad('KGS') === 'kg' && normalizarUnidad('gramos') === 'g', 'peso normalizado');
ok(normalizarUnidad('  L. ') === 'l', 'espacios y punto final no crean unidades nuevas');

// --- lo que NO es una unidad
ok(esUnidadSospechosa('0.700 L'), 'un formato no es una unidad');
ok(esUnidadSospechosa('10813.000 L + 0.700 L'), 'y menos aún un código de producto pegado a un formato');
ok(esUnidadSospechosa(''), 'vacío es sospechoso');
ok(esUnidadSospechosa('botella (700ml)'), 'lleva número: es formato');
ok(!esUnidadSospechosa('und') && !esUnidadSospechosa('kg') && !esUnidadSospechosa('L'),
    'las unidades de verdad son cortas y sin números');

const compra = (o: any) => ({
    id: o.id, ingredientId: o.ing, ingredientName: o.nombre || 'X',
    providerId: 'p', providerName: 'p', unit: o.u, quantity: o.q,
    unitPrice: o.p, totalCost: o.q * o.p,
    createdAt: o.fecha || new Date('2026-06-01'), status: 'completed' as const,
});

// --- EL HALLAZGO del 2026-08-23, fijado aquí para que no se pierda:
// las 435 fichas «mezcladas» del catálogo real son SIEMPRE el mismo patrón —el
// formato metido en el campo unidad frente a la unidad de verdad—, con la
// MISMA cantidad en envases. La suma no está mal; la etiqueta, sí.
const patronReal = [
    compra({ id: 'a', ing: 'i1', nombre: 'TEQUILA CLASE AZUL', u: '0.700 L', q: 1, p: 1200 }),
    compra({ id: 'b', ing: 'i1', nombre: 'TEQUILA CLASE AZUL', u: 'UND', q: 1, p: 999 }),
];
const inf = informeDeMezcla(patronReal);
ok(inf.productosMezclados.length === 1, 'detecta la ficha con dos etiquetas');
ok(inf.productosMezclados[0].cantidadSumadaHoy === 2,
    'la suma son 2 envases — y eso es CORRECTO, no un número sin significado');
ok(inf.productosMezclados[0].unidadSospechosa,
    'y avisa de que una de las dos etiquetas no es una unidad');

// --- la que manda hoy es la de la PRIMERA compra procesada, no la mayoritaria
const ordenImporta = informeDeMezcla([
    compra({ id: 'a', ing: 'i2', u: 'UND', q: 1, p: 10 }),
    compra({ id: 'b', ing: 'i2', u: '0.700 L', q: 5, p: 10 }),
]);
ok(ordenImporta.productosMezclados[0].unidadQueMandaHoy === 'und',
    'manda la primera aunque las otras pesen más: es lo que hace buildStockFromPurchases');

// --- una sola unidad no es mezcla, por rara que sea la etiqueta
const solaRara = informeDeMezcla([
    compra({ id: 'a', ing: 'i3', u: '14217.000 L + 0.750 L', q: 3, p: 50 }),
]);
ok(solaRara.productosMezclados.length === 0, 'una etiqueta absurda pero única NO es mezcla');
ok(solaRara.sospechosas.length === 1, 'pero sí sale señalada como etiqueta que no es unidad');

// --- las compras sin cantidad no ensucian el informe
ok(informeDeMezcla([compra({ id: 'a', ing: 'i4', u: 'L', q: 0, p: 5 })]).productosConCompras === 0,
    'una compra de cantidad cero no cuenta como producto comprado');

// --- el importe afectado suma solo lo mezclado
ok(Math.abs(inf.importeAfectado - 2199) < 0.01,
    `el importe afectado son los 2.199 € de la ficha mezclada, salió ${inf.importeAfectado}`);

// --- normalización EN LA ENTRADA: lo que se guardará a partir de ahora
ok(unidadParaGuardar('0.700 L') === 'und', 'un formato no se guarda como unidad: se guarda «und»');
ok(unidadParaGuardar('14217.000 L + 0.750 L') === 'und', 'un código pegado a un formato, tampoco');
ok(unidadParaGuardar('LT') === 'l' && unidadParaGuardar('KGS') === 'kg', 'las unidades reales se canonizan');
ok(unidadParaGuardar('UN') === 'und' && unidadParaGuardar('UND') === 'und',
    '«un» y «und» dejan de ser dos unidades distintas');
ok(unidadParaGuardar('') === 'und' && unidadParaGuardar(null) === 'und', 'sin nada, envases');
ok(unidadParaGuardar('0.700 L', 'kg') === 'kg', 'el respaldo se puede elegir');
ok(unidadParaGuardar('bj') === 'bj', 'las unidades raras pero reales del catálogo se respetan');

console.log(fallos === 0 ? '  ✓ todo correcto' : `  ${fallos} fallo(s)`);
if (fallos > 0) process.exit(1);
