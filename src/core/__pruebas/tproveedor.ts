import { resumenDeProveedor, diasDeReparto } from '../../features/suppliers/resumenProveedor';

let f = 0;
const eq = (t: string, r: any, e: any) => {
    const ok = JSON.stringify(r) === JSON.stringify(e);
    if (!ok) f++;
    console.log(`${ok ? '  ok  ' : ' FALLA'} ${t}${ok ? '' : `  esperado ${JSON.stringify(e)} · real ${JSON.stringify(r)}`}`);
};

const prov = (extra: any = {}): any => ({
    id: 'p1', name: 'BORDINOS', leadTimeDays: 3,
    deliveryDays: ['Lunes', 'Miércoles', 'Viernes'], paymentTerms: '30 días', ...extra,
});

console.log('\n— Días de reparto —');
eq('se abrevian', diasDeReparto(['Lunes', 'Miércoles', 'Viernes']), 'L · X · V');
eq('los acentos no cambian el resultado', diasDeReparto(['Miercoles']), 'X');
eq('un día desconocido no se pierde, se recorta', diasDeReparto(['Festivo']), 'Fes');
eq('sin días, vacío', diasDeReparto([]), '');

console.log('\n— El resumen —');
eq('los tres datos, en orden', resumenDeProveedor(prov()), '3 días · L · X · V · 30 días');
eq('un solo día se dice en singular', resumenDeProveedor(prov({ leadTimeDays: 1 })), '1 día · L · X · V · 30 días');
eq('sin plazo, no se inventa', resumenDeProveedor(prov({ leadTimeDays: 0 })), 'L · X · V · 30 días');

// Escribir «— · —» ocupa sitio, no dice nada y hace parecer que el proveedor
// está mal configurado cuando lo que pasa es que no se ha rellenado.
eq('sin ningún dato, cadena vacía y no un relleno',
    resumenDeProveedor(prov({ leadTimeDays: 0, deliveryDays: [], paymentTerms: '' })), '');
eq('sin proveedor tampoco revienta', resumenDeProveedor(null), '');
eq('un plazo no numérico no se cuela', resumenDeProveedor(prov({ leadTimeDays: 'pronto' as any })), 'L · X · V · 30 días');

console.log(f ? `\n${f} FALLOS\n` : '\nTodo correcto\n');
process.exit(f ? 1 : 0);
