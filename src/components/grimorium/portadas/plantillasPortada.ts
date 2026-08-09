/**
 * Plantillas de portada del recetario.
 *
 * **Datos y diseño están desacoplados.** Una plantilla recibe los datos ya
 * preparados y decide únicamente cómo representarlos: no consulta nada, no
 * calcula nada y no sabe de dónde vienen. Añadir una plantilla nueva es añadir
 * una entrada a `PLANTILLAS_PORTADA` — no toca el exportador.
 *
 * Cada plantilla aporta también su propio CSS, que se inyecta solo cuando se usa.
 * Así los estilos de una no pueden afectar a otra ni al resto del documento.
 */

export interface DatosPortada {
    titulo: string;
    subtitulo?: string;
    fecha?: string;
    recetas: number;
    costeMedio: string;
    /** URL de imagen, si el negocio tiene logotipo. Puede no existir. */
    logo?: string;
}

export interface PlantillaPortada {
    id: string;
    nombre: string;
    /** Frase corta para la miniatura de selección. */
    descripcion: string;
    /** CSS de la portada. */
    css: string;
    html: (d: DatosPortada) => string;
    /**
     * CSS de la FICHA de receta. Opcional: sin él, la ficha usa el estilo base
     * del exportador, que es lo que ya funcionaba.
     *
     * Un tema viste componentes que ya existen —`.head`, `.specs`, la tabla del
     * escandallo, `.prep`, `.totals`, `.foot`— y **no decide qué datos hay ni en
     * qué orden**. Esa separación es lo que permite añadir temas sin tocar el
     * motor.
     */
    cssFicha?: string;
}

