import { nivelDeStock, huecoHastaElMaximo, maximoValido } from '../stock/nivelDeStock';
import { sugerirCantidad } from '../orders/cantidadSugerida';

let fallos = 0;
const eq = (titulo: string, real: any, esperado: any) => {
    const ok = JSON.stringify(real) === JSON.stringify(esperado);
    if (!ok) fallos++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${titulo}${ok ? '' : `\n         esperado ${JSON.stringify(esperado)}\n         real     ${JSON.stringify(real)}`}`);
};

console.log('\n— El nivel —');
eq('sin regla y con stock → desconocido, no se inventa umbral', nivelDeStock(undefined, 5).nivel, 'desconocido');
eq('las 611 reglas de hoy (sin maxStock) siguen igual: por encima del mínimo → ok', nivelDeStock({ minStock: 2 }, 5).nivel, 'ok');
eq('las 611 reglas de hoy: por debajo del mínimo → bajo', nivelDeStock({ minStock: 2 }, 1).nivel, 'bajo');
eq('sin regla y sin stock → rotura (no necesita regla)', nivelDeStock(undefined, 0).nivel, 'rotura');
eq('con techo y por encima → sobrestock', nivelDeStock({ minStock: 2, maxStock: 8 }, 11).nivel, 'sobrestock');
eq('cuánto sobra', nivelDeStock({ minStock: 2, maxStock: 8 }, 11).exceso, 3);
eq('justo en el techo NO es sobrestock', nivelDeStock({ minStock: 2, maxStock: 8 }, 8).nivel, 'ok');
eq('regla desactivada no opina', nivelDeStock({ minStock: 2, maxStock: 8, active: false }, 99).nivel, 'desconocido');
eq('máximo por debajo del mínimo no se aplica a medias', nivelDeStock({ minStock: 8, maxStock: 3 }, 5).nivel, 'desconocido');
eq('bajo manda sobre sobrado si la regla se contradice al revés', nivelDeStock({ minStock: 2, maxStock: 8 }, 1).nivel, 'bajo');

console.log('\n— El hueco —');
eq('sin techo declarado → undefined, que NO es cero', huecoHastaElMaximo({ minStock: 2 }, 5), undefined);
eq('con techo 8 y stock 5 → caben 3', huecoHastaElMaximo({ maxStock: 8 }, 5), 3);
eq('ya por encima del techo → 0', huecoHastaElMaximo({ maxStock: 8 }, 11), 0);

console.log('\n— La cantidad del pedido —');
eq('sin regla: 1 por defecto, como siempre', sugerirCantidad(undefined, 0).cantidad, 1);
eq('la regla manda: pide 6', sugerirCantidad({ reorderQuantity: 6 }, 0).cantidad, 6);
eq('techo 8, stock 5, la regla pide 6 → recorta a 3', sugerirCantidad({ reorderQuantity: 6, maxStock: 8 }, 5).cantidad, 3);
eq('  y lo explica', sugerirCantidad({ reorderQuantity: 6, maxStock: 8 }, 5).motivo, 'hasta-el-maximo');
eq('cabe entero: no toca nada', sugerirCantidad({ reorderQuantity: 2, maxStock: 8 }, 5).cantidad, 2);
eq('ya en el techo: propone 1, NO cero — no veta la compra', sugerirCantidad({ reorderQuantity: 6, maxStock: 8 }, 8).cantidad, 1);
eq('  y dice por qué', sugerirCantidad({ reorderQuantity: 6, maxStock: 8 }, 8).motivo, 'ya-en-el-maximo');
eq('hueco fraccionario 2,5 → 2, nunca 2,5 botellas', sugerirCantidad({ reorderQuantity: 6, maxStock: 7.5 }, 5).cantidad, 2);
eq('regla desactivada: el techo tampoco recorta', sugerirCantidad({ reorderQuantity: 6, maxStock: 8, active: false }, 5).cantidad, 1);
eq('techo contradictorio no recorta', sugerirCantidad({ reorderQuantity: 6, minStock: 9, maxStock: 3 }, 0).cantidad, 6);

console.log('\n— La validación al escribir —');
eq('sin techo siempre vale', maximoValido(3, undefined), true);
eq('techo por encima del mínimo vale', maximoValido(3, 8), true);
eq('techo por debajo del mínimo NO vale', maximoValido(8, 3), false);
eq('techo igual al mínimo NO vale', maximoValido(3, 3), false);

console.log(fallos ? `\n${fallos} FALLOS\n` : '\nTodo correcto\n');
process.exit(fallos ? 1 : 0);
