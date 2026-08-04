# Plan — Grimorio: Inventario móvil y Mercado como catálogo

**Creado:** 2026-08-03 · **Estado:** sin empezar
**Para:** una sesión dedicada. No mezclar con el trabajo de Pizarrón.

> Este documento es el punto de partida de esa sesión. Léelo entero, y antes de
> tocar código lee también `AGENTS.md`, `HANDOFF.md` y `CONTEXT.md`.

---

## Parte 1 · Bugs de datos en móvil

Reportados en un iPhone real, con sesión iniciada. **No son problemas de
maquetación**: los mismos datos que en escritorio se ven, en móvil no llegan.

### 1.1 Inventario muestra alertas en vez de los ~1300 productos

En escritorio el inventario lista unos **1300 productos**. En móvil, en su
lugar aparecen **alertas de vinculación** del tipo *"tienes que vincular los
ingredientes"*.

Como el layout ya se compactó y funciona (`StockInventoryPanel`), la sospecha
es que la vista móvil renderiza otra rama —un panel de alertas o un estado
vacío— en vez de la lista. **Primer sitio a mirar:** qué condiciona esa rama y
si depende de algo que en móvil no se resuelve (un `useMemo` con dependencias
distintas, una carga diferida, un `viewMode`).

### 1.2 El selector de ingredientes no lista nada

Al tocar *"selecciona el ingrediente"* en esa alerta, **no aparece ninguna
lista**. Puede ser el mismo origen que 1.1 —la colección no llega— o un panel
que en móvil se monta vacío.

Ruta de datos: `artifacts/{appId}/users/{uid}/grimorio-ingredients`.

### 1.3 Mercado sale vacío en móvil

En escritorio está lleno; en móvil, vacío. Mismo patrón que 1.1, y refuerza la
hipótesis de que hay una condición de carga o de render que distingue por
tamaño de pantalla donde no debería.

> **Antes de tocar nada:** comprobar en el navegador, a 390px y **con sesión
> iniciada**, si los datos llegan al cliente (¿está poblado el store/hook?) o si
> llegan y no se pintan. Esa bifurcación decide todo el trabajo posterior.

---

## Parte 2 · Mercado como catálogo de proveedores

Cambio de alcance, no un arreglo. Es el trabajo grande de esta sesión.

### La idea

La cuenta del creador —**lian931128@gmail.com**— pasa a ser **cuenta de
desarrollador**. Su Mercado alojará los catálogos de **todos los proveedores de
hostelería de Madrid**: productos, precios y unidades, obtenidos de los
catálogos publicados por cada proveedor.

### Lo que eso rompe

El Mercado actual está pensado para **decenas** de productos propios. Va a
recibir **miles**, repartidos en muchas categorías: cristalería, alcoholes, sin
alcohol, aperitivo, fruta, fresco, y bastantes más.

La búsqueda actual funciona, pero **buscar es lo que se hace cuando ya sabes
qué quieres**. Con un catálogo de miles de referencias hace falta además poder
**explorar**: llegar sin saber el nombre exacto.

### Decisiones que hay que tomar con el usuario ANTES de programar

1. **De dónde salen los catálogos.** El usuario propone buscarlos en la web. Hay
   que acordar el formato de entrada (PDF, Excel, CSV, scraping) y quién hace la
   extracción. Existe una skill del proyecto, `csv-inventario-app`, que convierte
   tablas de productos al CSV que la app importa: **conviene revisarla antes de
   inventar un pipeline nuevo**.

2. **Taxonomía de categorías.** Con miles de referencias, la jerarquía es el
   diseño principal. ¿Dos niveles (familia → subfamilia)? ¿Etiquetas cruzadas
   (frío/seco, alcohólico/no)? Esto condiciona la navegación entera.

3. **Alcance de la visibilidad.** ¿El catálogo del desarrollador lo ven todas las
   cuentas, o se copia a cada usuario? Afecta a las reglas de Firestore, al
   coste de lectura y al modelo de datos. **Es la decisión con más consecuencias
   técnicas de las tres.**

4. **Precios.** ¿Se guardan como histórico por proveedor —encajaría con el motor
   de costes, que ya usa `purchaseHistory`— o como precio único vigente?

### Restricciones que ya existen y conviene respetar

- El **motor de costes** (`src/core/costing/costCalculator.ts`) es fuente única.
  Cualquier producto nuevo debe encajar en su modelo de unidades.
- La **normalización de unidades** vive en `src/utils/packNormalization.ts`, y ya
  sabe leer etiquetas sucias tipo `"0.750 L"`. Los catálogos de proveedor
  llegarán con formatos irregulares: **usar esto, no reimplementarlo**.
- La vista móvil de Grimorio ya está adaptada (tira de pestañas, fichas
  compactas). El rediseño de Mercado debe partir de ahí, no de cero.

---

## Cómo abordarlo

Sugerencia de orden, para que el trabajo grande no dependa de incógnitas:

1. **Los tres bugs de la Parte 1.** Son concretos y desbloquean el uso diario.
   Además, entender por qué los datos no llegan en móvil es probablemente
   requisito para lo demás.
2. **Las cuatro decisiones** de la Parte 2, con el usuario. Sin ellas, cualquier
   código que se escriba se tira.
3. **Un catálogo de prueba** —un proveedor, no todos— para validar el pipeline
   de importación y la taxonomía antes de escalar.
4. **El rediseño de navegación** de Mercado, ya con datos reales encima.
