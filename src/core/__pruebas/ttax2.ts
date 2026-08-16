import { interpretarCategoria, quitarRepeticion, informeDeTaxonomia, claveDeTaxonomia } from '../taxonomia/taxonomia';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};
const i=(s:string)=>interpretarCategoria(s);

console.log('\n— El sufijo FRESCOS —');
eq('«ALGAS FRESCOS» → FRESCOS ▸ ALGAS', [i('ALGAS FRESCOS').familia, i('ALGAS FRESCOS').subfamilia], ['FRESCOS','ALGAS']);
eq('la subfamilia larga se conserva entera', i('PATATAS, RAICES Y TUBERCULOS FRESCOS').subfamilia, 'PATATAS RAICES Y TUBERCULOS');
eq('«FRESCOS» a secas es la familia sin subfamilia', [i('FRESCOS').familia, i('FRESCOS').subfamilia], ['FRESCOS','']);
eq('lleva sus etiquetas', i('ALGAS FRESCOS').etiquetas, ['frío','perecedero']);

console.log('\n— El prefijo ESPECIALES —');
eq('«ESPECIALES MINIS» → ESPECIALES ▸ MINIS', [i('ESPECIALES MINIS').familia, i('ESPECIALES MINIS').subfamilia], ['ESPECIALES','MINIS']);

console.log('\n— Destilados y fermentados —');
eq('«MEZCAL» → DESTILADOS ▸ MEZCAL', [i('MEZCAL').familia, i('MEZCAL').subfamilia], ['DESTILADOS','MEZCAL']);
eq('«DESTILADOS» es la familia sin subfamilia, y lo dice', [i('DESTILADOS').subfamilia, i('DESTILADOS').confianza], ['','media']);
eq('«CERVEZA» no es destilado', [i('CERVEZA').familia, i('CERVEZA').etiquetas], ['CON ALCOHOL',['con alcohol']]);
eq('un destilado va marcado como seco y con alcohol', i('RON').etiquetas, ['con alcohol','seco']);

console.log('\n— Lo que estaba escrito de dos formas —');
eq('LICOR y LICORES caen en la misma casilla', claveDeTaxonomia(i('LICOR'))===claveDeTaxonomia(i('LICORES')), true);
eq('SIROPE y SIROPES también', claveDeTaxonomia(i('SIROPE'))===claveDeTaxonomia(i('SIROPES')), true);
eq('PURE y PURÉ: la tilde no hace otra categoría', claveDeTaxonomia(i('PURE'))===claveDeTaxonomia(i('PURÉ')), true);
eq('FRUTAS CITRICOS y FRUTAS Y CÍTRICOS', claveDeTaxonomia(i('FRUTAS CITRICOS'))===claveDeTaxonomia(i('FRUTAS Y CÍTRICOS')), true);
eq('la repetición literal se deshace', quitarRepeticion('FRUTOS SECOS FRUTOS SECOS'), 'FRUTOS SECOS');
eq('...pero no parte lo que no es repetición', quitarRepeticion('HIERBAS AROMATICAS'), 'HIERBAS AROMATICAS');

console.log('\n— Lo que NO se toca —');
eq('«MEZCAL» y «TEQUILA» NO se juntan', claveDeTaxonomia(i('MEZCAL'))===claveDeTaxonomia(i('TEQUILA')), false);
eq('«ALGAS FRESCOS» y «BULBOS FRESCOS» tampoco', claveDeTaxonomia(i('ALGAS FRESCOS'))===claveDeTaxonomia(i('BULBOS FRESCOS')), false);
eq('un estado no se convierte en familia', i('POR REVISAR').familia, '');
eq('  y se explica por qué', i('POR REVISAR').confianza, 'ninguna');
eq('lo desconocido se conserva tal cual, sin inventar familia', [i('TEXTURIZANTES').familia, i('TEXTURIZANTES').confianza], ['TEXTURIZANTES','media']);
eq('el original nunca se pierde', i('  FrUtAs   FrEsCoS ').original, 'FrUtAs   FrEsCoS');

console.log('\n— El informe —');
const inf = informeDeTaxonomia([{categoria:'LICOR'},{categoria:'LICORES'},{categoria:'MEZCAL'},{categoria:'POR REVISAR'}]);
eq('cuenta las categorías crudas', inf.totalCategorias, 4);
eq('y las casillas resultantes', inf.grupos.length, 2);
eq('lo no clasificable va aparte', inf.sinClasificar.length, 1);
eq('las fichas se suman en su casilla', inf.grupos.find(g=>g.subfamilia==='LICOR')?.fichas, 2);
eq('sin fichas no revienta', informeDeTaxonomia([]).grupos.length, 0);

console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
