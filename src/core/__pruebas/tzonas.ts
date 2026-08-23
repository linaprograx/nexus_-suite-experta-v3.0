import { zonaDe, zonasDelCatalogo, stockPorZona, progresoDeZona, normalizarZona, SIN_ZONA } from '../stock/zonas';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const ings: any[] = [
    { id: 'a', nombre: 'RON', zona: 'Barra' },
    { id: 'b', nombre: 'LIMA', zona: '  cámara  ' },
    { id: 'c', nombre: 'AZUCAR' },
    { id: 'M', nombre: 'MEZCAL' },
    { id: 'A', nombre: 'MEZCAL CAPON', masterProductId: 'M', zona: 'Bodega' },
];
const item = (id: string, valor = 10): any => ({ ingredientId: id, ingredientName: id, quantityAvailable: 1, unit: 'und', averageUnitCost: valor, totalValue: valor, lastPurchaseDate: '2026-01-01' });

console.log('\n— Normalizar —');
eq('se limpian espacios', normalizarZona('  Barra  '), 'Barra');
eq('vacío es «Sin zona», no cadena vacía', normalizarZona(''), SIN_ZONA);

console.log('\n— La zona de un producto —');
eq('la suya', zonaDe('a', ings), 'Barra');
eq('sin asignar no es un error, es «Sin zona»', zonaDe('c', ings), SIN_ZONA);
// Preguntar por el alias tiene que dar lo mismo que por el maestro, o el mismo
// bote aparecería en dos zonas según por dónde se mire.
eq('el maestro hereda la zona anotada en su alias', zonaDe('M', ings), 'Bodega');
eq('  y el alias dice lo mismo', zonaDe('A', ings), 'Bodega');

console.log('\n— Las zonas del catálogo —');
// «Sin zona» al final: es la lista de lo que queda por colocar, no una zona más.
eq('ordenadas y con «Sin zona» al final', zonasDelCatalogo(ings), ['Barra', 'Bodega', 'cámara', SIN_ZONA]);

console.log('\n— El stock por zona —');
const z = stockPorZona([item('a', 10), item('b', 5), item('c', 7)], ings);
eq('cada uno en la suya', z.map(x => x.zona), ['Barra', 'cámara', SIN_ZONA]);
eq('con el capital que vive ahí', z.map(x => x.valor), [10, 5, 7]);
// Una zona vacía en una lista de conteo es una casilla que se abre, se mira y
// se cierra.
eq('las zonas sin nada no aparecen', stockPorZona([item('a')], ings).map(x => x.zona), ['Barra']);
eq('sin stock no revienta', stockPorZona([], ings), []);

console.log('\n— El progreso —');
eq('cuenta lo hecho y lo que falta',
    progresoDeZona([item('a'), item('b')], { a: '3' }), { total: 2, hechos: 1, pendientes: 1 });
eq('una casilla vacía no cuenta como contada',
    progresoDeZona([item('a')], { a: '' }), { total: 1, hechos: 0, pendientes: 1 });
eq('un cero SÍ cuenta: decir «no queda nada» es contar',
    progresoDeZona([item('a')], { a: '0' }), { total: 1, hechos: 1, pendientes: 0 });

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
