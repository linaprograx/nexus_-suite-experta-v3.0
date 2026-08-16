import { ofertasDeFicha, ofertasDeProducto, masBarataComparable, sonComparables, claveDeOferta, partirClave, proveedoresDeFicha } from '../ofertas/oferta';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const ficha = (extra: any = {}): any => ({
    id: 'v1', nombre: 'ABSOLUT VODKA', categoria: 'X', unidad: 'L',
    standardUnit: 'ml', standardQuantity: 1000, ...extra,
});

console.log('\n— La clave —');
eq('proveedor + formato', claveDeOferta('prov1', 700, 'ml'), 'prov1::700ml');
eq('sin proveedor no se pierde la oferta', claveDeOferta(null, 700, 'ml'), 'sin-proveedor::700ml');
eq('una clave nueva se parte', partirClave('prov1::700ml'), { proveedorId: 'prov1', formato: '700ml' });
eq('una clave ANTIGUA se sigue leyendo', partirClave('prov1'), { proveedorId: 'prov1', formato: null });

console.log('\n— El caso del fundador: tres tamaños del mismo proveedor —');
const tresTamanos = ficha({
    supplierData: {
        'prov1::750ml':  { price: 10, formatQty: 750,  formatUnit: 'ml' },
        'prov1::1000ml': { price: 15, formatQty: 1,    formatUnit: 'l' },
        'prov1::3000ml': { price: 25, formatQty: 3,    formatUnit: 'l' },
    },
});
const o = ofertasDeFicha(tresTamanos);
eq('las TRES caben', o.length, 3);
eq('cada una con SU precio por litro', o.map(x => +(x.precioPorBase! * 1000).toFixed(2)), [13.33, 15, 8.33]);
eq('y no todas con el de la ficha', new Set(o.map(x => x.precioPorBase)).size, 3);
eq('gana el de 3 L, aunque sea el de etiqueta más cara', masBarataComparable(o)?.precio, 25);
eq('el formato se enseña legible', o.map(x => x.formatoLegible), ['750 ml', '1 L', '3 L']);

console.log('\n— Compatibilidad con lo que ya está escrito —');
const claveVieja = ficha({ supplierData: { prov1: { price: 15, unit: 'L' } } });
const ov = ofertasDeFicha(claveVieja);
eq('una clave antigua sigue dando su oferta', ov.length, 1);
eq('  con el proveedor bien leído', ov[0].proveedorId, 'prov1');
eq('  y el formato de la ficha, marcado como heredado', [ov[0].formatoCantidad, ov[0].formatoHeredado], [1000, true]);
eq('  con su precio por litro correcto', +(ov[0].precioPorBase! * 1000).toFixed(2), 15);

console.log('\n— Sin ofertas, la ficha es la oferta —');
// `proveedor` está @deprecated; la escalera de M2 mira antes el preferente
// y `proveedores[]`. Se usa el modelo real, no el campo viejo.
const soloFicha = ficha({ precioCompra: 12, proveedores: ['prov9'] });
const of = ofertasDeFicha(soloFicha);
eq('no se pierde la única forma de comprarlo', of.length, 1);
eq('  con su proveedor', of[0].proveedorId, 'prov9');
eq('  y marcada como venida de la ficha', of[0].origen, 'ficha');

console.log('\n— Lo que NO se compara —');
const mezcla = ficha({
    supplierData: {
        'p1::700ml': { price: 10, formatQty: 700, formatUnit: 'ml' },
        'p2::1und':  { price: 3,  formatQty: 1,   formatUnit: 'und' },
    },
});
eq('ml contra unidades no se compara', masBarataComparable(ofertasDeFicha(mezcla)), null);
eq('  y se puede preguntar antes', sonComparables(ofertasDeFicha(mezcla)), false);
eq('mismas unidades sí', sonComparables(ofertasDeFicha(tresTamanos)), true);
eq('sin ofertas no hay ganadora', masBarataComparable([]), null);

console.log('\n— El preferente —');
const conPreferente = ficha({
    proveedorPreferente: 'prov2',
    supplierData: {
        'prov1::1000ml': { price: 10, formatQty: 1, formatUnit: 'l' },
        'prov2::1000ml': { price: 18, formatQty: 1, formatUnit: 'l' },
    },
});
const op = ofertasDeFicha(conPreferente);
eq('se marca el preferente', op.find(x => x.proveedorId === 'prov2')?.esPreferente, true);
eq('  y el otro no', op.find(x => x.proveedorId === 'prov1')?.esPreferente, false);
eq('la más barata sigue siendo la más barata, aunque no sea la preferente', masBarataComparable(op)?.proveedorId, 'prov1');

console.log('\n— Un producto con dos fichas fusionadas —');
const maestro = ficha({ id: 'm', supplierData: { 'p1::1000ml': { price: 10, formatQty: 1, formatUnit: 'l' } } });
const alias = ficha({ id: 'a', nombre: 'ABSOLUT VODKA 70', masterProductId: 'm', supplierData: { 'p2::1000ml': { price: 8, formatQty: 1, formatUnit: 'l' } } });
const todas = ofertasDeProducto([maestro, alias]);
eq('las ofertas de las dos fichas son del mismo producto', todas.length, 2);
eq('  y compiten entre sí', masBarataComparable(todas)?.proveedorId, 'p2');

console.log('\n— Datos que no valen —');
eq('precio 0 no es una oferta', ofertasDeFicha(ficha({ supplierData: { p1: { price: 0 } } })).length, 0);
eq('una ficha sin id no da nada', ofertasDeFicha({ nombre: 'X' } as any).length, 0);


console.log('\n— Cuántos proveedores surten un producto —');
eq('tres formatos del MISMO proveedor son una sola dependencia', proveedoresDeFicha(tresTamanos), 1);
eq('dos proveedores distintos son dos', proveedoresDeFicha(conPreferente), 2);
// El contador antiguo caía en `ing.proveedor`, obsoleto y vacío en el catálogo
// real, así que daba CERO para casi todo: un riesgo de proveedor único que no
// avisaba de nada.
eq('una ficha del modelo nuevo ya no cuenta cero', proveedoresDeFicha(soloFicha), 1);
eq('sin ofertas, cero de verdad', proveedoresDeFicha(ficha({})), 0);

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
