import {
    construirLibro, construirMateriaPrima, hojaDeCoctel, nombreDePestana, AJUSTES_LIBRO_POR_DEFECTO,
} from '../export/libroEscandallos';
import { cartaASheet } from '../export/cartaASheet';

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
const buscar = (t: string) => v.findIndex(r => String(r[0]) === t) + 1;
const enCol = (t: string, c: number) => v.findIndex(r => String(r[c]) === t) + 1;

eq('la marca del negocio va arriba', v[0][0], 'NEXUS');
eq('el nombre del cóctel, resaltado debajo', v[2][0], 'DAIQUIRI');
eq('el bloque económico usa los rótulos de la plantilla',
    [buscar('PRECIO DE VENTA AL PÚBLICO') > 0, buscar('MARGEN DE BENEFICIO NETO') > 0], [true, true]);

// Que las dos celdas del gráfico apunten a lo que su etiqueta dice. En una
// versión anterior «Coste» apuntaba al margen: el pastel enseñaba otro número
// y con la etiqueta correcta al lado, así que parecía bien.
const D = 13;  // columna N, oculta
eq('«Coste Total» del gráfico apunta al coste de receta',
    [v[enCol('Coste Total', D) - 1][D + 1]], [`=B${buscar('COSTO TOTAL DE LA RECETA')}`]);
eq('«Beneficio Neto» apunta al margen',
    [v[enCol('Beneficio Neto', D) - 1][D + 1]], [`=B${buscar('MARGEN DE BENEFICIO NETO')}`]);

eq('las cantidades van normalizadas a unidad base: 6 cl → 60 ml',
    v.find(r => r[0] === 'RON BLANCO')?.slice(1, 3), [60, 'ml']);
eq('el precio se busca en Materia Prima, no se escribe a fuego',
    /VLOOKUP\(\$A\d+;'Materia Prima'!\$A:\$B;2;FALSE\)/.test(String(v.find(r => r[0] === 'RON BLANCO')?.[3])), true);
// Un precio por MILILITRO con formato de moneda sale «€0,01» en todo: no
// distingue un ron de un zumo. Se enseña por litro/kilo, como la plantilla.
eq('  y es el precio por litro/kilo, no por mililitro',
    String(v.find(r => r[0] === 'RON BLANCO')?.[4]).includes('*0,001*'), true);
eq('hay marcos alrededor de los bloques', (h.bordes || []).length >= 3, true);
eq('y hueco rotulado para el método y la foto',
    [buscar('MÉTODO Y DESCRIPCIÓN') > 0, enCol('FOTO', 4) > 0], [true, true]);
eq('se protege lo calculado', (h.protegidos || []).length > 0, true);

// ── El invariante que habría evitado el libro roto ──────────────────────────
// Una hoja en es_ES usa la COMA como separador decimal. Un `0.001` escrito
// dentro de una fórmula la rompe entera con #ERROR!, y no se ve venir porque en
// el código el número es perfectamente válido.
const conPuntoDecimal = (hoja: { valores: any[][] }) => {
    const malos: string[] = [];
    hoja.valores.forEach((f, i) => f.forEach((c, j) => {
        const t = String(c);
        if (t.startsWith('=') && /\d\.\d/.test(t)) malos.push(`fila ${i + 1} col ${j}: ${t}`);
    }));
    return malos;
};

console.log('\n— Ninguna fórmula puede llevar un punto decimal —');
const conFactor = hojaDeCoctel(receta({
    ingredientes: [{ ingredientId: 'u1', nombre: 'VAINILLA', cantidad: 50, unidad: 'g' }],
}), [...catalogo, ing('u1', 'VAINILLA', 2.17, { standardUnit: 'und', standardQuantity: 1, unidad: 'und', unidadCompra: 'und' })],
    AJUSTES_LIBRO_POR_DEFECTO, 'X');
eq('la ficha con conversión de unidades no lleva ninguno', conPuntoDecimal(conFactor), []);
eq('  y el factor va con coma', /\*0,\d+\*/.test(String(conFactor.valores.find(r => r[0] === 'VAINILLA')?.[4])), true);
eq('la ficha normal tampoco', conPuntoDecimal(h), []);

console.log('\n— Las líneas vacías de la receta no se pintan —');
const conHueco = hojaDeCoctel(receta({
    ingredientes: [
        { ingredientId: 'r1', nombre: 'RON BLANCO', cantidad: 50, unidad: 'ml' },
        { nombre: '', cantidad: 0, unidad: 'g' },
    ],
}), catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'X');
eq('un hueco de la receta no sale como «Sin nombre · 0 g»',
    conHueco.valores.filter(r => String(r[0]) === 'Sin nombre').length, 0);

console.log('\n— Un ingrediente que no está en el catálogo —');
const huerfana = hojaDeCoctel(
    receta({ ingredientes: [{ ingredientId: 'no-existe', nombre: 'FANTASMA', cantidad: 10, unidad: 'ml' }] }),
    catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'X',
);
const fila = huerfana.valores.find(r => r[0] === 'FANTASMA')!;
eq('no se inventa un precio', [fila[3], fila[4]], ['', '']);
eq('  y se dice por qué', String(fila[5]).includes('Sin ficha'), true);

console.log('\n— La sub-preparación es una LÍNEA de la ficha, y su detalle va a la derecha —');
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

const COL = 7;  // H
const filaSub = conSub.valores.findIndex(r => String(r[0]) === 'SIROPE') + 1;
const lineaSub = conSub.valores[filaSub - 1];

