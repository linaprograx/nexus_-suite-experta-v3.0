# Auditoría de uso móvil

**Fecha:** 2026-08-08 · **Origen:** uso real del fundador durante tres días en
el teléfono. **Estado:** todos los hallazgos **abiertos**.

Esto no es una lectura de código: son síntomas observados usando la app en
barra. Cada uno se ha rastreado después hasta **archivo:línea**, y donde la
causa está confirmada se dice; donde es una hipótesis, se dice también.

> **El encargo no es tapar estos cinco síntomas.** Son las **puertas de
> entrada** a una auditoría completa de interacción móvil: navegación, modales,
> gestos, estados visuales, rendimiento y respuesta táctil. Ver el mandato al
> final.

---

## Orden de ejecución

| # | Hallazgo | Prioridad | Causa | Coste |
|---|---|---|---|---|
| **A1** | Desactivar 2 secciones deja sin menú, sin modo oscuro y sin cerrar sesión | 🔴 **P0** | **Confirmada** | Bajo |
| **A2** | Recetas: el modal de edición se abre **detrás** del detalle | 🟠 P1 | **Confirmada** | Bajo |
| **A3** | Grimorio: parpadeo al hacer scroll | 🟠 P1 | Hipótesis fuerte | Medio |
| **A4** | Inventario: lentitud y retardo entre toque y respuesta | 🟡 P2 | Hipótesis | Medio |
| **A5** | Pizarrón: al redimensionar un texto, la letra no acompaña | 🟡 P2 | Contrato sin definir | Medio |
| **A6** | Auditoría de interacción móvil completa | 🟡 P2 | — | Alto |

A1 y A2 son de una sesión corta y arreglan un bloqueo funcional; van primero
por eso, no por dificultad. A3 va antes que A4 porque un parpadeo se percibe
como app rota, mientras que un retardo se percibe como app lenta.

---

## 🔴 A1 — Desactivar dos secciones deja al usuario sin menú global

**El más grave: deja controles del sistema inaccesibles, sin forma de volver.**

Al desactivar pestañas desde **Personal → Configuraciones**, las que quedan
ocupan su hueco. Con **dos desactivadas desaparece el botón "Más"** de la barra
inferior — y con él **modo oscuro** y **cerrar sesión**, que solo viven dentro
de esa hoja.

**Causa confirmada** — `src/ui/mobile/components/FloatingBottomNav.tsx:103-107`:

```
const all = [...visible, PERSONAL];
if (all.length <= MAX_SLOTS) return { primary: all, overflow: [] };
```

`APP_SECTIONS` tiene 6 entradas y `PERSONAL` se añade aparte: 7 destinos contra
`MAX_SLOTS = 5`. La cuenta sale sola:

| Secciones desactivadas | Destinos | ¿Hay overflow? | Botón "Más" |
|---|---|---|---|
| 0 | 7 | sí (3) | ✅ |
| 1 | 6 | sí (2) | ✅ |
| **2** | **5** | **no** | **❌ desaparece** |
| 3 | 4 | no | ❌ |

Y en `:144` el botón solo se pinta `{overflow.length > 0 && …}`. Sin overflow no
hay botón; sin botón no hay hoja; y el conmutador de tema (`:184`) y el cierre
de sesión (`:192`) están **dentro de esa hoja**, que es exactamente el sitio
donde los puso el comentario de `:92-94` porque en móvil no existe la barra
lateral.

**El error de fondo:** se trató "Más" como un **desbordamiento** cuando en
realidad es un **destino fijo**. Los controles globales quedaron colgando de una
condición que depende de cuántas secciones tenga activas el usuario.

**Comportamiento esperado.** La personalización de secciones **no puede alterar
los controles estructurales**. Modo oscuro, cerrar sesión y el acceso a Perfil
deben estar siempre alcanzables, con cualquier número de secciones activas —
incluidas las dos bloqueadas como mínimo.

**Dirección de arreglo** (a validar al implementar): "Más" se renderiza
**siempre** y ocupa su ranura, de modo que el reparto son 4 secciones + "Más"
fijo. Alternativa: mover tema y sesión a un sitio que no dependa de la barra.
Lo que **no** vale es dejarlos donde están y añadir un caso especial más.

