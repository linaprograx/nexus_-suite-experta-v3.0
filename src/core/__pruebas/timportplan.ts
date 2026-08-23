import { leerCatalogo } from '../importacion/leerCatalogo';
import { planificarImportacion, resumirPlan, avisoDeTamano, LIMITES_IMPORTACION } from '../importacion/planDeImportacion';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const catalogo: any[] = [
    { id: 'v1', nombre: 'ABSOLUT VODKA', unidad: 'L', unidadCompra: 'L', cantidad: 1, precioCompra: 11, standardUnit: 'ml', standardQuantity: 1000 },
];
const csv = [
    'Producto;Precio;Formato;Categoria',
    'ABSOLUT VODKA;10,45;0,700 L;DESTILADOS',
    'GINEBRA NUEVA;27,50;0,700 L;GINEBRA',
    ';4,50;KG;VERDURAS',
    'PRECIO MALO;-2;KG;VERDURAS',
].join('\n');
const lect = leerCatalogo(csv, catalogo);
const todas = new Set(lect.lineas.map(l => l.fila));

console.log('\n— El plan —');
const plan = planificarImportacion(lect.lineas, 'prov1', todas);
eq('la ficha que existe recibe una OFERTA, no un precio nuevo', plan.ofertas.length, 1);
eq('  con la clave proveedor::formato', plan.ofertas[0].clave, 'prov1::700ml');
eq('  y el precio del proveedor', plan.ofertas[0].price, 10.45);
eq('lo que no existe nace como producto', plan.nuevas.map(n => n.nombre), ['GINEBRA NUEVA']);
eq('  con su categoría del fichero', plan.nuevas[0].categoria, 'GINEBRA');
eq('  y su formato en unidades base', [plan.nuevas[0].standardQuantity, plan.nuevas[0].standardUnit], [700, 'ml']);
eq('las líneas malas se descartan con motivo', plan.descartadas.length, 2);
eq('  y se dice cuál era cada una', plan.descartadas.every(d => d.motivo.length > 10), true);

console.log('\n— Nada se importa sin marcarlo —');
// «Importar todo» por defecto es lo que convierte un error de fichero en un
// desastre de catálogo.
const nada = planificarImportacion(lect.lineas, 'prov1', new Set());
eq('sin selección no se escribe nada', [nada.ofertas.length, nada.nuevas.length], [0, 0]);
eq('  y se dice', resumirPlan(nada), 'Nada seleccionado.');

console.log('\n— Selección parcial —');
const soloUna = planificarImportacion(lect.lineas, 'prov1', new Set([3]));
eq('solo entra lo marcado', [soloUna.ofertas.length, soloUna.nuevas.length], [0, 1]);
eq('  y es la que se marcó', soloUna.nuevas[0].nombre, 'GINEBRA NUEVA');

console.log('\n— El resumen para confirmar —');
eq('dice qué va a pasar', resumirPlan(plan),
    '1 oferta(s) sobre fichas que ya tienes · 1 producto(s) nuevo(s) · 2 línea(s) descartada(s)');


console.log('\n— Los límites, dichos antes de importar —');
eq('un fichero normal no avisa de nada', avisoDeTamano(53), null);
eq('uno grande avisa de que tardará', /lotes y tardará/.test(String(avisoDeTamano(5000))), true);
// Este es el límite que de verdad se toca: cada línea importada es una escritura.
eq('  y uno enorme avisa del tope diario de Firebase',
    /escrituras diarias del plan gratuito/.test(String(avisoDeTamano(25000))), true);
eq('el troceo va por debajo del tope duro de Firestore',
    LIMITES_IMPORTACION.operacionesPorLote <= 500, true);

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
