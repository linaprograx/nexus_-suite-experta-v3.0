# Auditoría de Pizarrón

**Fecha:** 2026-08-02 · **Autor:** Claude Code
**Método:** lectura de código + medición en navegador a 390×844 con sesión real.

Cada hallazgo lleva **archivo:línea** y, cuando existe, la evidencia numérica.
Lo marcado ✅ ya está corregido; lo demás está abierto.

---

## 🔴 GRAVES

### G1 ✅ Rounding, opacidad y sombra no se guardaban

`ui/overlays/Inspector.tsx` (inspector de formas)

Dos defectos encadenados:

1. Las props iban **cableadas a literales**: `opacity={1}`, `borderWidth={0}`,
   `borderRadius={0}`. No se leían del nodo, así que los deslizadores volvían
   siempre a cero y parecían no responder.
2. El manejador solo persistía `opacity` y `borderWidth`. `borderRadius` y
   `shadow` llegaban desde `VisualEffectsController` y **se descartaban en
   silencio**.

No era un problema de pintado: `engine/renderer.ts` tiene 14 menciones de
`borderRadius` y 9 de sombra. El dato nunca llegaba.

### G2 ✅ El mismo defecto estaba copiado en 4 inspectores más

Cada uno descarta un **subconjunto distinto** de campos — deriva clásica de
copia y pega:

| Archivo | Guarda | Descarta |
|---|---|---|
| `inspectors/IconInspector.tsx:35` | opacity, shadow | borderRadius, borderWidth |
| `inspectors/GroupInspector.tsx:70` | opacity, borderWidth | borderRadius, shadow |
| `inspectors/BoardInspector.tsx:338` | por verificar | `opacity={1}` cableado |
| `Inspector.tsx:106` y `:317` | por verificar | props cableadas |

**Resuelto cambiando la firma, no parcheando.** `VisualEffectsController` ahora
recibe `targets` (los nodos) y un único `onApply`. Lee los valores del nodo y
construye el parche completo internamente, así que **un llamante ya no puede
olvidarse de un campo**: la API no se lo permite.

Migrados los 12 bloques de 8 archivos. TypeScript señaló todos los llamantes
antiguos al cambiar la firma, que es justo la señal que se buscaba.

Dos matices que costaron una vuelta atrás:

- **`BoardInspector` no escribía en el nodo, sino en la ZONA activa** de su
  estructura. Una migración en bloque lo habría hecho pintar el tablero entero.
  Se le pasa la zona como destino sintético, traduciendo `filters.shadow` a
  `style.shadow`, que es donde el modelo de zonas guarda la sombra.
- Los sub-inspectores reciben un `updateNode` que **ya aplica a toda la
  selección**. Escribir nodo a nodo desde el store habría perdido la
  multiselección, así que se delega en ese ayudante.

### G3 ⬜ `isMobileMode` está muerto

`ui/PizarronRoot.tsx:37-41`

Lee `document.body.classList.contains('mobile-pizarron-mode')` para ocultar
todos los overlays de escritorio. **Nadie añade nunca esa clase.** Siempre
`false`.

Hay un modo móvil diseñado y jamás conectado. `engine/renderer.ts:1579`
también consulta esa clase, así que el renderizador tiene una rama muerta.

**No lo actives sin más:** dejaría Pizarrón sin ninguna herramienta. Es la
palanca para las fases P1–P4, pero exige construir antes el juego de overlays
móviles.

---

## 🟠 MEDIOS

### M1 ✅ Nodos creados con medidas de escritorio

Cuatro puntos de creación con tamaños fijos, ninguno consciente del lienzo:

| Dónde | Tamaño | |
|---|---|---|
| `ui/overlays/LeftRail.tsx:67` | 200×200 | ✅ |
| `engine/interaction.ts:579` | 200×50, fuente 24px | ✅ |
| `ui/panels/AssetLibrary.ts:406,429` | 300×200 y 400×250 | ✅ |
| `state/store.ts:1776` | 500×700 | ✅ |

Se centraliza en `engine/nodeDefaults.ts` (factor 0.6 por debajo de `lg`).
**Cualquier punto de creación nuevo debe usar `scaled()`**, o volvemos a tener
cuatro criterios distintos.

