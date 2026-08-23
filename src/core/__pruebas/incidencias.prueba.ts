import {
    Incidencia, NotaOperativa, resumenDeIncidencias, tasaDeIncidencia, notasDe,
    fraseDeProveedor, enVentana, VENTANA_DIAS, REPETICIONES_PARA_PATRON, TIPOS_INCIDENCIA,
} from '../proveedores/incidencias';

let fallos = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error('  ✗ ' + m); fallos++; } };

console.log('incidencias y conocimiento operativo');

const HOY = new Date('2026-08-23T12:00:00Z');
const haceDias = (d: number) => new Date(HOY.getTime() - d * 24 * 60 * 60 * 1000);

let n = 0;
const inc = (p: Partial<Incidencia>): Incidencia => ({
    id: `i${++n}`, proveedorId: 'vinos', fecha: haceDias(10),
    tipo: 'retraso', gravedad: 'leve', ...p,
});

// --- la ventana
ok(enVentana(inc({ fecha: haceDias(89) }), HOY), 'dentro de la ventana cuenta');
ok(!enVentana(inc({ fecha: haceDias(91) }), HOY), 'fuera de la ventana no cuenta');

// --- el resumen
const lista: Incidencia[] = [
    inc({ fecha: haceDias(5), tipo: 'retraso', gravedad: 'seria' }),
    inc({ fecha: haceDias(20), tipo: 'retraso' }),
    inc({ fecha: haceDias(40), tipo: 'retraso', resueltaEl: haceDias(38) }),
    inc({ fecha: haceDias(30), tipo: 'precio' }),
    inc({ fecha: haceDias(200), tipo: 'retraso' }),          // vieja: no cuenta
    inc({ fecha: haceDias(5), proveedorId: 'frutas' }),        // de otro proveedor
];
const r = resumenDeIncidencias(lista, 'vinos', HOY);
ok(r.total === 4, `en la ventana y de este proveedor: 4, salió ${r.total}`);
ok(r.serias === 1, 'una seria');
ok(r.abiertas === 3, 'tres sin resolver — resolver no borra, marca');
ok(r.porTipo.retraso === 3 && r.porTipo.precio === 1, 'reparte por tipo');
ok(r.patrones.length === 1 && r.patrones[0] === 'retraso',
    `${REPETICIONES_PARA_PATRON} del mismo tipo son un patrón; una vez no`);
ok(!r.patrones.includes('precio' as any), 'un suceso suelto NO es un patrón');

// --- la trampa del denominador
ok(tasaDeIncidencia(lista, 'vinos', 40, HOY) === 0.1,
    '4 incidencias en 40 pedidos son 0,1 por pedido');
ok(tasaDeIncidencia(lista, 'frutas', 2, HOY) === 0.5,
    'el pequeño con 1 en 2 pedidos sale PEOR que el grande con 4 en 40');
ok(tasaDeIncidencia(lista, 'vinos', 0, HOY) === null,
    'sin pedidos no hay tasa: un cero inventado se leería como «perfecto»');

// --- la frase de cabecera
ok(fraseDeProveedor(resumenDeIncidencias([], 'nadie', HOY)) === '',
    'sin incidencias no se dice nada — «0 incidencias» ocupa sitio y no informa');
ok(fraseDeProveedor(r).includes('3 veces') && fraseDeProveedor(r).includes(String(VENTANA_DIAS)),
    'con patrón, la frase nombra el patrón');
const soloUna = resumenDeIncidencias([inc({ fecha: haceDias(3), tipo: 'estado' })], 'vinos', HOY);
ok(fraseDeProveedor(soloUna) === '1 incidencia, 1 sin resolver', `sin patrón cuenta y avisa de lo abierto, salió «${fraseDeProveedor(soloUna)}»`);

// --- todos los tipos tienen rótulo y motivo: un tipo sin explicar no se usa
for (const [t, d] of Object.entries(TIPOS_INCIDENCIA)) {
    ok(!!d.rotulo && !!d.porQueImporta, `${t} explica qué es y por qué importa`);
}

// --- notas operativas: conocimiento vigente, sin fecha de suceso
const notas: NotaOperativa[] = [
    { id: 'n1', proveedorId: 'vinos', texto: 'Llama antes de las 9', creadaEl: haceDias(30) },
    { id: 'n2', proveedorId: 'vinos', texto: 'Caja de 6, no de 12', creadaEl: haceDias(60), actualizadaEl: haceDias(2) },
    { id: 'n3', proveedorId: 'frutas', texto: 'No coge el teléfono los lunes', creadaEl: haceDias(1) },
];
const deVinos = notasDe(notas, { proveedorId: 'vinos' });
ok(deVinos.length === 2, 'las notas se filtran por a quién se refieren');
ok(deVinos[0].id === 'n2', 'ordena por la última vez que se tocó, no por cuándo se creó');
ok(notasDe(notas, {}).length === 0, 'sin referencia no se devuelve todo el conocimiento a ciegas');

console.log(fallos === 0 ? '  ✓ todo correcto' : `  ${fallos} fallo(s)`);
if (fallos > 0) process.exit(1);
