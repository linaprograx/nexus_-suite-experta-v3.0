# Auditoría de Grimorio

**Fecha:** 2026-08-08 · **Autor:** Claude Code + hallazgos del fundador
**Actualizado:** tras cerrar el grupo de GRAVES del flujo de Recetas.
**Alcance:** **solo Grimorio.** Pizarrón, Cerebrity y el resto quedan fuera.
**Método:** lectura de código + medición en la app **en producción, con sesión
real**, a 390×844. Cada hallazgo lleva archivo:línea y, cuando existe, la cifra
medida.

> **Cobertura honesta.** Lo auditado a fondo es el flujo de **Recetas** (listado,
> ficha, crear/editar, selector de ingredientes) y la barra de herramientas
> común. **Inventario y Mercado están auditados solo en superficie**: no se
> pulsaron sus botones de acción (COMPRAR, conteo físico, eliminar) porque
> operan sobre datos reales del usuario. Ver "Lo que falta por auditar".

---

# GRUPO 1 · GRAVES — impiden completar una tarea

## ✅ R1 · El selector de ingredientes no se podía scrollear

`src/components/ui/Autocomplete.tsx` — **regresión mía del 2026-08-06**.

`onPointerDown` + `preventDefault()`: en táctil `pointerdown` se dispara **al
posar el dedo**, así que arrastrar para ver más opciones seleccionaba la de
debajo; y el `preventDefault()` **cancelaba el gesto de scroll del navegador**.

Ahora selecciona en `onClick`, que solo llega si el navegador ha decidido que
fue un toque y no un arrastre — justo la distinción que hacía falta.

**Verificado en producción:** 18 opciones para "vodka", lista scrolleable, y un
arrastre simulado sobre una opción ya **no** cambia el valor del campo.

## ✅ R2 · La lista salía fuera de pantalla y no se leía

Se fijaba bajo el campo sin medir el espacio. Medido antes: la lista iba de 630
a **870 sobre un viewport de 844**, sin contar la barra inferior.

Dos correcciones:
- **Posición**: mide el hueco real, se abre **hacia arriba** cuando abajo no
  cabe, y acota su altura.
- **Ancho**: toma el de la **fila** del ingrediente (`data-fila-ingrediente`), no
  el del campo. Medido: el campo tiene **48px** y la fila **306px** — por eso los
  nombres largos del catálogo eran ilegibles.

**Verificado:** lista de 306px de ancho, dentro de la pantalla, `touch-action:
pan-y`.

## ✅ R3 · No se podía introducir el precio de venta

Modal y barra de navegación estaban **ambos en `z-50`** y ganaba la barra por
montarse después: tapaba el pie del modal, que es donde se introduce el precio.

El modal sube a `z-[60]` y además **reserva el alto de la barra**, para que el
pie quede a la vista y no solo por delante.

## ✅ R4 · El modal de edición se abría detrás de la ficha

`GrimoriumView.tsx` — `onEdit` abría el modal sin cerrar la hoja de detalle.
Ahora limpia `selectedRecipeId` primero.

> **Conviértelo en invariante:** una sola superficie modal a la vez. Si no,
> reaparecerá en ingredientes, stock y pedidos.

## ✅ R5 · El título de la hoja mentía sobre su contenido

Con una capa activa, la hoja decía "Ficha de receta" y mostraba la calculadora
de rentabilidad. Ahora el título refleja lo que hay dentro.

> **Corrección de un hallazgo anterior:** dije que el botón de capa no marcaba su
> estado. **Es falso** — sí lo hace (pastilla blanca). Mi medición leyó un nodo
> obsoleto porque `LayerToggle` está definido *dentro* de `GrimoriumToolbar`, y
> React lo remonta en cada render. Eso último sí conviene arreglar, pero es otra
> cosa y no es grave.

## ⬜ R6 · El Batcher (pestaña "Producción") no funciona

Reportado por el fundador: **antes funcionaba**. Debe generar lotes a partir de
una receta, con dilución del 20% cuando el cóctel se sirve directo.

Pedido explícito, y es lo más valioso de este punto:
- Poder **seleccionar varias recetas** a la vez.
- **Exportar el resultado** con el mismo cuidado que la ficha de receta: una
  hoja de producción limpia, delimitada por receta, con instrucciones y medidas.
  Es lo que convierte esto en algo que el equipo usa en barra.
- Renombrar la pestaña "Producción" → **"Batcher"**.

**Sin diagnosticar todavía.** Primer paso: averiguar si dejó de funcionar o
nunca se conectó — este proyecto tiene ya siete casos de código escrito y jamás
enchufado.

---

# GRUPO 2 · MEDIOS — funcionan, pero mal o a medias

## ⬜ R7 · Las capas no muestran nada hasta tocar la pestaña de borde

Al activar **Costes** o **Zero Waste** no ocurre nada visible: hay que
seleccionar una receta o tocar la pestaña oculta del borde derecho para que
aparezca el panel. Quien no sepa que esa pestaña existe, concluye que el botón
está roto.

**Arreglo natural:** que activar una capa **abra su panel** en móvil.

## ⬜ R8 · "Rentabilidad" no aporta nada sobre la ficha

Muestra coste, beneficio y margen — lo mismo que ya se ve en la receta. Hay que
enriquecerla para que justifique su sitio: comparación con el coste real de
compras, desviación, histórico de precio, sensibilidad del margen al PVP.

**Requiere decidir con el fundador qué debe responder** esa pantalla.