### M2 ✅ Doce herramientas en una columna vertical

`ui/overlays/LeftRail.tsx`

Ocupaba **464px de alto** flotando sobre el lienzo y tapaba todo el lado
izquierdo del dibujo.

**P1 cerrado.** `MobileToolStrip` es una tira horizontal sobre la barra de
navegación, en la zona del pulgar: cuatro primarias (Seleccionar, Mover, Texto,
Forma) a 44px cada una, y "Más" abre una rejilla con las otras siete. Doce no
caben en 390px sin bajar del mínimo táctil.

La lista y el comportamiento se extrajeron a `pizarronTools.tsx`, compartido
por el rail de escritorio y la tira móvil: **añadir una herramienta la hace
aparecer en las dos** sin tocar nada más.

Con algo seleccionado la tira se oculta y manda el panel contextual, que ocupa
esa misma franja. Apilarlos obligaría a mover la tira cada vez que el panel
cambia de altura, y un control que se desplaza bajo el dedo es peor que uno que
desaparece: tocar el lienzo deselecciona y la tira vuelve.

### M3 ✅ El presupuesto de espacio no cuadra

Medido en iPhone 14 Pro (390×844):

```
844 pantalla − 59 área segura sup. − 34 inf. − 60 barra de nav = 691px útiles
```

Con la barra de zoom (50px), el rail (464px flotando) y el panel contextual
(hasta 287px), al lienzo le quedaban **≈354px de 691**. La mitad de la
pantalla en controles.

**Cerrado con P0, P1 y P2.** Sin selección, el lienzo tiene ahora la pantalla
entera menos la tira de herramientas (58px) y la barra de zoom (159px de ancho,
centrada arriba). Medido a 390×844:

| Antes | Ahora |
|---|---|
| Barra superior a casi todo el ancho | 159px, centrada |
| Rail de 464px de alto tapando el lado izquierdo | tira de 58px abajo |
| Panel contextual siempre presente | solo con selección |
| **Lienzo ≈354px de 691** | **lienzo ≈630px de 691** |

En P2 se ocultaron en móvil los bloques de **Posición** y **Alinear** de la
barra superior: operan sobre la selección y ya viven en el panel contextual.
Tenerlos en dos sitios era la misma trampa de siempre.

### M4 ⬜ `MiniToolbar` sigue vivo en escritorio con lógica solapada

499 líneas que repiten propiedades del Inspector (color, tamaño, efectos,
posición). En móvil ya no se monta, pero en escritorio conviven dos fuentes de
verdad para el mismo nodo. Candidato a unificación futura.

---

### B0 ✅ Botón de depuración en producción

`Inspector.tsx` mostraba **"Inject 2×2 Grid"** en rojo, con el comentario
`{/* DEBUG: Structure for Shapes (Preserved) */}`. Inyectaba una rejilla fija
con celdas 'A','B','C','D'. Herramienta de desarrollo que se quedó a la vista
del usuario. Eliminado; `updateStructure` se sigue usando en `TextEditor`, así
que no queda código huérfano.

### B0b ✅ Encuadre al crear o abrir una pizarra

Nacían con `zoom: 1` —medida de monitor—, así que en un móvil solo se veía una
esquina y parecía que el contenido se hubiera añadido gigante.

Ya existía `store.fitContent()`, mejor escrito que un encuadre nuevo: acota el
zoom entre 0.1 y 1.2. **No se duplicó**; se corrigió para móvil (margen de
100→24px, que sobre 390px se comía más de la mitad, y descuento del alto de las
barras) y se llamó en los dos flujos que no lo hacían: añadir tablero y abrir
pizarra guardada.

### B0c ✅ Diálogo de pizarras con medidas de escritorio

`PizarraManager` medía **900×600 fijos** con barra lateral de 256px, sobre una
pantalla de 390. Ahora ocupa el ancho disponible, apila barra sobre contenido, y
la barra pasa de columna a tira horizontal deslizable: **de 197px de alto a
61px**, devolviendo 136px al contenido.

## 🟡 BAJOS

