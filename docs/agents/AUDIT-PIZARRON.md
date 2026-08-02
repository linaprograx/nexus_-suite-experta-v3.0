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

### B5 ⬜ Sin gestos nativos
No hay pellizcar-para-zoom ni desplazar con dos dedos. El zoom exige apuntar a
los botones `−` / `+`. Es la fase **P4**.

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