## ⬜ R9 · "Carta" no filtra las recetas

Hoy abre una ventanita con las recetas publicadas y al cerrarla no cambia nada.
Lo pedido: que funcione como **un espacio de trabajo** — al activarlo, Recetas
muestra solo lo que está en carta.

**Plan pendiente de aprobación** (ver abajo).

## ⬜ R10 · Dos "×" simultáneos en la hoja de detalle

El aspa de la hoja y el de la herramienta incrustada, uno junto al otro. No está
claro cuál cierra qué.

---

# ⚠️ HALLAZGO TRANSVERSAL · `calc()` inválido en toda la app

En `calc()`, el `+` **exige espacios a ambos lados**. Sin ellos el CSS es
inválido y el navegador **descarta la declaración entera, sin avisar**. En
Tailwind esos espacios se escriben con guiones bajos: `calc(60px_+_env(...))`.

Había **seis** casos escritos sin espacios. Cinco corregidos:

| Archivo | Qué reservaba |
|---|---|
| `CollapsedDock.tsx:64` | hueco sobre la barra de navegación |
| `LibrarySidePanel.tsx:179` | ídem |
| `AvatarCoreView.tsx:612` | ídem |
| `StockInventoryPanel.tsx:218` | posición de un desplegable |
| `RecipeFormModal.tsx` | área segura del modal — **era el fallo de la cabecera bajo el reloj** |

**El sexto NO se ha tocado, a propósito:** `src/App.tsx:146`, el relleno
superior de `<main>`. Es el área segura de **todas** las vistas. Lleva caído
desde siempre, y la app entera se ha ido ajustando encima de esa realidad:
corregirlo empuja ~59px hacia abajo cada pantalla en un iPhone y además chocaría
con el hueco que Grimorio ya reserva para su franja fija.

No es algo que deba entrar de rebote en otro arreglo. **Hay que hacerlo con el
teléfono delante**, revisando vista por vista, y ajustando a la vez el hueco de
la franja para que no se sumen dos reservas.

---

# GRUPO 3 · BAJOS

## ⬜ R11 · Controles sin etiqueta accesible

El botón de cerrar del modal y dos botones de la hoja de detalle no tienen texto
ni `aria-label`.

## ⬜ R12 · `LayerToggle` se define dentro de `GrimoriumToolbar`

`GrimoriumToolbar.tsx:71`. React lo trata como un tipo de componente nuevo en
cada render y lo **remonta entero** cada vez. Coste innecesario y fuente de
rarezas al medir el DOM.

## ⬜ R13 · Zero Waste Lab no genera nada

Depende del `ai-gateway`, que no está desplegado. **No es un fallo de Grimorio**;
se cierra cuando se despliegue el gateway.

## ⬜ R14 · Código muerto del módulo

- `src/features/ingredients/useIngredients.ts` — duplicado, sin importar.
- `RecipeToolbar.tsx` e `IngredientToolbar.tsx` — importados y nunca renderizados.

---

# Plan propuesto para R9 · "Carta" como espacio de trabajo

**Pendiente de tu aprobación.**

**La idea:** que "Carta" deje de ser una ventanita informativa y pase a ser un
**filtro de alcance** sobre Recetas — despeja el listado y deja solo aquello en
lo que estás trabajando.

**Por qué así y no como una vista nueva:** Recetas ya tiene buscador, categoría y
estado. Una vista aparte duplicaría los tres y divergirían, que es el error que
más caro ha salido en este proyecto. Un filtro más reutiliza todo lo que existe.

**Los pasos:**

1. Un estado de alcance (`todas` | `carta`) junto a los filtros que ya hay, no en
   un sitio nuevo.
2. El botón "Carta" alterna ese alcance. El modal actual sigue disponible, pero
   deja de ser lo único que hace el botón.
3. **Señal clara de que el filtro está puesto**: el botón marcado y el contador
   diciendo "8 de 15 · en carta". Sin eso repetimos el problema de la capa de
   Costes: filtrar sin avisar se lee como "faltan recetas".
4. Una forma obvia de quitarlo, sin volver a buscar el mismo botón.

**Riesgo:** bajo. Es un filtro más sobre una lista ya filtrada; si falla, muestra
de más, nunca de menos.

**Lo que hay que decidir contigo:** si al activarlo debe además **fijar la vista**
en carta al volver a entrar en Grimorio, o si debe empezar siempre en "todas".

---

## Lo que falta por auditar

Para no tocar datos reales del usuario, **no se pulsaron** los botones de acción
de Inventario ni de Mercado. Queda pendiente, y conviene hacerlo con una cuenta
de prueba o aceptando el efecto:

- **Mercado**: COMPRAR, alta de proveedor, "Normalizar Catálogo", importación
  CSV, selección múltiple y borrado.
- **Inventario**: conteo físico, registro de consumo/merma/ajuste, reglas de
  stock y "Pedir Todo".
- **Recetas**: duplicar, eliminar, publicar en carta, producción, y los flujos
  de importación (PDF Pro, TXT).
- **Todo lo anterior en escritorio**, que aquí solo se ha mirado a 390px.

## Orden sugerido

1. **G1** — es lo que más estorba a diario y es una regresión reciente.
2. **G2** — mismo componente, misma sesión, y cierra "el selector va mal".
3. **G3** — el más desconcertante para quien lo sufre, aunque no rompa datos.
4. **M1** y **M2** — baratos.
5. El resto de la auditoría (Inventario y Mercado a fondo).
