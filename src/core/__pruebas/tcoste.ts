import { calculateRecipeCost } from '../costing/costCalculator';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};

const ing=(id:string,nombre:string,precio:number,extra:any={})=>({
  id, nombre, categoria:'X', unidad:'L', unidadCompra:'L', cantidad:1, precioCompra:precio, ...extra,
} as any);
const receta=(ingredientId:string)=>({ id:'r', nombre:'R', ingredientes:[{ ingredientId, nombre:'da igual', cantidad:100, unidad:'ml' }] } as any);
const coste=(r:any,ings:any[])=>+calculateRecipeCost(r, ings).costoTotal.toFixed(4);

const maestro=ing('M','PRODUCTO',10);            // 10 €/L
const alias  =ing('A','PRODUCTO CAPON',20,{ masterProductId:'M' }); // 20 €/L
const suelto20=ing('S20','SUELTO',20);           // control, sin fusionar

// La referencia: lo que cuesta 100 ml del maestro, con la merma que aplique el motor.
const REF = coste(receta('M'), [maestro, alias]);
// Y el control: lo que costaría si NO se resolviera el maestro (precio del alias).
const SIN_RESOLVER = coste(receta('S20'), [suelto20]);

console.log(`  ref: maestro a 10 €/L → ${REF} · sin resolver (20 €/L) → ${SIN_RESOLVER}\n`);
eq('el control es distinto: si no resolviera, se notaría', REF !== SIN_RESOLVER, true);
eq('una receta que apunta al ALIAS cuesta lo del MAESTRO', coste(receta('A'), [maestro, alias]), REF);
eq('  ...y NO lo del alias', coste(receta('A'), [maestro, alias]) !== SIN_RESOLVER, true);
eq('sin alias en el catálogo, el precio del propio documento manda', coste(receta('S20'), [suelto20]), SIN_RESOLVER);
eq('id inexistente sigue cayendo al nombre',
   coste({ id:'r', nombre:'R', ingredientes:[{ ingredientId:'NO-EXISTE', nombre:'PRODUCTO', cantidad:100, unidad:'ml' }] } as any, [maestro]), REF);

const alias2=ing('A2','OTRO',99,{ masterProductId:'A' });
eq('cadena alias → alias → maestro', coste(receta('A2'), [maestro, alias, alias2]), REF);

const c1=ing('C1','C1',10,{ masterProductId:'C2' });
const c2=ing('C2','C2',10,{ masterProductId:'C1' });
eq('un ciclo no cuelga ni deja la línea a cero', coste(receta('C1'), [c1,c2]) > 0, true);

// Lo que de verdad se prometió: el precio del producto sigue al maestro.
const maestroCaro=ing('M','PRODUCTO',30);
eq('subir el precio en el MAESTRO mueve la receta que apunta al alias',
   coste(receta('A'), [maestroCaro, alias]) > REF, true);

console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