**Criterio de aceptación:** con 0, 1, 2, 3 y 4 secciones desactivadas, modo
oscuro y cerrar sesión son alcanzables en ≤2 toques. Es una tabla de verdad de
cinco filas; recórrela entera.

---

## 🟠 A2 — El modal de edición de receta se abre detrás del detalle

**Flujo:** tocar una receta → se abre el detalle → pulsar **Editar**. El detalle
**no se cierra**, y el formulario aparece **por debajo**. Hay que cerrar el
detalle a mano para poder usar el formulario que estaba esperando detrás.

**Causa confirmada.** Son dos superficies de dueños distintos que nadie
coordina:

- El detalle es la **columna derecha**, y en móvil una hoja inferior. Su
  apertura es `detailOpen: !!selectedRecipe` — `src/views/GrimoriumView.tsx:634`.
- El formulario es un modal **global**, montado en `src/App.tsx:156-165` y
  gobernado por `uiStore` (`showRecipeModal` / `recipeToEdit`).

En `src/views/GrimoriumView.tsx:900`, el botón Editar hace
`onEdit={(r) => onOpenRecipeModal(r)}` y **nunca toca `selectedRecipeId`**
(declarado en `:201`). Así que el detalle sigue abierto por definición: su
condición de apertura no ha cambiado. El apilado es el resultado esperado del
código actual, no un fallo de z-index.

**Comportamiento esperado.** Al pulsar Editar: cerrar el detalle y abrir el
formulario. **Nunca dos superficies modales a la vez** en móvil.

**Dirección de arreglo.** Que `onEdit` limpie la selección antes de abrir el
modal es el arreglo de una línea. Pero conviene subirlo a **invariante**: en
móvil, abrir una superficie modal cierra la anterior. Si no, esto reaparece en
Ingredientes (`:922`) y en Pedidos (`:965`), que siguen el mismo patrón.

**Búscalo también en:** ingredientes, ítems de stock, pedidos, escandallo y
producción. Es el mismo par "hoja de detalle + modal global" repetido.

---

## 🟠 A3 — Parpadeo al hacer scroll en Grimorio

Al desplazarse por Grimorio, la interfaz **pestañea**.

**Hipótesis principal: realimentación entre el pliegue del título y el hueco que
reserva el contenido.** `src/hooks/useCabeceraPlegable.ts` decide plegar según
la **dirección** del scroll, con una tolerancia de 6px al temblor del dedo.
Plegar **reduce la altura de la franja** → cambia `--franja-alto` → el contenido
se recoloca → **`scrollTop` cambia sin que el dedo se mueva** → el manejador
vuelve a dispararse. Si ese salto pasa de 6px, se despliega, el contenido baja,
y otra vez. Un ciclo de este tipo se ve exactamente como un pestañeo.

Es coherente con la franja tal como se decidió — *"Una franja fija es UNA capa"*
en `CONTEXT.md` — y **con esa decisión intacta**: el problema no es la capa
única, es que su altura es a la vez causa y efecto del scroll.

**Sospechosos secundarios**, a descartar midiendo, no a ojo:

- `backdrop-blur-xl` sobre una capa fija: en Safari iOS repintar un blur en cada
  cuadro es caro y produce parpadeo por sí solo.
- Re-render de la lista entera en cada evento de scroll (el estado `plegada`
  vive arriba y arrastra a los hijos).
- Alguna capa de fondo que vuelva a `absolute` — ver la decisión *"Los fondos de
  pantalla completa van `fixed`"*.

**Cómo diagnosticarlo sin adivinar.** Registrar `scrollTop` y los cambios de
`plegada` durante un desplazamiento continuo: si `plegada` alterna sin cambio de
dirección del dedo, es la realimentación. Grabar la pantalla a cámara lenta
también distingue un parpadeo de repintado de un salto de layout.

**Direcciones posibles** (elegir con la medida en la mano): histéresis con dos
umbrales distintos para plegar y desplegar; congelar el pliegue durante el
reflujo que él mismo provoca; o que plegar no cambie la altura reservada, solo
la opacidad y el desplazamiento del título.

---

## 🟡 A4 — Inventario: lentitud y retardo táctil

Inventario **se siente lento** en el teléfono, y algunos botones tardan entre el
toque, la respuesta visual y la acción.

