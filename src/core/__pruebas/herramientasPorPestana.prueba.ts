import { HERRAMIENTAS_POR_PESTANA, CABEN_POR_FILA, herramientasDe } from '../../views/grimorium/shell/herramientasPorPestana';

let fallos = 0;
const ok = (cond: boolean, msg: string) => {
    if (!cond) { console.error('  ✗ ' + msg); fallos++; }
};

console.log('herramientas por pestaña');

// La regla que pidió el fundador el 2026-08-23, tal cual la dijo.
ok(!herramientasDe('market').includes('carta'), 'Carta NO va en Mercado');
ok(!herramientasDe('market').includes('ia'), 'IA NO va en Mercado');
ok(!herramientasDe('market').includes('duplicados'), 'Duplicados NO va en Mercado');
ok(!herramientasDe('market').includes('costes'), 'Costes NO va en Mercado');

ok(herramientasDe('recipes').includes('carta'), 'Carta va en Recetas');
ok(herramientasDe('recipes').includes('ia') && herramientasDe('stock').includes('ia'),
    'IA va en Recetas e Inventario');
ok(herramientasDe('stock').includes('duplicados'), 'Duplicados va en Inventario');
ok(herramientasDe('recipes').includes('costes') && herramientasDe('stock').includes('costes'),
    'Costes va en Recetas e Inventario');

// Las tres de Mercado siguen en Mercado y solo ahí.
for (const id of ['familias', 'precios', 'importar']) {
    ok(JSON.stringify(HERRAMIENTAS_POR_PESTANA[id]) === '["market"]', `${id} solo en Mercado`);
}

// Lo que no depende de la pantalla sale siempre.
for (const id of ['atencion', 'historial']) {
    ok(HERRAMIENTAS_POR_PESTANA[id].length === 3, `${id} en las tres pestañas`);
}

/**
 * El invariante que arregla el descolgamiento.
 *
 * Con el menú lateral abierto, la sexta pastilla con rótulo ya no cabe y baja
 * de línea. La fila es `flex-nowrap` a propósito —que se parta parece una
 * segunda fila de navegación y no lo es— así que la única defensa es no meter
 * más de las que caben. Si añades una séptima herramienta a una pestaña,
 * falla aquí, no en la cara del usuario.
 */
for (const modo of ['recipes', 'stock', 'market'] as const) {
    const n = herramientasDe(modo).length;
    ok(n <= CABEN_POR_FILA, `${modo} tiene ${n} herramientas, caben ${CABEN_POR_FILA}`);
}

// Ninguna herramienta puede quedar sin pestaña: sería código inalcanzable.
for (const [id, modos] of Object.entries(HERRAMIENTAS_POR_PESTANA)) {
    ok(modos.length > 0, `${id} sale en alguna pestaña`);
}

console.log(fallos === 0 ? '  ✓ todo correcto' : `  ${fallos} fallo(s)`);
if (fallos > 0) process.exit(1);
