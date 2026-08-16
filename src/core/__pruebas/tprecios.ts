import { seriesDePrecio, explicarSerie, mayoresMovimientos, diferenciasEntreProveedores } from '../precios/historicoPrecios';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};

const c=(ingredientId:string, unitPrice:number, dia:string, prov='P1', unit='Botella', q=1, status='completed')=>({
  id:'c'+Math.random(), ingredientId, ingredientName:ingredientId, providerId:prov, providerName:prov,
  unit, quantity:q, unitPrice, totalCost:unitPrice*q, createdAt:new Date(dia), status,
} as any);

console.log('\n— La serie —');
let s = seriesDePrecio([c('A',10,'2026-03-01'), c('A',12,'2026-05-01'), c('A',12.4,'2026-08-01')]).get('A')!;
eq('ordena por fecha', s.observaciones.map(o=>o.precio), [10,12,12.4]);
eq('la vigente es la última', s.vigente?.precio, 12.4);
eq('la variación va de la primera a la vigente', s.variacionPct, 24);
eq('mínimo y máximo', [s.minimo?.precio, s.maximo?.precio], [10,12.4]);

console.log('\n— Lo que NO se calcula, y se dice —');
s = seriesDePrecio([c('B',10,'2026-03-01')]).get('B')!;
eq('una sola compra no da variación', s.variacionPct, undefined);
eq('  y explica por qué', s.motivoSinVariacion, 'una-sola');
eq('  con una frase entendible', explicarSerie(s).includes('no hay con qué compararla'), true);

s = seriesDePrecio([c('C',89.5,'2026-03-01','P1','Botella'), c('C',3.2,'2026-05-01','P1','Kg')]).get('C')!;
eq('unidades mezcladas NO dan una bajada del 96%', s.variacionPct, undefined);
eq('  y se dice el motivo', s.motivoSinVariacion, 'unidades-mezcladas');
eq('  ni mínimo ni máximo entre unidades distintas', [s.minimo, s.maximo], [undefined, undefined]);

console.log('\n— Los datos que no valen —');
eq('una compra cancelada no cuenta', seriesDePrecio([c('D',10,'2026-03-01','P1','Botella',1,'cancelled')]).size, 0);
eq('precio 0 no cuenta', seriesDePrecio([c('E',0,'2026-03-01')]).size, 0);
const sinUnit = seriesDePrecio([{ id:'x', ingredientId:'F', ingredientName:'F', providerId:'P', providerName:'P', unit:'Botella', quantity:2, unitPrice:0, totalCost:30, createdAt:new Date('2026-03-01'), status:'completed' } as any]).get('F')!;
eq('sin precio unitario se deriva del total', sinUnit.vigente?.precio, 15);

console.log('\n— El maestro —');
const ings:any[]=[{id:'M',nombre:'M'},{id:'AL',nombre:'AL',masterProductId:'M'}];
const conMaestro = seriesDePrecio([c('M',10,'2026-03-01','P1'), c('AL',20,'2026-05-01','P2')], ings);
eq('las compras de las dos fichas son UNA serie del producto', conMaestro.size, 1);
eq('  y están las dos', conMaestro.get('M')?.observaciones.length, 2);

console.log('\n— Diferencias entre proveedores —');
const dif = diferenciasEntreProveedores(seriesDePrecio([
  c('G',89.5,'2026-05-01','CARO'), c('G',68.5,'2026-05-02','BARATO'),
]));
eq('detecta la diferencia', dif.length, 1);
eq('  y la cuantifica', dif[0].diferenciaPct, 30.7);
eq('un solo proveedor no es una diferencia', diferenciasEntreProveedores(seriesDePrecio([c('H',10,'2026-03-01'), c('H',12,'2026-05-01')])).length, 0);
eq('compara el ÚLTIMO de cada proveedor, no el más viejo',
   diferenciasEntreProveedores(seriesDePrecio([c('I',100,'2026-01-01','P1'), c('I',50,'2026-08-01','P1'), c('I',60,'2026-08-01','P2')]))[0]?.barato.precio, 50);
eq('unidades mezcladas no producen diferencias falsas',
   diferenciasEntreProveedores(seriesDePrecio([c('J',89,'2026-05-01','P1','Botella'), c('J',3,'2026-05-01','P2','Kg')])).length, 0);

console.log('\n— El ranking —');
const m = mayoresMovimientos(seriesDePrecio([
  c('K',10,'2026-01-01'), c('K',20,'2026-08-01'),
  c('L',10,'2026-01-01'), c('L',5,'2026-08-01'),
  c('M2',10,'2026-01-01'),
]));
eq('la mayor subida va primero', m[0].productoId, 'K');
eq('la bajada va al final', m[m.length-1].productoId, 'L');
eq('una sola compra queda fuera', m.find(x=>x.productoId==='M2'), undefined);

console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
