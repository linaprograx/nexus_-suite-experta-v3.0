import { seriesDePrecio, mayoresMovimientos, resumenDeSeries } from '../precios/historicoPrecios';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};
const c=(id:string,p:number,d:string)=>({ id:'c'+Math.random(), ingredientId:id, ingredientName:id, providerId:'P', providerName:'P', unit:'und', quantity:1, unitPrice:p, totalCost:p, createdAt:new Date(d), status:'completed' } as any);

// El caso real: muchos estables tapando a la única bajada.
const compras:any[]=[];
for (let i=0;i<125;i++) compras.push(c('E'+i,10,'2026-01-01'), c('E'+i,10,'2026-08-01'));
compras.push(c('BAJA',10,'2026-01-01'), c('BAJA',5,'2026-08-01'));

const s=seriesDePrecio(compras);
const m=mayoresMovimientos(s,{limite:30});
eq('los estables NO ocupan el ranking', m.length, 1);
eq('y la bajada aparece', m[0].productoId, 'BAJA');
const r=resumenDeSeries(s);
eq('la cabecera cuenta lo mismo que la lista', [r.subidas,r.bajadas], [0,1]);
eq('los estables se cuentan aparte', r.estables, 125);
console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
