import { buildCurrentStock } from '../../utils/stockUtils';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};

const compra=(ingredientId:string,q:number,coste:number)=>({
  id:'p'+Math.random(), ingredientId, ingredientName:ingredientId, quantity:q, unit:'und',
  unitCost:coste, totalCost:q*coste, date:'2026-08-01', providerName:'X',
} as any);
const mov=(ingredientId:string,q:number)=>({ id:'m'+Math.random(), ingredientId, quantity:q, type:'consumption', date:'2026-08-02' } as any);

const resolver=(mapa:Record<string,string>)=>(id:string)=>mapa[id]||id;
const alias={ ALIAS:'MAESTRO' };

// El caso que se perdía: compras sobre el ALIAS, consumo anotado sobre el MAESTRO.
const s1=buildCurrentStock([compra('ALIAS',10,2)], [mov('MAESTRO',4)], resolver(alias));
eq('consumo sobre el maestro con compras del alias SÍ resta', s1.find(x=>x.ingredientId==='MAESTRO')?.quantityAvailable, 6);

// El simétrico, que ya funcionaba: todo sobre el alias.
const s2=buildCurrentStock([compra('ALIAS',10,2)], [mov('ALIAS',4)], resolver(alias));
eq('consumo sobre el alias sigue restando', s2.find(x=>x.ingredientId==='MAESTRO')?.quantityAvailable, 6);

// Compras repartidas entre las dos fichas.
const s3=buildCurrentStock([compra('ALIAS',10,2), compra('MAESTRO',5,2)], [mov('ALIAS',3)], resolver(alias));
eq('compras repartidas se suman y el consumo resta una vez', s3.find(x=>x.ingredientId==='MAESTRO')?.quantityAvailable, 12);
eq('y una sola fila para el producto', s3.length, 1);

// Sin resolver: idéntico a antes de que existiera la identidad maestra.
const s4=buildCurrentStock([compra('A',10,2)], [mov('A',4)]);
eq('sin resolver, comportamiento de siempre', s4[0]?.quantityAvailable, 6);

// Un consumo sobre un id que no compró nada no inventa una fila negativa.
const s5=buildCurrentStock([compra('X',10,2)], [mov('FANTASMA',4)], resolver({}));
eq('un movimiento huérfano no crea filas', s5.length, 1);
eq('  ni descuadra el que sí existe', s5[0]?.quantityAvailable, 10);

// Nunca por debajo de cero.
const s6=buildCurrentStock([compra('ALIAS',3,2)], [mov('MAESTRO',99)], resolver(alias));
eq('no baja de cero', s6.find(x=>x.ingredientId==='MAESTRO')?.quantityAvailable, 0);

console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