**Hipótesis.** El inventario **no se lee, se calcula**: `calculatedStockItems`
(`src/views/GrimoriumView.tsx:304`) deriva las existencias de `purchases` menos
`stock_movements` en un `useMemo`, y se consume desde cinco sitios distintos de
la vista (`:731`, `:875`, `:933`, `:1014`, `:1069`). Si alguna de sus
dependencias cambia de identidad en cada render —un array recreado, un objeto
literal— el memo se recalcula continuamente sobre cientos de compras, en el hilo
que también atiende el toque. Ese es el perfil clásico de "el botón tarda".

Suma: Mercado tiene **1367 productos** sin virtualización, y en móvil no hay
retroalimentación inmediata al pulsar, así que el retardo se percibe entero.

**Qué revisar, en este orden:**

1. **Perfilar antes de tocar nada.** React DevTools Profiler con la app en el
   teléfono: cuántos renders por toque y quién los provoca. Sin ese número,
   cualquier optimización es decorativa.
2. Estabilidad de las dependencias de los memos de la vista.
3. Retroalimentación táctil inmediata (estado de pulsado que no espere al
   trabajo): un botón que responde en 16ms se siente rápido aunque la acción
   tarde 200.
4. Virtualización de listas largas.
5. Lecturas de Firestore: cuántas suscripciones activas y si alguna se rehace.
6. Densidad: en móvil Inventario y Mercado deberían ser **filas densas, no
   tarjetas** — ya está anotado en `ROADMAP.md` M3 punto 4. Menos nodos en el
   árbol es también menos trabajo por cuadro.

---

## 🟡 A5 — Pizarrón: la letra no acompaña al redimensionar

Al arrastrar las esquinas de un cuadro de texto, **el contenedor cambia de
tamaño pero el texto no**.

**Ojo, hay historia.** El 2026-08-06 se cerró `G0b` en `AUDIT-PIZARRON.md`
exactamente con este enunciado: la ruta de selección única leía el tamaño
inicial de `initialResizeState`, un rectángulo **sin `fontSize`**. O bien es una
**regresión**, o bien el caso observado es **otro**: escalar desde la esquina
frente a redimensionar la caja desde un lado. **Compruébalo antes de arreglar
nada** — reabrir un hallazgo cerrado sin verificar es cómo se rompe lo que ya
funcionaba.

**Lo que falta de verdad es el contrato**, y por eso "no se siente natural":

- **Esquinas = escalar el elemento.** El texto crece y mengua con la caja.
- **Lados = redimensionar el contenedor.** El texto se mantiene y refluye.

Ambos comportamientos son legítimos; lo que no vale es que no se distingan. La
decisión debe verse en los tiradores: distinta forma o distinto cursor para cada
uno.

---

## 🟡 A6 — Mandato: auditoría de interacción móvil completa

Los cinco anteriores son la muestra, no el censo. Barrido sistemático, usando
los patrones que ya han fallado como guía:

- **Modales y hojas** — inventariar todas las superficies que se solapan y
  aplicarles el invariante de A2. Sospechoso por construcción: cualquier vista
  que tenga a la vez hoja de detalle y modal global.
- **Respuesta táctil** — 44px mínimo (M2, sin empezar) y estado de pulsado
  inmediato en todo control.
- **Scroll** — que ninguna vista fije `h-full`/`overflow` sin gatear tras `lg:`.
  Es el defecto que más veces ha vuelto en este proyecto.
- **Gestos** — que los de borde no compitan con el "atrás" del sistema en iOS.
- **Rendimiento** — perfilar Grimorio, Pizarrón y Cerebrity en un teléfono real,
  no en el simulador del navegador (M4).
- **Área segura** — `env(safe-area-inset-*)` y la regla de los 60px inferiores.
- **Estructura frente a personalización** — A1 no puede ser el único sitio donde
  una preferencia del usuario rompe la navegación. Revisar todo lo que se
  renderice condicionalmente a partir de preferencias.

**Condición previa:** un iPhone real con sesión iniciada. Varias de estas cosas
—áreas seguras, barras de Safari que se recogen, coste real del blur— **no
existen** en el navegador de escritorio estrechado, y ya hay pendientes de
verificación acumulados por eso mismo (`HANDOFF.md`).
