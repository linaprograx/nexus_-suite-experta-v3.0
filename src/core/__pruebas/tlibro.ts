import {
    construirLibro, construirMateriaPrima, hojaDeCoctel, nombreDePestana, AJUSTES_LIBRO_POR_DEFECTO,
} from '../export/libroEscandallos';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const ing = (id: string, nombre: string, precio: number, extra: any = {}): any => ({
    id, nombre, categoria: 'X', unidad: 'L', unidadCompra: 'L', cantidad: 1,
    precioCompra: precio, standardUnit: 'ml', standardQuantity: 1000, ...extra,
});

const catalogo: any[] = [
    ing('r1', 'RON BLANCO', 12),
    ing('l1', 'ZUMO DE LIMA', 4),
    ing('a1', 'AZUCAR', 2, { standardUnit: 'g', standardQuantity: 1000, unidad: 'kg', unidadCompra: 'kg' }),
    ing('m1', 'MERMADO', 10, { merma: 50 }),
];

const receta = (extra: any = {}): any => ({
    id: 'x', nombre: 'DAIQUIRI', precioVenta: 12,
    ingredientes: [
        { ingredientId: 'r1', nombre: 'RON BLANCO', cantidad: 6, unidad: 'cl' },
        { ingredientId: 'l1', nombre: 'ZUMO DE LIMA', cantidad: 25, unidad: 'ml' },
    ],
    ...extra,
});

console.log('\n— Nombres de pestaña —');
const usados = new Set<string>();
eq('se limpian los caracteres prohibidos', nombreDePestana('MOJITO [ESPECIAL]/2024', usados), 'MOJITO ESPECIAL 2024');
eq('dos cócteles con el mismo nombre no chocan', [nombreDePestana('X', usados), nombreDePestana('X', usados)], ['X', 'X (2)']);
eq('un nombre vacío no deja la pestaña sin nombre', nombreDePestana('', new Set()), 'Sin nombre');

console.log('\n— Materia Prima —');
const mp = construirMateriaPrima([receta()], catalogo);
eq('solo lo que la receta usa', mp.map(m => m.nombre), ['RON BLANCO', 'ZUMO DE LIMA']);
eq('el precio va por unidad base', mp[0].unidadBase, 'ml');
eq('  y también en la unidad que se lee', [mp[0].precioLegible, mp[0].unidadLegible], [12, 'L']);
eq('sin repetir si dos recetas comparten ingrediente', construirMateriaPrima([receta(), receta({ id: 'y' })], catalogo).length, 2);

const conMerma = construirMateriaPrima(
    [{ id: 'z', nombre: 'Z', ingredientes: [{ ingredientId: 'm1', nombre: 'MERMADO', cantidad: 10, unidad: 'ml' }] } as any],
    catalogo,
);
eq('la merma del ingrediente YA está en el precio (50 % → el doble)', conMerma[0].precioLegible, 20);
eq('  y se enseña el porcentaje, para poder entenderlo', conMerma[0].mermaPct, 50);

console.log('\n— La ficha de cóctel —');
const h = hojaDeCoctel(receta(), catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'DAIQUIRI');
const v = h.valores;
eq('la marca va en A1', v[0][0], 'NEXUS');
eq('el nombre en la banda', v[1][0], 'DAIQUIRI');

// LO CRÍTICO: la portada referencia filas fijas. Si el diseño cambia y esto no,
// la portada apunta a la celda equivocada y NADIE se entera.
eq('fila 4 = PVP', v[3][0], 'PVP al público');
eq('fila 7 = Coste de receta', v[6][0], 'Coste de receta');
eq('fila 8 = Margen bruto', v[7][0], 'Margen bruto');
eq('fila 9 = % de coste', v[8][0], '% de coste');

eq('las cantidades van normalizadas a unidad base: 6 cl → 60 ml',
    v.find(r => r[0] === 'RON BLANCO')?.slice(1, 3), [60, 'ml']);
eq('el precio se busca en Materia Prima, no se escribe a fuego',
    /VLOOKUP\(\$A\d+;'Materia Prima'!\$A:\$D;4;FALSE\)/.test(String(v.find(r => r[0] === 'RON BLANCO')?.[3])), true);
eq('la línea multiplica cantidad por precio', /=IF\(D\d+="";"";B\d+\*D\d+\)/.test(String(v.find(r => r[0] === 'RON BLANCO')?.[4])), true);
eq('el separador de fórmulas es el punto y coma (locale es_ES)',
    String(v.find(r => r[0] === 'RON BLANCO')?.[3]).includes(';'), true);

console.log('\n— Un ingrediente que no está en el catálogo —');
const huerfana = hojaDeCoctel(
    receta({ ingredientes: [{ ingredientId: 'no-existe', nombre: 'FANTASMA', cantidad: 10, unidad: 'ml' }] }),
    catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'X',
);
const fila = huerfana.valores.find(r => r[0] === 'FANTASMA')!;
eq('no se inventa un precio', [fila[3], fila[4]], ['', '']);
eq('  y se dice por qué', String(fila[5]).includes('Sin ficha'), true);

console.log('\n— Sub-recetas —');
const conSub = hojaDeCoctel(receta({
    ingredientes: [
        { ingredientId: 'r1', nombre: 'RON BLANCO', cantidad: 50, unidad: 'ml' },
        {
            nombre: 'SIROPE', cantidad: 20, unidad: 'ml', isSubRecipe: true,
            subItems: [
                { ingredientId: 'a1', nombre: 'AZUCAR', cantidad: 500, unidad: 'g' },
                { ingredientId: 'l1', nombre: 'ZUMO DE LIMA', cantidad: 500, unidad: 'ml' },
            ],
        },
    ],
}), catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'X');
const tit = conSub.valores.find(r => String(r[0]).startsWith('SIROPE'));
eq('la sub-receta lleva su rendimiento en el título', String(tit?.[0]).includes('rinde 1000'), true);
const prorrateo = conSub.valores.find(r => r[0] === 'Usado en la receta');
eq('se prorratea por lo usado', /=E\d+\*20\/1000/.test(String(prorrateo?.[4])), true);
const coste = conSub.valores[6];
eq('el coste de receta suma directos MÁS la sub-receta prorrateada', /=E\d+\+E\d+/.test(String(coste[1])), true);

console.log('\n— El libro entero —');
const libro = construirLibro([receta(), receta({ id: 'b', nombre: 'MOJITO' })], catalogo, AJUSTES_LIBRO_POR_DEFECTO,
    { nombre: 'MI CARTA', concepto: 'algo', fecha: '2026-08-16' });
eq('portada + 2 cócteles + materia prima', libro.hojas.map(x => x.titulo), ['Carta', 'DAIQUIRI', 'MOJITO', 'Materia Prima']);
eq('la portada trae el coste de cada pestaña por fórmula',
    libro.hojas[0].valores.find(r => r[0] === 'DAIQUIRI')?.[2], "='DAIQUIRI'!B7");
eq('y esa fila 7 es de verdad el coste',
    libro.hojas[1].valores[6][0], 'Coste de receta');

console.log('\n— Sin datos no revienta —');
eq('una carta vacía da portada y materia prima', construirLibro([], catalogo, AJUSTES_LIBRO_POR_DEFECTO, { nombre: 'X' }).hojas.length, 2);
eq('una receta sin ingredientes tampoco', hojaDeCoctel({ nombre: 'V', ingredientes: [] } as any, catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'V').valores.length > 0, true);

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