### B1 ✅ Overlays fuera del viewport
Inspector en `x=415` sobre pantalla de 390; clamp de `MiniToolbar` calculado
con un ancho fijo de 560px. Corregido.

### B2 ✅ Área segura de iOS
`TopBar` pisaba el reloj y la batería. Corregido con `env(safe-area-inset-top)`.

### B3 ⬜ `eval` en el analizador de ingredientes
`src/features/ingredients/ingredientParser.ts:40` — el build avisa en cada
compilación. Riesgo de seguridad y estorbo para la minificación.

### B4 ⬜ Gráficas sin altura resuelta
Avisos de Recharts `width(-1) and height(-1)`. Cosmético pero ruidoso.

### B5 ✅ Sin gestos nativos

**P4 cerrado.** `useCanvasGestures` añade pellizcar-para-zoom y desplazamiento
con dos dedos.

Dos detalles que lo hacen convivir con la edición:
- **Solo actúa con dos dedos.** Con uno, el evento llega intacto al
  `interactionManager`, que es quien selecciona, arrastra y dibuja.
- `passive: false` es obligatorio. Sin él el navegador ignora el
  `preventDefault` y superpone su propio zoom de página al nuestro.

El punto del mundo bajo los dedos se mantiene fijo durante el zoom; sin ese
cálculo el lienzo se escapa hacia una esquina.

---

### P3 ✅ Modo consulta

En móvil, Pizarrón **arranca en consulta**: sin tira de herramientas ni panel
contextual, con la herramienta activa en `hand` para que un toque desplace el
lienzo en vez de crear o arrastrar. Un botón alterna a edición.

La apuesta es que el uso mayoritario en barra es mirar —el escandallo, la
carta, el tablero de la semana— y no editar con el dedo. Si resulta falsa,
cambiar el valor inicial de `enConsulta` en `PizarronRoot` la invierte.

Se implementa con estado local y cambio de herramienta, **sin tocar el motor de
interacción**: nada que revertir si hay que deshacerlo.

---

## Cómo trabajar aquí sin romper nada

1. **El umbral es `lg` (1024px).** Todo lo móvil se gatea ahí. Ver `CONTEXT.md`.
2. **Nada flotante por debajo de `60px + env(safe-area-inset-bottom)`**: ahí
   vive la barra de navegación de la app.
3. **Overlays posicionados por JS**: el clamp debe usar el ancho **real**, no
   una constante.
4. **Nodos nuevos**: siempre por `scaled()` de `engine/nodeDefaults.ts`.
5. **El Inspector no se duplica.** Tiene 840 líneas de paneles por tipo. Para
   reutilizarlo, su prop `embedded` omite el contenedor flotante — que es como
   lo consume `MobileContextPanel`.

## Qué NO tocar sin hablarlo

- **`engine/renderer.ts` y `engine/interaction.ts`**: son el núcleo del lienzo.
  Vienen de una fusión reciente con 10 archivos en conflicto resueltos por
  criterio (commit `915c957`). Punto de retorno: etiqueta `pre-merge-frosty`.
- **`state/store.ts`**: fuente de verdad del lienzo y de la sincronización con
  Firestore.

---

# Segunda ronda · 2026-08-03

Tras cerrar P0–P4 y probarlo con usuarios reales. La primera ronda arregló
**dónde** estaba cada cosa; esta mira **qué falta y qué sobra**.

Módulo: **62 archivos, 16.524 líneas**. Los cuatro mayores concentran el
grueso: `renderer.ts` (2152), `store.ts` (1827), `interaction.ts` (1525),
`Inspector.tsx` (844).

## 🔴 GRAVES

### G4 ✅ No hay deshacer en móvil

`undo` y `redo` **existen en el store** y funcionan, pero no están expuestos en
`MobileToolStrip` ni en `MobileContextPanel`: cero menciones en ambos.

En un lienzo táctil esto no es una comodidad, es una red de seguridad. Un
arrastre accidental con el pulgar mueve un nodo y **no hay forma de volver
atrás**. En escritorio se salva con Ctrl+Z, que en un teléfono no existe.

**Resuelto.** Deshacer y rehacer están ahora en los dos estados: en la tira de
herramientas cuando no hay selección, y en las acciones rápidas del panel
cuando la hay —que es justo cuando más falta hacen, porque es editando cuando
se estropea algo, y ahí la tira se oculta.

