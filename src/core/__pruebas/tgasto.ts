import { gastoPorProveedor, gastoPorMes, concentracion, claveMes } from '../compras/gastoPorProveedor';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const c = (prov: string, total: number, dia: string, ing = 'i1', status = 'completed'): any => ({
    id: 'c' + Math.random(), ingredientId: ing, ingredientName: ing,
    providerId: prov, providerName: prov.toUpperCase(),
    unit: 'und', quantity: 1, unitPrice: total, totalCost: total,
    createdAt: new Date(dia), status,
});

console.log('\n— El mes —');
eq('se escribe ordenable', claveMes(new Date('2026-03-05')), '2026-03');

console.log('\n— Gasto por proveedor —');
const g = gastoPorProveedor([
    c('a', 100, '2026-01-10'), c('a', 50, '2026-02-10', 'i2'),
    c('b', 300, '2026-01-15', 'i3'),
]);
eq('el que más se lleva va primero', g.map(x => x.proveedorId), ['b', 'a']);
eq('con su total', [g[0].total, g[1].total], [300, 150]);
eq('cuenta las compras', g[1].compras, 2);
eq('y los productos distintos, que es dependencia y no solo dinero', g[1].productos, 2);
eq('con su primera y su última', [g[1].primera?.getMonth(), g[1].ultima?.getMonth()], [0, 1]);

console.log('\n— Mes a mes —');
eq('cada proveedor lleva su desglose', g[1].porMes.map(m => [m.mes, m.total]), [['2026-01', 100], ['2026-02', 50]]);
eq('y el conjunto se suma bien', gastoPorMes([c('a', 100, '2026-01-10'), c('b', 300, '2026-01-15')]),
    [{ mes: '2026-01', total: 400, compras: 2 }]);

console.log('\n— Lo que no se descarta —');
// Esconder el gasto sin proveedor haría que los totales NO cuadren con lo que
// se ha pagado de verdad, que es lo peor que puede hacer un informe de gasto.
const sinProv = gastoPorProveedor([c('', 80, '2026-01-10')]);
eq('el gasto sin proveedor cuenta igual', sinProv[0].total, 80);
eq('  bajo una clave que salta a la vista', sinProv[0].proveedorId, 'sin-proveedor');

console.log('\n— Lo que sí se descarta —');
eq('una compra cancelada no cuenta', gastoPorProveedor([c('a', 100, '2026-01-10', 'i1', 'cancelled')]).length, 0);
eq('importe 0 tampoco', gastoPorProveedor([c('a', 0, '2026-01-10')]).length, 0);
eq('sin compras no revienta', gastoPorProveedor([]), []);

console.log('\n— Sin total, se deriva del unitario —');
const derivado = gastoPorProveedor([{ id: 'x', ingredientId: 'i', ingredientName: 'i', providerId: 'a', providerName: 'A', unit: 'und', quantity: 3, unitPrice: 10, totalCost: 0, createdAt: new Date('2026-01-01'), status: 'completed' } as any]);
eq('3 × 10 = 30', derivado[0].total, 30);

console.log('\n— Concentración —');
// Un proveedor con el 70 % del gasto no es un buen precio: es una dependencia.
eq('qué parte se lleva cada uno', concentracion(g).map(x => x.pct), [66.7, 33.3]);
eq('sin gasto no se inventa un porcentaje', concentracion([]), []);

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
