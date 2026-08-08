# Auditoría de Grimorio

**Fecha:** 2026-08-08 · **Autor:** Claude Code
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

## 🔴 GRAVES

### G1 ⬜ El selector de ingredientes no se puede scrollear: tocarlo selecciona

`src/components/ui/Autocomplete.tsx:151`

```tsx
onPointerDown={(e) => { e.preventDefault(); handleSelect(item); }}
```

Dos consecuencias, ambas medidas:

1. En táctil, `pointerdown` se dispara **al posar el dedo**. Intentar arrastrar
   para ver más opciones **selecciona la que hay debajo del dedo**.
2. `preventDefault()` sobre `pointerdown` **cancela el gesto de scroll del
   navegador**. La lista es literalmente inmanejable: se midieron **50 opciones**
   con `scrollHeight > clientHeight` — hay contenido que scrollear y no se puede.

**Es una regresión mía del 2026-08-06.** Se cambió `onMouseDown` por
`onPointerDown` para "cubrir ratón y dedo por el mismo camino"; en ratón
funciona, en dedo rompe el scroll.

**Arreglo correcto:** seleccionar en un evento de *fin* de interacción (`click`,
o `pointerup` comprobando que el dedo no se ha desplazado), nunca en el de
inicio. Y no llamar a `preventDefault()` en `pointerdown` dentro de una lista
scrolleable.

### G2 ⬜ La lista del selector se sale de la pantalla

`src/components/ui/Autocomplete.tsx:143-147` — la lista se posiciona
`position: fixed` en `top: rect.bottom + 4`, **sin acotar al viewport y sin
voltear hacia arriba** cuando no cabe.

Medido con el campo de ingrediente del modal de receta a 390×844:

| | |
|---|---|
| Campo de texto | acaba en **626** |
| Lista (`max-h-60` = 240px) | de **630** a **870** |
| Alto del viewport | **844** |
| **Fuera de pantalla** | **26px**, y eso **sin contar** la barra inferior (60px + área segura) |

Es la otra mitad de "sale fuera de lugar". Con el campo un poco más abajo, la
lista queda casi entera fuera.

**Arreglo:** acotar al viewport y voltear hacia arriba cuando el espacio inferior
sea menor que la altura de la lista. Ya existe precedente en el proyecto: el
hallazgo B1 de `AUDIT-PIZARRON.md` fue exactamente esto.

### G3 ⬜ La capa "Costes" secuestra la ficha de receta y esconde "Editar"

`src/views/GrimoriumView.tsx` — las vistas se pintan bajo
`activeLayer !== 'optimization'`.

Con la capa de Costes activa, al abrir una receta la hoja se titula **"CACAO ·
Ficha de receta"** pero su contenido es la **Calculadora de Rentabilidad**. La
receta no está, y **el botón "Editar" desaparece del DOM**: desde el móvil no
hay forma de editar una receta mientras la capa esté encendida.

**Causalidad verificada:** apagando "Costes", `Editar` vuelve a existir y a ser
visible en la misma sesión, sin recargar.

Lo que lo convierte en grave no es la función, es que **no hay ninguna señal de
que la capa esté activa**: el botón devuelve `aria-pressed="false"` después de
pulsarlo y no cambia de aspecto. El usuario ve "Ficha de receta" con otro
contenido dentro y no tiene forma de deducir por qué ni cómo salir.

**Tres cosas distintas que arreglar:**
1. Que el botón refleje su estado (`aria-pressed` real + marca visual).
2. Que el título de la hoja diga lo que hay dentro, no "Ficha de receta".
3. Decidir si una capa transversal debe poder vaciar el detalle. Lo razonable es
   que el detalle siga siendo el detalle y la capa añada, no sustituya.

---

## 🟠 MEDIOS

### M1 ⬜ La barra de navegación tapa el pie del modal

Modal de receta y barra inferior están **ambos en `z-50`**
(`RecipeFormModal.tsx:245` y `FloatingBottomNav`), y la barra se monta después,
así que gana.

Medido: la tarjeta del modal va de **34 a 810**; la barra empieza en **784**.
Le tapa **26px**, y en un iPhone real más, porque la barra crece con
`env(safe-area-inset-bottom)`.

**Arreglo:** un escalafón de z-index explícito. Un modal debe estar por encima
de la navegación, y hoy solo lo decide el orden de montaje — que es frágil.

### M2 ⬜ El modal de receta no se cierra con Escape

`RecipeFormModal.tsx` no registra ningún manejador de teclado. Cierra el clic en
el fondo (`:247`) y el botón de la cabecera (`:255`), pero no la tecla. En
escritorio, donde se rellena un formulario largo con teclado, se echa en falta.

### M3 ⬜ Controles sin etiqueta accesible

El botón de cerrar del modal (`RecipeFormModal.tsx:255`) es un icono sin texto
ni `aria-label`. En la hoja de detalle se encontraron **dos botones sin ninguna
etiqueta**. Además de accesibilidad, dificulta las pruebas automatizadas: no hay
forma de referirse a ellos.

### M4 ⬜ Dos "×" simultáneos en la hoja de detalle

Con la capa activa conviven el aspa de la hoja y el aspa de la herramienta
incrustada, uno encima del otro. No está claro cuál cierra qué.

---

## 🟡 BAJOS

### B1 ⬜ Persistencia de la capa activa — **por confirmar**

La capa de Costes seguía encendida tras una navegación con recarga forzada, pero
**no** hay nada en `localStorage` que lo explique. No está confirmado si
sobrevive a un arranque en frío. Merece comprobarse: si sobrevive, el usuario
puede abrir la app días después y encontrarse Grimorio "roto" sin saber por qué.

### B2 ⬜ Código muerto en el módulo

Ya anotado en `HANDOFF.md`, se repite aquí porque es de Grimorio:

- `src/features/ingredients/useIngredients.ts` — duplicado de
  `src/hooks/useIngredients.ts`, **sin importar por nadie**.
- `RecipeToolbar.tsx` e `IngredientToolbar.tsx` — importados en
  `GrimoriumView.tsx` y **nunca renderizados**.

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
