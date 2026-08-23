import { computeRecipeDepletion } from '../../utils/recipeDepletion';

let fallos = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error('  ✗ ' + m); fallos++; } };

console.log('merma · el formato de la ficha manda sobre la etiqueta del stock');

const ficha = (o: any): any => ({
    id: o.id, nombre: o.nombre, categoria: 'Alcohol', costo: 0,
    unidad: o.unidad || 'UND', standardQuantity: o.std, standardUnit: o.stdU || 'ml',
    precioCompra: o.precio || 20,
});
const stock = (o: any): any => ({
    ingredientId: o.id, ingredientName: o.nombre, unit: o.unit,
    quantityAvailable: o.q, totalValue: 100, averageUnitCost: 10,
    lastPurchaseDate: new Date(), providerName: 'p', lastPurchaseQuantity: 1,
});
const receta = (lineas: any[]): any => ({
    id: 'r1', nombre: 'Coctel', ingredientes: lineas, pasos: [], categoria: 'x',
});

// EL CASO REAL: 137 productos así en el catálogo del fundador.
// Etiqueta `L`, envase de 700 ml. Una receta que usa 700 ml debe gastar
// EXACTAMENTE una botella, no 0,7.
const ings = [ficha({ id: 'i1', nombre: 'MEZCAL ZIGNUM SILVER', std: 700 })];
const stocks = [stock({ id: 'i1', nombre: 'MEZCAL ZIGNUM SILVER', unit: 'L', q: 10 })];
const lineas = computeRecipeDepletion(
    receta([{ ingredientId: 'i1', nombre: 'MEZCAL ZIGNUM SILVER', cantidad: 700, unidad: 'ml' }]),
    1, ings, stocks,
);

ok(lineas.length === 1, 'sale una línea de merma');
ok(lineas[0].resolved, 'y se resuelve, no se queda sin convertir');
ok(Math.abs(lineas[0].quantity - 1) < 0.001,
    `700 ml de un envase de 700 ml es 1 botella, salió ${lineas[0].quantity}`);
// Antes del arreglo salía 0,7: se descontaba como si la botella fuera de 1 L,
// o sea 1.000 ml donde había 700. Un 43 % de más, en silencio.
ok(Math.abs(lineas[0].quantity - 0.7) > 0.001,
    'y NO 0,7, que era leer la etiqueta «L» al pie de la letra');

// La etiqueta limpia sigue mandando cuando la ficha NO declara formato.
const sinFormato = computeRecipeDepletion(
    receta([{ ingredientId: 'i2', nombre: 'GRANEL', cantidad: 500, unidad: 'ml' }]),
    1,
    [ficha({ id: 'i2', nombre: 'GRANEL', std: 0, unidad: 'L' })],
    [stock({ id: 'i2', nombre: 'GRANEL', unit: 'L', q: 10 })],
);
ok(sinFormato[0]?.resolved && Math.abs(sinFormato[0].quantity - 0.5) < 0.001,
    `sin formato en la ficha, «L» se lee literal: 500 ml son 0,5 L, salió ${sinFormato[0]?.quantity}`);

// Un envase de 1 L etiquetado `L` no cambia de comportamiento: 1000 = 1000.
const litroReal = computeRecipeDepletion(
    receta([{ ingredientId: 'i3', nombre: 'ZUMO', cantidad: 250, unidad: 'ml' }]),
    1,
    [ficha({ id: 'i3', nombre: 'ZUMO', std: 1000 })],
    [stock({ id: 'i3', nombre: 'ZUMO', unit: 'L', q: 5 })],
);
ok(Math.abs(litroReal[0].quantity - 0.25) < 0.001,
    `con envase de 1 L nada cambia, salió ${litroReal[0]?.quantity}`);

console.log(fallos === 0 ? '  ✓ todo correcto' : `  ${fallos} fallo(s)`);
if (fallos > 0) process.exit(1);
