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
    descripcion: 'Verde profundo, dorado y fotografía protagonista.',

    /**
     * Geometría recuperada.
     *
     * Estuvo reducida a color y tipografía mientras el PDF salía con decenas de
     * páginas. La causa no era el diseño: el documento no declaraba anchura de
     * maquetación y en un móvil se componía a 390px. Con `meta viewport` en
     * 794px —A4 a 96 ppp— el documento pagina correctamente, así que la
     * composición vuelve.
     *
     * Aun así, dos cautelas que no se retiran:
     * - Nada de márgenes negativos para ir a sangre: dependían del relleno del
     *   cuerpo, que cambia entre pantalla e impresión.
     * - La tabla conserva table-layout:fixed y partido de palabra, o un nombre
     *   largo vuelve a ensancharla más allá de su columna.
     */
    css: `
  .cb { page-break-after: always; break-after: page; position: relative; overflow: hidden;
        min-height: 244mm; padding: 78px 56px 56px;
        display: flex; flex-direction: column; justify-content: center;
        background: linear-gradient(150deg, #0a3730 0%, #06231e 58%, #041713 100%); color: #f7f4ec;
        -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cb-marca { font-size: 10px; letter-spacing: .34em; text-transform: uppercase; color: #c9a227; margin-bottom: 26px; }
  .cb-titulo { margin: 0; text-transform: uppercase; letter-spacing: -.015em; line-height: .92;
               font-size: 82px; font-weight: 800; word-break: break-word; }
  .cb-titulo .l2 { display: block; color: #c9a227; }
  .cb-filete { width: 118px; height: 2px; background: #c9a227; margin: 30px 0; }
  .cb-sub { font-size: 15px; line-height: 1.7; color: #cfe3dd; max-width: 54ch; margin: 0; white-space: pre-wrap; }
  .cb-datos { position: absolute; left: 56px; right: 56px; bottom: 56px; display: flex; }
  .cb-datos > div { padding: 0 26px; border-left: 1px solid rgba(201,162,39,.38); }
  .cb-datos > div:first-child { padding-left: 0; border-left: 0; }
  .cb-datos span { display: block; font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: #c9a227; margin-bottom: 5px; }
  .cb-datos b { font-size: 17px; font-weight: 600; color: #f7f4ec; }`,

    html: d => {
        // El título se parte por PALABRAS, nunca a mitad: la primera en crema y
        // el resto en dorado. Con una sola palabra no hay segunda línea.
        const palabras = String(d.titulo).trim().split(/\s+/);
        const l1 = esc(palabras[0] || '');
        const l2 = esc(palabras.slice(1).join(' '));
        return `
  <section class="cb">
    <div class="cb-marca">Carta de cócteles</div>
    <h1 class="cb-titulo">${l1}${l2 ? `<span class="l2">${l2}</span>` : ''}</h1>
    <div class="cb-filete"></div>
    ${d.subtitulo ? `<p class="cb-sub">${esc(d.subtitulo)}</p>` : ''}
    <div class="cb-datos">
      <div><span>Carta de cócteles</span><b>${d.recetas} receta${d.recetas === 1 ? '' : 's'}</b></div>
      <div><span>Fecha</span><b>${esc(d.fecha || '')}</b></div>
      <div><span>Coste medio</span><b>${esc(d.costeMedio)}</b></div>
    </div>
  </section>`;
    },

    cssFicha: `
  body { color: #123; }

  /* La FOTO es el elemento principal: columna izquierda entera, con el
     escandallo compuesto a su derecha bajo las especificaciones.
     Abarcar las dos filas es lo que deja que la imagen sea alta sin fijarle una
     altura: crece hasta donde llegue el contenido de la derecha y nunca se
     recorta, así una receta de 8 filas y otra de 15 componen distinto. */
  .ficha-top { grid-template-columns: 300px 1fr; gap: 30px; margin-bottom: 8px; }
  .col-foto { grid-row: 1 / span 2; }
  .col-escandallo { grid-column: 2; grid-row: 2; border-bottom: 1px solid #e6e1d5; padding-bottom: 18px; }
  .col-escandallo h2 { margin-top: 20px; }
  .col-foto img { width: 300px; height: auto; max-height: 420px; object-fit: contain;
                  border-radius: 4px; box-shadow: 0 12px 34px rgba(4,23,19,.24); background: #06231e; }

  .head { border-bottom: 0; padding-bottom: 0; }
  .col-info h1, .head h1 { font-size: 40px; line-height: 1.02; margin: 0 0 6px; color: #0a3730;
                           text-transform: uppercase; letter-spacing: -.01em; word-break: break-word; }
  .cat { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #c9a227; margin-bottom: 18px; }

  /* Especificaciones en cuatro columnas separadas por filete. */
  .specs { display: flex; flex-wrap: wrap; gap: 0; margin: 0; border-top: 1px solid #e6e1d5; padding-top: 16px; }
  .spec { flex: 1; min-width: 96px; padding: 0 14px; border-left: 1px solid #e6e1d5; text-align: center; }
  .spec:first-child { border-left: 0; padding-left: 0; }
  .spec .k { display: block; font-size: 8.5px; letter-spacing: .17em; text-transform: uppercase; color: #9aa39c; margin-bottom: 4px; }
  .spec .v { font-size: 13px; color: #0a3730; font-weight: 600; }

  h2 { font-size: 12px; letter-spacing: .22em; text-transform: uppercase; color: #0a3730;
       margin: 30px 0 12px; padding-bottom: 0; border: 0; }

  /* table-layout:fixed es imprescindible: sin él un nombre largo ensancha la
     tabla más allá de su columna y reaparece el desbordamiento. */
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  td, th { overflow-wrap: anywhere; word-break: break-word; }
  thead th { background: #0a3730; color: #f7f4ec; font-size: 9px; letter-spacing: .17em;
             text-transform: uppercase; font-weight: 600; padding: 9px 14px; text-align: left; }
  thead th.num { text-align: right; }
  tbody td { padding: 10px 14px; border-bottom: 1px solid #eeeae0; font-size: 13px; color: #1e2a26; }
  tbody tr:last-child td { border-bottom: 0; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .dot { color: #2f9e8f; }
  .k-sub .dot { color: #7c6bd4; }
  .k-garnish .dot { color: #c9a227; }
  .tag { border-color: #e0dac9; color: #9aa39c; }
  .branch { background: #e6e1d5; }
  .k-sub .branch { background: #ded7f5; }
  .k-garnish .branch { background: #f0e3bb; }

  /* Nada de títulos huérfanos ni bandas partidas entre páginas. */
  h2, .prep, .totals, .specs { break-inside: avoid; page-break-inside: avoid; }
  tr { break-inside: avoid; page-break-inside: avoid; }

  .prep { background: #f7f4ec; border-left: 3px solid #c9a227; border-radius: 0 6px 6px 0;
          padding: 14px 18px; font-size: 13px; line-height: 1.7; color: #1e2a26; }

  .totals { display: flex; gap: 0; margin-top: 30px; border: 1px solid #e6e1d5; border-radius: 6px;
            padding: 18px 0; background: #fbfaf6; }
  .totals .box { flex: 1; text-align: center; border-left: 1px solid #e6e1d5; padding: 0 16px; }
  .totals .box:first-child { border-left: 0; }
  .totals .box .l { font-size: 9px; letter-spacing: .17em; color: #9aa39c; }
  .totals .box .n { font-size: 24px; font-weight: 700; color: #0a3730; margin-top: 4px; }

  .foot { margin-top: 26px; padding-top: 12px; border-top: 1px solid #e6e1d5;
          font-size: 9px; letter-spacing: .12em; text-transform: uppercase; color: #b3ada0; }`,
};

/** Registro. Añadir una plantilla es añadirla aquí; el exportador no cambia. */
export const PLANTILLAS_PORTADA: PlantillaPortada[] = [editorial, clubhouse];

export const PLANTILLA_POR_DEFECTO = 'editorial';

export const plantillaPorId = (id?: string): PlantillaPortada =>
    PLANTILLAS_PORTADA.find(p => p.id === id) || PLANTILLAS_PORTADA[0];
