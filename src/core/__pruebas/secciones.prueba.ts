import { seccionar, seccionesConResultados, totalDistinto, SIN_ASIGNAR } from '../agrupacion/secciones';

let fallos = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error('  ✗ ' + m); fallos++; } };

console.log('secciones plegables');

interface P { nombre: string; familia?: string; proveedores: string[]; }
const catalogo: P[] = [
    { nombre: 'ABSOLUT VODKA', familia: 'Alcohol base', proveedores: ['vinos', 'mayorista'] },
    { nombre: 'Limón', familia: 'Frutería', proveedores: ['frutas'] },
    { nombre: 'Angostura', familia: 'Bitters', proveedores: [] },
    { nombre: 'Ginebra Seca', familia: 'Alcohol base', proveedores: ['vinos'] },
    { nombre: 'Servilletas', proveedores: ['mayorista'] },
];

// --- por familia: cada ficha en UNA sección
const familias = seccionar(catalogo, { clavesDe: p => (p.familia ? [p.familia] : []) });
ok(familias.map(s => s.titulo).join('|') === 'Alcohol base|Bitters|Frutería|Sin asignar',
    'familias en orden alfabético, «Sin asignar» al final');
ok(familias.reduce((n, s) => n + s.items.length, 0) === catalogo.length,
    'por familia los contadores suman el total');
ok(familias[familias.length - 1].id === SIN_ASIGNAR && familias[familias.length - 1].esSinAsignar,
    'la sección de limpieza va marcada y la última');

// --- por proveedor: una ficha puede estar en VARIAS
const provs = seccionar(catalogo, { clavesDe: p => p.proveedores });
const vinos = provs.find(s => s.id === 'vinos')!;
const mayorista = provs.find(s => s.id === 'mayorista')!;
ok(vinos.items.length === 2 && mayorista.items.length === 2,
    'el catálogo de cada proveedor sale entero');
ok(vinos.items.includes(catalogo[0]) && mayorista.items.includes(catalogo[0]),
    'un producto que venden dos proveedores sale en las dos secciones');
ok(provs.find(s => s.esSinAsignar)!.items.length === 1,
    'lo que no vende nadie cae en «Sin asignar»');
ok(provs.reduce((n, s) => n + s.items.length, 0) > totalDistinto(catalogo),
    'la suma por proveedor supera el total — por eso se cuenta aparte');
ok(totalDistinto(catalogo) === 5, 'el total distinto sigue siendo el número de fichas');

// --- un proveedor repetido en la misma ficha (dos formatos suyos) no la duplica
const dosFormatos = seccionar([{ nombre: 'X', proveedores: ['vinos', 'vinos'] }],
    { clavesDe: (p: any) => p.proveedores });
ok(dosFormatos[0].items.length === 1, 'dos ofertas del mismo proveedor no duplican la fila');

// --- las secciones vacías no se pintan
ok(seccionar([], { clavesDe: () => [] }).length === 0,
    'sin ítems no hay secciones, ni siquiera «Sin asignar»');
ok(!seccionar([{ nombre: 'Y', familia: 'Bitters', proveedores: [] }],
    { clavesDe: (p: any) => [p.familia] }).some(s => s.esSinAsignar),
    'sin nada que limpiar, no se pinta «Sin asignar (0)»');

// --- plegar NO puede matar el buscador
const conLimon = seccionesConResultados(familias, p => p.nombre.toLowerCase().includes('limón'));
ok(conLimon.length === 1 && conLimon[0] === 'Frutería',
    'la búsqueda atraviesa las secciones y dice cuál abrir');
const conVodka = seccionesConResultados(provs, p => p.nombre.includes('ABSOLUT'));
ok(conVodka.length === 2, 'un resultado en dos secciones abre las dos');
ok(seccionesConResultados(familias, () => false).length === 0,
    'sin resultados no se abre nada');

// --- el título se puede traducir de id a nombre legible
const conNombre = seccionar(catalogo, {
    clavesDe: p => p.proveedores,
    tituloDe: id => ({ vinos: 'IN VINO VERITAS', frutas: 'Frutas SA', mayorista: 'Mayorista' }[id] || id),
    tituloSinAsignar: 'Sin proveedor asignado',
});
ok(conNombre[0].titulo === 'Frutas SA', 'ordena por el título legible, no por el id');
ok(conNombre[conNombre.length - 1].titulo === 'Sin proveedor asignado',
    'el rótulo de limpieza se puede adaptar a la pantalla');

console.log(fallos === 0 ? '  ✓ todo correcto' : `  ${fallos} fallo(s)`);
if (fallos > 0) process.exit(1);
