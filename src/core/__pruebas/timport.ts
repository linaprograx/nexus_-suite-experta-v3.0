import { leerCatalogo, leerNumero, deducirSeparador, partirLinea } from '../importacion/leerCatalogo';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};

console.log('\n— Números —');
eq('europeo con millares', leerNumero('1.234,56'), 1234.56);
eq('inglés con millares', leerNumero('1,234.56'), 1234.56);
eq('coma decimal', leerNumero('3,20'), 3.2);
eq('coma de millares (3 cifras detrás)', leerNumero('1,234'), 1234);
eq('con símbolo', leerNumero('89,50 €'), 89.5);
eq('vacío', leerNumero(''), undefined);
eq('texto', leerNumero('n/d'), undefined);

console.log('\n— Separador y comillas —');
eq('punto y coma', deducirSeparador('nombre;precio;unidad'), ';');
eq('coma', deducirSeparador('nombre,precio,unidad'), ',');
eq('una coma dentro de comillas no parte el campo', partirLinea('"PATATAS, RAICES";3,20', ';'), ['PATATAS, RAICES','3,20']);
eq('comilla literal', partirLinea('"RON ""ESPECIAL""";10', ';'), ['RON "ESPECIAL"','10']);

console.log('\n— Emparejado —');
const catalogo:any[]=[
  { id:'i1', nombre:'ABSOLUT VODKA', precioCompra:9.99 },
  { id:'i2', nombre:'ABSOLUT MANDARINA', precioCompra:11.00 },
  { id:'i3', nombre:'RON BLANCO', precioCompra:12.00 },
  { id:'ali', nombre:'ABSOLUT VODKA 70', masterProductId:'i1' },
];
const csv = [
  'Producto;Precio;Formato',
  'VODKA ABSOLUT;10,99;0,70 L',      // mismo conjunto de palabras, orden distinto → casa
  'ABSOLUT MANDARINA;11,00;0,70 L',  // igual
  'RON BLANCO;9,50;1 L',             // baja
  'GINEBRA NUEVA;15,00;0,70 L',      // nueva
  ';5,00;',                          // sin nombre → inválida
  'PRODUCTO RARO;-3;',               // precio negativo → inválida
].join('\n');
const r = leerCatalogo(csv, catalogo);
eq('lee todas las filas de datos', r.resumen.total, 6);
eq('«VODKA ABSOLUT» casa con «ABSOLUT VODKA»', r.lineas[0].ingredienteNombre, 'ABSOLUT VODKA');
eq('  y detecta la subida', [r.lineas[0].estado, r.lineas[0].variacionPct], ['sube', 10]);
eq('mismo precio → igual', r.lineas[1].estado, 'igual');
eq('bajada', [r.lineas[2].estado, r.lineas[2].variacionPct], ['baja', -20.8]);
eq('lo que no casa exacto entra como NUEVO', r.lineas[3].estado, 'nuevo');
eq('sin nombre → inválida', r.lineas[4].estado, 'invalida');
eq('precio negativo → inválida', r.lineas[5].estado, 'invalida');
eq('lee el formato con packNormalization, en su forma canónica', [r.lineas[0].formatoQty, r.lineas[0].formatoUnidad], [0.7,'l']);
eq('resumen', [r.resumen.nuevas, r.resumen.suben, r.resumen.bajan, r.resumen.iguales, r.resumen.invalidas], [1,1,1,1,2]);

console.log('\n— Lo que NO debe pasar —');
eq('ABSOLUT VODKA y ABSOLUT MANDARINA no se confunden',
   leerCatalogo('Producto;Precio\nABSOLUT MANDARINA;20', catalogo).lineas[0].ingredienteNombre, 'ABSOLUT MANDARINA');
// El fichero trae el nombre del ALIAS. Debe casar con el MAESTRO —no con el
// alias, y no como producto nuevo—: si no, cada importación crearía un duplicado
// del producto que ya se fusionó a mano.
const conAlias = leerCatalogo('Producto;Precio\nABSOLUT VODKA 70;20', catalogo).lineas[0];
eq('el nombre de un alias casa con su MAESTRO', conAlias.ingredienteNombre, 'ABSOLUT VODKA');
eq('  y no crea un producto nuevo', conAlias.estado !== 'nuevo', true);
eq('sin columna de nombre se avisa', leerCatalogo('otra;cosa\n1;2', catalogo).avisos.some(a=>/nombre/.test(a)), true);
eq('sin columna de precio se avisa', leerCatalogo('Producto\nX', catalogo).avisos.some(a=>/precio/.test(a)), true);
eq('fichero vacío no revienta', leerCatalogo('', catalogo).resumen.total, 0);
eq('el mapeo de columnas se puede enseñar', leerCatalogo('Producto;Precio;Formato\nX;1;', catalogo).columnas,
   { Producto:'nombre', Precio:'precio', Formato:'unidad' });
eq('una columna desconocida se marca, no se adivina',
   leerCatalogo('Producto;Precio;Almacen\nX;1;A', catalogo).columnas['Almacen'], '—');

console.log('\n— Cada estado lleva su motivo —');
eq('ninguna línea sin explicación', r.lineas.every(l=>l.motivo.length>0), true);

console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
