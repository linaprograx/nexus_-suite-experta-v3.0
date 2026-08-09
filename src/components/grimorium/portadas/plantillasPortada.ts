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
    css: string;
    html: (d: DatosPortada) => string;
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

/**
 * Cartel — el título ocupa la página.
 *
 * Primera plantilla nueva. El nombre de la carta manda: se compone a gran
 * tamaño sobre un fondo profundo, con los datos reducidos a un pie discreto.
 * Pensada para cartas con nombre corto y con carácter.
 */
const cartel: PlantillaPortada = {
    id: 'cartel',
    nombre: 'Cartel',
    descripcion: 'El título a toda página, fondo profundo.',
    css: `
  .pc { page-break-after: always; break-after: page; position: relative;
        min-height: 240mm; display: flex; flex-direction: column; justify-content: center;
        background: #0f172a; color: #f8fafc; margin: -28px -24px 0; padding: 60px 48px; }
  /* El navegador omite los fondos al imprimir salvo que se le pida. */
  .pc { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .pc-linea { width: 64px; height: 4px; background: #2dd4bf; margin-bottom: 28px; }
  .pc-marca { font-size: 10px; letter-spacing: .28em; text-transform: uppercase; color: #5eead4; margin-bottom: 14px; }
  .pc-titulo { font-size: 76px; line-height: .95; letter-spacing: -.02em; margin: 0 0 22px; text-transform: uppercase; }
  .pc-sub { font-size: 16px; line-height: 1.65; color: #cbd5e1; max-width: 52ch; margin: 0; white-space: pre-wrap; }
  .pc-pie { position: absolute; left: 48px; right: 48px; bottom: 54px;
            display: flex; gap: 40px; border-top: 1px solid rgba(255,255,255,.18); padding-top: 16px; }
  .pc-pie span { display: block; font-size: 9px; letter-spacing: .16em; text-transform: uppercase; color: #94a3b8; }
  .pc-pie b { font-size: 17px; color: #f8fafc; font-weight: 600; }
  .pc-logo { position: absolute; top: 54px; right: 48px; max-height: 56px; max-width: 140px; object-fit: contain; }`,
    html: d => `
  <section class="pc">
    ${d.logo ? `<img class="pc-logo" src="${esc(d.logo)}" alt="">` : ''}
    <div class="pc-linea"></div>
    <div class="pc-marca">Carta · Nexus Suite</div>
    <h1 class="pc-titulo">${esc(d.titulo)}</h1>
    ${d.subtitulo ? `<p class="pc-sub">${esc(d.subtitulo)}</p>` : ''}
    <div class="pc-pie">
      <div><span>Recetas</span><b>${d.recetas}</b></div>
      <div><span>Coste medio</span><b>${esc(d.costeMedio)}</b></div>
      <div><span>Fecha</span><b>${esc(d.fecha || '')}</b></div>
    </div>
  </section>`,
};

/** Registro. Añadir una plantilla es añadirla aquí; el exportador no cambia. */
export const PLANTILLAS_PORTADA: PlantillaPortada[] = [editorial, cartel];

export const PLANTILLA_POR_DEFECTO = 'editorial';

export const plantillaPorId = (id?: string): PlantillaPortada =>
    PLANTILLAS_PORTADA.find(p => p.id === id) || PLANTILLAS_PORTADA[0];