El store no exponía si había algo que deshacer (`history` es privado), así que
se añadieron `canUndo()` y `canRedo()`: los botones se atenúan en vez de
mentir. La tira pasa de 5 a 7 botones, 330px de los 374 disponibles.

### G5 ⬜ La biblioteca ocupa el 82% de la pantalla

`ui/panels/LibrarySidePanel.tsx:179`

```
absolute top-14 left-0 bottom-0 w-80
```

320px de ancho sobre 390, y `top-14` **no reserva el área segura**, así que en
iPhone arranca bajo el reloj. Es una de las herramientas de la tira ("Biblioteca")
y hoy es inusable en móvil.

Debería seguir el patrón ya establecido: hoja inferior con `BottomSheet`, como
el resto.

### G3 ⬜ `isMobileMode` sigue muerto *(heredado de la primera ronda)*

Ahora **sí es activable**: ya existen los overlays móviles que faltaban
(`MobileToolStrip`, `MobileContextPanel`, `ModoConsultaToggle`). Limpiar esa
rama muerta —en `PizarronRoot` y en `renderer.ts:1579`— dejaría un solo
mecanismo de detección en vez de dos.

## 🟠 MEDIOS

### M5 ✅ Dos umbrales distintos para el doble toque

`engine/interaction.ts:365` usa **400ms** y `:542` usa **300ms**, en el mismo
archivo y para el mismo gesto. Según por dónde entre el evento, el doble toque
se detecta o no. Explica que a veces "cueste" seleccionar.

**Resuelto:** una sola constante `DOBLE_TOQUE_MS = 350`, punto medio entre los
dos valores que había.

### M6 ⬜ Dos componentes que no monta nadie

`ShapeSelector.tsx` y `ColorPickerModal.tsx` no aparecen referenciados en
ningún sitio. O son código muerto —y se borran— o son función perdida que
alguien escribió y nunca conectó, como pasó con `isMobileMode` y con
`editingImageId`. **Hay que decidir cuál de las dos cosas es** antes de que se
sumen a la lista de fantasmas del módulo.

### M4 ⬜ `MiniToolbar` duplicado en escritorio *(heredado)*

499 líneas repitiendo propiedades del Inspector. En móvil ya no se monta, y
tras esta ronda el Inspector cubre además negrita, cursiva, espaciado y
mayúsculas. **La duplicación en escritorio ya no aporta nada**: candidato claro
a eliminación, no solo a unificación.

## 🟡 BAJOS

### B6 ⬜ Restos de medidas de escritorio
`BoardInspector` con `h-[100px]`, `TopBar` con `w-[320px]` en la lista de
tableros. Menores, pero conviene barrerlos.

### B7 ⬜ Sin atajos táctiles equivalentes al teclado
En escritorio hay atajos (V, T, R, L, P, Espacio). En móvil no hay equivalente
para nada. Un pulsado largo sobre el lienzo podría abrir un menú rápido.

---

## Lo que yo haría, por orden

1. **G4 — deshacer.** Coste bajo, valor alto: la función existe. Es lo único de
   esta lista que cambia la sensación de seguridad al usar el lienzo con el dedo.
2. **M5 — unificar el umbral.** Una constante. Explica una fricción que el
   usuario ya ha reportado dos veces.
3. **G5 — la biblioteca a hoja inferior.** Devuelve una herramienta entera al
   móvil, con un patrón que ya está construido y probado.
4. **M6 — decidir sobre los dos componentes huérfanos.** Antes de que nadie
   construya encima de ellos creyendo que funcionan.
5. **M4 y G3 — limpieza.** Quitar `MiniToolbar` y la rama muerta de
   `isMobileMode`. Menos código y una sola fuente de verdad.

> **Advertencia sobre el orden:** los puntos 1 a 3 se pueden hacer sin tocar el
> motor. Los puntos 4 y 5 sí lo tocan, y `renderer.ts` e `interaction.ts` vienen
> de una fusión con conflictos resueltos por criterio. Punto de retorno:
> etiqueta `pre-merge-frosty`.
