import { reglasPorMaestro, maestroDeRegla } from '../stock/reglasPorProducto';
let f=0;
const eq=(t:string,r:any,e:any)=>{const ok=JSON.stringify(r)===JSON.stringify(e); if(!ok)f++; console.log(`${ok?'  ok  ':' FALLA'} ${t}${ok?'':`  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);};

const ings:any[]=[
  {id:'MAESTRO', nombre:'AGUERRIDO BENIGNO'},
  {id:'ALIAS',   nombre:'AGUERRIDO BENIGNO CAPON', masterProductId:'MAESTRO'},
  {id:'SOLA',    nombre:'RON'},
];
const reglaAlias:any={id:'r1', ingredientId:'ALIAS', minStock:1, reorderQuantity:1, active:true};
const reglaSola:any ={id:'r2', ingredientId:'SOLA',  minStock:2, reorderQuantity:1, active:true};

eq('la regla del alias se indexa bajo el MAESTRO', [...reglasPorMaestro([reglaAlias], ings).keys()], ['MAESTRO']);
eq('una ficha sin alias no cambia', [...reglasPorMaestro([reglaSola], ings).keys()], ['SOLA']);
eq('maestroDeRegla resuelve la cadena', maestroDeRegla(reglaAlias, ings), 'MAESTRO');
eq('sin alias en el catálogo, todo igual que antes',
   [...reglasPorMaestro([reglaAlias, reglaSola], [{id:'ALIAS',nombre:'x'} as any,{id:'SOLA',nombre:'y'} as any]).keys()],
   ['ALIAS','SOLA']);
// Dos alias del mismo maestro con regla: gana la primera, no se inventa una mezcla.
const ings2:any[]=[...ings,{id:'ALIAS2',nombre:'otro',masterProductId:'MAESTRO'}];
const r3:any={id:'r3',ingredientId:'ALIAS2',minStock:9,reorderQuantity:1,active:true};
eq('dos reglas para un maestro: gana la primera', reglasPorMaestro([reglaAlias,r3], ings2).get('MAESTRO')?.id, 'r1');
// Un ciclo no cuelga.
const ciclo:any[]=[{id:'A',nombre:'a',masterProductId:'B'},{id:'B',nombre:'b',masterProductId:'A'}];
eq('un ciclo no cuelga y devuelve el punto de partida', maestroDeRegla({id:'r',ingredientId:'A'} as any, ciclo), 'A');
console.log(f?`\n${f} FALLOS\n`:'\nTodo correcto\n'); process.exit(f?1:0);