const esc = (s: any): string =>
    String(s ?? '').replace(/[&<>"']/g, c =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/**
 * Editorial — la portada actual, conservada tal cual.
 *
 * Es la que ya funcionaba. Se mantiene como plantilla por defecto para que
 * exportar sin elegir nada dé exactamente el mismo resultado de siempre.
 */
const editorial: PlantillaPortada = {
    id: 'editorial',
    nombre: 'Editorial',
    descripcion: 'Sobria, tipográfica. La de siempre.',
    css: `
  .portada { page-break-after: always; break-after: page; padding: 60px 0 40px; }
  .p-marca { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: #94a3b8; margin-bottom: 18px; }
  .p-titulo { font-size: 44px; line-height: 1.05; margin: 0 0 18px; color: #0f172a; }
  .p-concepto { font-size: 15px; line-height: 1.6; color: #475569; max-width: 60ch; margin: 0 0 34px; white-space: pre-wrap; }
  .p-datos { display: flex; gap: 34px; border-top: 3px solid #0d9488; padding-top: 18px; }
  .p-datos span { display: block; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: #94a3b8; }
  .p-datos b { font-size: 20px; color: #0f172a; }`,
    html: d => `
  <section class="portada">
    <div class="p-marca">Nexus Suite · Grimorio</div>
    <h1 class="p-titulo">${esc(d.titulo)}</h1>
    ${d.subtitulo ? `<p class="p-concepto">${esc(d.subtitulo)}</p>` : ''}
    <div class="p-datos">
      <div><span>Recetas</span><b>${d.recetas}</b></div>
      <div><span>Coste medio</span><b>${esc(d.costeMedio)}</b></div>
      <div><span>Fecha</span><b>${esc(d.fecha || '')}</b></div>
    </div>
  </section>`,
};

/*
 * "Cartel" se retira temporalmente.
 *
 * Usaba la misma geometría que rompió la paginación —min-height en milímetros,
 * flex centrado y posicionamiento absoluto— y nunca llegó a verificarse en un
 * PDF. Dejarla en el selector sería ofrecer una opción rota.
 *
 * Vuelve en cuanto la paginación esté comprobada sobre un documento real.
 */

/**
 * Clubhouse Premium — verde profundo, crema y dorado.
 *
 * Toma de la referencia el sistema, no la geometría: masa de color a sangre,
 * título protagonista en dos pesos, filete dorado y banda de metadatos con
 * separadores.
 *
 * Dos decisiones deliberadas donde se aparta de la referencia, ambas para no
 * romper recetas reales:
 *
 * - **El escandallo va a ancho completo**, no encajado junto a la foto. Con
 *   quince ingredientes, una sub-receta y un garnish, una tabla estrecha se
 *   alarga el doble y multiplica los saltos de página.
 * - **La foto tiene alto MÁXIMO, no fijo**, y se muestra entera (`contain`).
 *   Estirarla hasta cuadrar con el texto obliga a suponer que todas las recetas
 *   miden lo mismo, y a recortar la imagen.
 *
 * El título usa tamaño fluido: "DRINK YOUR GAME" llena la página y
 * "WINTER COLLECTION 2026" encoge sin desbordar ni partir palabras.
 */
const clubhouse: PlantillaPortada = {
    id: 'clubhouse',
    nombre: 'Clubhouse Premium',
    descripcion: 'Verde profundo, dorado y tipografía editorial.',

    /**
     * **Este tema no toca geometría. A propósito.**
     *
     * Las versiones anteriores cambiaban la disposición: rejilla propia, alturas
     * en milímetros, posicionamiento absoluto y centrado con flex. El PDF salía
     * con 90, 63 y 112 páginas para cinco recetas, y el navegador llegaba a
     * colgarse calculando la maquetación. Tres intentos, tres resultados peores.
     *
     * La disposición base ya paginaba bien. Así que aquí solo hay **color,
     * tipografía y filetes**: ni `display`, ni `position`, ni `min-height`, ni
     * `grid`, ni alturas en mm. Un tema que no altera la caja no puede romper la
     * paginación.
     *
     * Cuando el PDF esté verificado se podrá reintroducir la foto grande, pero
     * midiendo sobre un documento real, no a ciegas.
     */
    css: `
  .portada { page-break-after: always; break-after: page;
             background: #08302a; color: #f7f4ec; padding: 96px 56px 120px;
             -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .p-marca { font-size: 10px; letter-spacing: .3em; text-transform: uppercase; color: #c9a227; margin-bottom: 28px; }
  .p-titulo { font-size: 64px; line-height: .96; margin: 0 0 26px; color: #f7f4ec;
              text-transform: uppercase; letter-spacing: -.015em; word-break: break-word; }
  .p-titulo .l2 { color: #c9a227; }
  .p-concepto { font-size: 15px; line-height: 1.7; color: #cfe3dd; max-width: 54ch; margin: 0 0 44px; white-space: pre-wrap; }
  .p-datos { border-top: 2px solid #c9a227; padding-top: 20px; }
  .p-datos span { font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: #c9a227; }
  .p-datos b { font-size: 18px; color: #f7f4ec; }`,

    html: d => {
        // El título se parte por PALABRAS, nunca a mitad: la primera en crema y
        // el resto en dorado. Con una sola palabra no hay segunda parte.
        const palabras = String(d.titulo).trim().split(/\s+/);
        const l1 = esc(palabras[0] || '');
        const l2 = esc(palabras.slice(1).join(' '));
        return `
  <section class="portada">
    <div class="p-marca">Carta de cócteles</div>
    <h1 class="p-titulo">${l1}${l2 ? ` <span class="l2">${l2}</span>` : ''}</h1>
    ${d.subtitulo ? `<p class="p-concepto">${esc(d.subtitulo)}</p>` : ''}
    <div class="p-datos">
      <div><span>Recetas</span> <b>${d.recetas}</b> &nbsp;·&nbsp;
           <span>Fecha</span> <b>${esc(d.fecha || '')}</b> &nbsp;·&nbsp;
           <span>Coste medio</span> <b>${esc(d.costeMedio)}</b></div>
    </div>
  </section>`;
    },

    /** Solo color y tipografía. Ninguna regla que altere la caja. */
    cssFicha: `
  .head { border-bottom-color: #c9a227; }
  .head h1 { color: #08302a; text-transform: uppercase; letter-spacing: -.01em; }
  .cat { color: #c9a227; letter-spacing: .18em; text-transform: uppercase; }
  h2 { color: #08302a; letter-spacing: .2em; text-transform: uppercase; }
  thead th { background: #08302a; color: #f7f4ec; letter-spacing: .14em; }
  tbody td { border-bottom-color: #eeeae0; }
  .dot { color: #2f9e8f; }
  .k-sub .dot { color: #7c6bd4; }
  .k-garnish .dot { color: #c9a227; }
  .prep { background: #f7f4ec; border-left: 3px solid #c9a227; }
  .totals { border-top-color: #c9a227; }
  .totals .box .n { color: #08302a; }
  .foot { color: #b3ada0; }`,
};

/** Registro. Añadir una plantilla es añadirla aquí; el exportador no cambia. */
export const PLANTILLAS_PORTADA: PlantillaPortada[] = [editorial, clubhouse];

export const PLANTILLA_POR_DEFECTO = 'editorial';

export const plantillaPorId = (id?: string): PlantillaPortada =>
    PLANTILLAS_PORTADA.find(p => p.id === id) || PLANTILLAS_PORTADA[0];
