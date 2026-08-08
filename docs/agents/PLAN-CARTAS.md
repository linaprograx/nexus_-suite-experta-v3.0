# Plan — Las cartas como entidad

**Creado:** 2026-08-08 · **Estado:** aprobado el enfoque; E1 pendiente de luz verde
porque toca datos reales.

---

## Qué hay hoy

| Pieza | Dónde | Qué es |
|---|---|---|
| Carta activa | `users/{uid}/menu_items` | Lista **plana** de entradas: `recipeId`, `nombre`, `precioVenta`, `costSnapshot`, `marginSnapshot`, `addedAt` |
| Marca "En carta" | `estado` de la receta | Un valor más del desplegable ESTADO |

**Dos problemas de fondo:**

1. **La carta no existe como cosa.** Hay una lista de recetas publicadas, y solo
   una. No tiene nombre, ni concepto, ni fecha, ni forma de archivarse. Por eso
   el fundador acabó escribiendo *"Menu de cocteles DRINK YOUR GAME"* en el campo
   **PREPARACIÓN de una receta**: no había ningún otro sitio donde ponerlo. Eso
   es la prueba de que falta la entidad, no una función.
2. **Dos fuentes de verdad** para lo mismo: el `estado` de la receta y la
   pertenencia a `menu_items`. Pueden discrepar, y es el error que más caro ha
   salido en este proyecto.

## Qué se quiere

Decidido con el fundador:

- Una receta **puede estar en varias cartas** (la de verano y la de primavera).
  Eso descarta guardar la pertenencia dentro de la receta: sería una sola.
- Varias cartas coexistiendo: la de ahora, la de hace seis meses, la de hace un año.
- **Exportar la carta entera** con el diseño de la ficha actual: portada con
  nombre, concepto, frases gancho, fecha y coste medio, y detrás una ficha por
  cóctel. Es el empaquetado del recetario, no un listado.
- El botón "Carta" **filtra Recetas** a la carta activa. Recuerda el filtro
  mientras la app está abierta; al cerrarla, vuelve a "todas".
- Si al exportar faltan título o concepto, **se piden en ese momento**.

## Entregas

### E1 · La carta como entidad, y migración ⬜ **toca datos reales**

- Colección `users/{uid}/cartas/{cartaId}`: `nombre`, `concepto`, `fecha`,
  `estado` (`activa` | `archivada`), `createdAt`.
- Cada entrada de `menu_items` gana `cartaId`.
- **Migración**: las entradas actuales pasan a una carta creada al efecto. Nada
  se borra ni se mueve de sitio; solo se les añade un campo.
- El `estado: 'En carta'` de la receta **se deja donde está** y deja de tratarse
  como verdad. Retirarlo es otra entrega, cuando esté claro que nada lo lee.

> Es la única entrega que escribe en datos existentes. Conviene hacerla con el
> usuario delante y poder comprobar el resultado inmediatamente.

### E2 · Editar la carta ⬜

Nombre, concepto, fecha y estado, desde el panel que hoy muestra "Carta activa".
Es lo que hoy no existe y obliga a usar el campo de preparación.

### E3 · El filtro de alcance ⬜

El botón "Carta" alterna entre todas las recetas y las de la carta activa.

- **Memoria de sesión**, no persistente: se conserva al moverse por la app y se
  pierde al cerrarla. Pedido explícito.
- **Señal visible** de que está puesto: el botón marcado y el contador diciendo
  "8 de 15 · en carta". Sin eso repetimos lo de la capa de Costes: filtrar sin
  avisar se lee como "faltan recetas".
- Una forma obvia de quitarlo sin volver a buscar el mismo botón.

### E4 · Exportar una carta ⬜

- `printRecipeCard` pasa de recibir **una receta** a recibir **una lista**.
  Exportar una sola se convierte en el caso de una lista con un elemento: **un
  solo camino, no dos que se desincronicen**.
- Portada: nombre, concepto, fecha, número de recetas y coste medio.
- Detrás, una ficha por cóctel con el diseño actual.
- Si falta nombre o concepto, se piden antes de generar.

### E5 · Varias cartas ⬜

Crear, archivar y cambiar cuál es la activa. Llega la última a propósito: hasta
que E1–E4 no funcionen sobre una, tener varias solo multiplica los fallos.

## Orden y por qué

E1 desbloquea todo lo demás, y E4 es lo que el fundador más quiere —la hoja de
producción y el recetario empaquetado—, pero depende de que la carta exista.

E3 es independiente y barata: podría adelantarse si interesa ver resultado
pronto, filtrando por la carta migrada.

## Riesgos

- **E1 escribe en `menu_items`.** Solo añade un campo, no borra ni reescribe
  nada, pero es el único punto con riesgo real sobre datos del usuario.
- **La doble fuente de verdad** (`estado` vs pertenencia) seguirá viva durante
  todo el plan. Hay que tener claro cuál manda —la pertenencia— y no empezar a
  leer la otra a medias.