// Esto es lo que faltaba: el cóctel no cuadraba con su propio total porque la
// sub-preparación estaba SOLO a la derecha y no era línea de la ficha.
eq('la sub-preparación aparece en la tabla del cóctel', filaSub > 0, true);
eq('  con lo que se usa y su unidad', [lineaSub[1], lineaSub[2]], [20, 'ml']);
eq('  y su coste por unidad sale del lote, también por litro/kilo',
    /=L\d+\*1000\/1000/.test(String(lineaSub[3])), true);
eq('  con su nota remitiendo al detalle', String(lineaSub[5]).includes('detalle a la derecha'), true);

const filaTotal = conSub.valores.findIndex(r => String(r[3]) === 'COSTE TOTAL') + 1;
eq('el total de la tabla la incluye', String(conSub.valores[filaTotal - 1][4]).includes(`E${filaSub}`), true);
const costeReceta = conSub.valores.find(r => r[0] === 'COSTO TOTAL DE LA RECETA');
eq('y el coste de receta es ese total, sin sumandos aparte', costeReceta?.[1], `=E${filaTotal}`);

const titSub = conSub.valores.find(r => String(r[COL]).startsWith('SIROPE'));
eq('el despiece va a la derecha con su rendimiento', titSub?.[COL], 'SIROPE (1000 ml/g)');
// 500 g + 500 ml: Nexus los suma (densidad 1) pero la etiqueta no puede decir
// «1000 g», porque la mitad no lo es.
eq('el bloque de la derecha ya no repite la línea «usado»',
    conSub.valores.filter(r => String(r[COL]) === 'Usado en la receta').length, 0);
eq('las fórmulas del despiece apuntan a SUS columnas',
    /VLOOKUP\(\$H\d+;/.test(String(conSub.valores.find(r => String(r[COL]) === 'AZUCAR')?.[COL + 3])), true);
eq('ninguna fórmula lleva punto decimal', conPuntoDecimal(conSub), []);

console.log('\n— El gráfico —');
// La primera fila de un rango la toma Google como CABECERA. Con los datos en la
// fila 1 se comía «Coste Total» y el pastel salía de un solo color, al 100 % de
// beneficio. Esta prueba falla si alguien los vuelve a subir ahí.
eq('los datos del gráfico NO empiezan en la fila 1', (conSub.grafico?.filaDatos ?? 0) > 0, true);
eq('y sus dos filas son datos, no una cabecera',
    [String(conSub.valores[(conSub.grafico!.filaDatos)][13]), String(conSub.valores[(conSub.grafico!.filaDatos) + 1][13])],
    ['Coste Total', 'Beneficio Neto']);
eq('las notas se ajustan a su celda, no se desbordan', (conSub.ajustarTexto || []).length >= 2, true);
eq('sus datos viven fuera de la ficha', conSub.grafico?.colDatos, 13);
eq('  en columnas que se ocultan', (conSub.columnasOcultas || []).length, 1);
eq('  y no se repiten dentro del cuadro',
    conSub.valores.slice(3, 12).filter(r => String(r[3]) === 'Coste Total').length, 0);
// Las columnas D+E+F miden 95+95+210 = 400 px. El gráfico mide su hueco, no una
// cifra puesta a ojo: es lo que hacía que en cada pestaña quedara corrido.
const anchos = hojaDeCoctel(receta(), catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'X').anchos;
eq('el gráfico mide exactamente las columnas que ocupa',
    conSub.grafico?.ancho, anchos[3] + anchos[4] + anchos[5]);
eq('y arranca en la columna D, fila 4', [conSub.grafico?.anclaCol, conSub.grafico?.anclaFila], [3, 3]);

console.log('\n— El libro entero —');
const recetasLibro = [receta(), receta({ id: 'b', nombre: 'MOJITO' })];
const cartaDemo = cartaASheet(recetasLibro.map(r => ({ recipe: r, coste: 1 })),
    { nombre: 'MI CARTA', concepto: 'algo', fecha: '2026-08-16' });
const libro = construirLibro(recetasLibro, catalogo, AJUSTES_LIBRO_POR_DEFECTO,
    { nombre: 'MI CARTA', concepto: 'algo', fecha: '2026-08-16' }, cartaDemo);
eq('resumen + 2 cócteles + materia prima', libro.hojas.map(x => x.titulo), ['Resumen', 'DAIQUIRI', 'MOJITO', 'Materia Prima']);
eq('el resumen enlaza con la ficha de cada cóctel',
    /HYPERLINK\("#gid=1";"Ver ficha"\)/.test(String(libro.hojas[0].valores.find(r => r[0] === 'DAIQUIRI')?.[7])), true);

console.log('\n— Sin datos no revienta —');
eq('una carta vacía da resumen y materia prima',
    construirLibro([], catalogo, AJUSTES_LIBRO_POR_DEFECTO, { nombre: 'X' }, cartaASheet([], { nombre: 'X' })).hojas.length, 2);
eq('una receta sin ingredientes tampoco', hojaDeCoctel({ nombre: 'V', ingredientes: [] } as any, catalogo, AJUSTES_LIBRO_POR_DEFECTO, 'V').valores.length > 0, true);


console.log('\n— La portada del Resumen no se come el concepto ni la fecha —');
// `MERGE_ALL` se queda SOLO con la celda de arriba a la izquierda. Fusionando
// las cuatro filas de portada en una, el concepto y la fecha desaparecían.
const resumen = libro.hojas[0];
const bandasPortada = resumen.bandas.filter(b => b.fila < 4 && b.combinar);
eq('cada fila de portada se combina por separado', bandasPortada.length, 4);
eq('  y ninguna abarca más de una fila', bandasPortada.every(b => (b.filas || 1) === 1), true);
eq('el concepto sigue en su fila', resumen.valores[1][0], 'algo');
eq('y la fecha en la suya', resumen.valores[2][0], '2026-08-16');

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
