import { construirAlertas, ordenarAlertas, resumenDeAlertas, Alerta } from '../alertas/centroDeAlertas';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const ing = (id: string, extra: any = {}): any => ({
    id, nombre: id, unidad: 'L', unidadCompra: 'L', cantidad: 1,
    precioCompra: 10, standardUnit: 'ml', standardQuantity: 1000,
    proveedores: ['p1'], ...extra,
});
const regla = (id: string, min: number, max?: number): any => ({ id: 'r' + id, ingredientId: id, minStock: min, maxStock: max, reorderQuantity: 1, active: true });
const item = (id: string, qty: number, coste = 2): any => ({ ingredientId: id, ingredientName: id, quantityAvailable: qty, unit: 'und', averageUnitCost: coste, totalValue: qty * coste, lastPurchaseDate: '2026-01-01' });
const compra = (prov: string, total: number): any => ({ id: 'c' + Math.random(), ingredientId: 'i', ingredientName: 'i', providerId: prov, providerName: prov, unit: 'und', quantity: 1, unitPrice: total, totalCost: total, createdAt: new Date('2026-01-01'), status: 'completed' });

const vacio = { ingredientes: [], recetas: [], reglas: [], stock: [], compras: [] };

console.log('\n— Sin problemas, sin alertas —');
eq('un negocio sin datos no genera ruido', construirAlertas(vacio).length, 0);

console.log('\n— Cada alerta responde a las cuatro preguntas —');
const conTodo = construirAlertas({
    ...vacio,
    ingredientes: [ing('a'), ing('b', { precioCompra: 0, standardPrice: 0 }), ing('c', { pendienteRevision: true })],
    reglas: [regla('a', 5), regla('d', 1)],
    stock: [item('a', 2), item('d', 0)],
});
eq('ninguna se queda sin «por qué importa»', conTodo.every(a => a.porQueImporta.length > 10), true);
eq('ninguna se queda sin acciones', conTodo.every(a => a.acciones.length > 0), true);
eq('ninguna dice «varios»: dice cuántos', conTodo.every(a => a.cuantos > 0), true);
eq('y todas explican su impacto, aunque sea para decir que no lo hay',
    conTodo.every(a => a.impactoTexto.length > 10), true);

console.log('\n— Las acciones dependen de la causa —');
const sinPrecio = conTodo.find(a => a.id === 'sin-precio')!;
eq('un producto sin precio no se arregla pidiendo más',
    sinPrecio.acciones.map(a => a.etiqueta), ['Completar en Mercado']);
const rotura = conTodo.find(a => a.id === 'stock-rotura')!;
eq('una rotura sí lleva a comprar', rotura.acciones.some(a => a.destino === 'mercado'), true);

console.log('\n— La prioridad —');
eq('lo que impide servir hoy es «ahora»', rotura.prioridad, 'ahora');
eq('sin precio también: falsea todos los costes', sinPrecio.prioridad, 'ahora');
eq('lo que solo mejora los datos puede esperar',
    conTodo.find(a => a.id === 'por-revisar')?.prioridad, 'cuando-puedas');

// Un impacto grande NO adelanta a algo que impide servir hoy: si lo hiciera, la
// lista sería un ranking de importes y lo urgente se hundiría debajo de lo caro.
const orden = ordenarAlertas([
    { id: 'caro', prioridad: 'cuando-puedas', impacto: 9999 } as Alerta,
    { id: 'urgente', prioridad: 'ahora', impacto: 1 } as Alerta,
]);
eq('lo urgente va antes que lo caro', orden.map(a => a.id), ['urgente', 'caro']);

console.log('\n— Sobrestock: el impacto sí se puede valorar —');
const conSobra = construirAlertas({ ...vacio, ingredientes: [ing('a')], reglas: [regla('a', 1, 5)], stock: [item('a', 15, 3)] });
const sobra = conSobra.find(a => a.id === 'stock-sobra')!;
eq('10 de más × 3 € = 30 € inmovilizados', sobra.impacto, 30);
eq('  y se dice cómo se ha calculado', sobra.impactoTexto.includes('coste medio'), true);

console.log('\n— Dependencia de proveedor —');
const conDep = construirAlertas({ ...vacio, compras: [compra('IN VINO', 7000), compra('OTRO', 1000)] });
const dep = conDep.find(a => a.id === 'dependencia-proveedor')!;
eq('se avisa a partir del 60 %', dep.queOcurre.includes('87.5 %'), true);
eq('  y no se llama «buen precio»', dep.porQueImporta.includes('dependencia'), true);
eq('repartido, no se avisa',
    construirAlertas({ ...vacio, compras: [compra('A', 500), compra('B', 500)] }).find(a => a.id === 'dependencia-proveedor'), undefined);

console.log('\n— El resumen —');
const r = resumenDeAlertas(conTodo);
eq('cuenta por nivel', r.ahora >= 1, true);
eq('y suma solo lo que se puede valorar', typeof r.impacto, 'number');

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
