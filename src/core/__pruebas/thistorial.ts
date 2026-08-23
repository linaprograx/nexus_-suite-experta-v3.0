import { historialDeProducto, resumenDeHistorial } from '../historial/historialProducto';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const ings: any[] = [
    { id: 'M', nombre: 'MEZCAL' },
    { id: 'A', nombre: 'MEZCAL CAPON', masterProductId: 'M' },
    { id: 'Z', nombre: 'OTRO' },
];
const compra = (ing: string, q: number, total: number, dia: string, prov = 'ELOY', status = 'completed'): any => ({
    id: 'c' + Math.random(), ingredientId: ing, ingredientName: ing, providerId: 'p', providerName: prov,
    unit: 'und', quantity: q, unitPrice: total / q, totalCost: total, createdAt: new Date(dia), status,
});
const mov = (ing: string, q: number, dia: string, type = 'consumption'): any => ({
    id: 'm' + Math.random(), ingredientId: ing, quantity: q, type, date: new Date(dia), unit: 'und',
});

console.log('\n— La línea de tiempo —');
const h = historialDeProducto('M', ings, [compra('M', 2, 100, '2026-01-10')], [mov('M', 1, '2026-02-01')]);
eq('junta compras y salidas', h.length, 2);
// Al revés se leería como un archivo; así se lee como «qué ha pasado
// últimamente», que es la pregunta que trae a alguien aquí.
eq('lo más reciente primero', h.map(e => e.tipo), ['salida', 'compra']);
eq('la compra suma y la salida resta', h.map(e => e.cantidad), [-1, 2]);
eq('la compra dice a quién', h[1].texto, 'Compra a ELOY');
eq('y la salida, por qué', h[0].texto, 'Consumo');

console.log('\n— Un producto fusionado no pierde media historia —');
// Los históricos siguen apuntando al documento original —así la fusión es
// reversible—, o sea que la historia está repartida entre las fichas.
const fusionado = historialDeProducto('M', ings, [compra('M', 1, 50, '2026-01-01'), compra('A', 1, 60, '2026-03-01')], []);
eq('se recogen las dos fichas', fusionado.length, 2);
eq('  y se sabe de cuál vino cada evento', fusionado.map(e => e.fichaId), ['A', 'M']);
eq('preguntando por el ALIAS sale lo mismo',
    historialDeProducto('A', ings, [compra('M', 1, 50, '2026-01-01'), compra('A', 1, 60, '2026-03-01')], []).length, 2);

console.log('\n— Lo que no entra —');
eq('otro producto no se cuela', historialDeProducto('M', ings, [compra('Z', 1, 10, '2026-01-01')], []).length, 0);
eq('una compra cancelada tampoco', historialDeProducto('M', ings, [compra('M', 1, 10, '2026-01-01', 'X', 'cancelled')], []).length, 0);
eq('sin id no revienta', historialDeProducto('', ings, [], []), []);

console.log('\n— El resumen —');
const r = resumenDeHistorial(fusionado);
eq('cuenta y suma', [r.eventos, r.compras, r.gastado], [2, 2, 110]);
eq('sabe que el producto viene de dos fichas', r.fichas, 2);
eq('con su primera y su última', [r.primera?.getMonth(), r.ultima?.getMonth()], [0, 2]);
eq('sin eventos no inventa fechas', resumenDeHistorial([]).primera, undefined);

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
