# Auditoría — Identidad de producto: Mercado ↔ Compra ↔ Inventario

**Fecha:** 2026-08-09 · **Método:** lectura de código + datos reales en
producción. **Nada implementado. Nada migrado.**

---

## Resumen en tres frases

1. **El flujo de compra NO crea duplicados.** El inventario se agrupa por
   `ingredientId` de forma estricta y correcta: comprar el mismo ingrediente
   dos veces siempre cae en la misma fila.
2. **La arquitectura maestro ↔ ofertas YA EXISTE en el modelo**:
   `Ingredient.id` es el producto maestro y `Ingredient.supplierData` es el mapa
   de ofertas por proveedor. Los campos que compiten con ella están marcados
   `@deprecated` desde hace tiempo.
3. **El duplicado está en el catálogo, no en el flujo.** Hay varios documentos
   de ingrediente para el mismo producto real. Mercado lo disimula agrupando por
   parecido de nombre en pantalla; Inventario no lo disimula, y por eso se ve.

> Consecuencia para el plan: esto **no es construir una arquitectura nueva**. Es
> **reconciliar datos** y **hacer que Mercado consuma el modelo que ya existe**.

---

## 1. Cómo identifica Mercado un producto

**No lo identifica.** Agrupa por **parecido de texto, en cada render**, en
`IngredientListPanel.tsx` (~líneas 130-222):

- `getTokens(nombre)` trocea el nombre, con una lista de `WEAK_TOKENS`.
- `doTokensMatch` exige al menos una coincidencia «fuerte».
- Recorre los grupos ya creados y mete el ingrediente en el primero que encaje.

Y la clave del grupo es:

```
const key = ing.id; // Use ID as key since we don't have a canonical name
```

El propio comentario lo admite. **La identidad del grupo es el `id` del
documento que casualmente lo creó primero**, que depende del orden de iteración
y del filtro activo. Cambia el filtro y puede cambiar el representante.

Es exactamente la identidad-por-texto que el encargo prohíbe. En Mercado es
**presentación**, así que no corrompe datos — pero tampoco resuelve nada, y no
sirve como base de la reconciliación.

## 2. Cómo modela las ofertas

**Hay dos mecanismos, y el bueno está sin usar.**

**(a) El modelo correcto, ya en el tipo** (`types.ts:125`):

```ts
proveedores?: string[];                 // ids de proveedor
supplierData?: Record<string, {         // clave = providerId
    price: number;
    unit: string;
    formatQty?: number;
    formatUnit?: string;
    lastUpdated?: any;
}>;
```

Esto **es** «producto maestro → ofertas de proveedor», con precio, unidad y
formato por proveedor. Y los campos rivales están marcados como obsoletos en el
propio tipo:

```
/** @deprecated Use 'supplierData' for multi-provider support */  unidadCompra
/** @deprecated Use 'supplierData' or StockItem.averageUnitCost */ precioCompra
/** @deprecated Use 'proveedores' array */                         proveedor
```

`resolvePricePerBase` (`costCalculator.ts:247`) **ya lee `supplierData`** para
sacar el formato del pack. El motor económico conoce el modelo.

**(b) Lo que Mercado usa de verdad:** el «N opc.» **no lee `supplierData`**.
Construye su `supplierMap` recorriendo `group.entries` — es decir, **los
documentos duplicados**.

> **Esto es lo más importante de toda la auditoría:** hoy los duplicados **son**
> las ofertas. Fusionarlos sin trasladar antes su precio, formato y proveedor a
> `supplierData` **destruiría la función multi-proveedor de Mercado**. La fusión
> no es un borrado: es un **traslado**.

## 3. Cómo identifica Inventario un producto

Por **`ingredientId`**, y está bien hecho. `buildStockFromPurchases`
(`stockUtils.ts:16-69`) construye un mapa:

```
const existing = stockMap[purchase.ingredientId];
if (existing) { …suma cantidades, recalcula coste medio ponderado… }
else          { …crea la fila… }
```

Identidad estable, basada en id, no en texto. **Lo que el encargo pide para
Inventario ya se cumple.**

## 4. Qué ocurre exactamente al comprar

`PurchaseModal` → `confirmPurchase` (`usePurchaseIngredient.ts:69`) →
`addPurchase` → `addDoc` en `users/{uid}/purchases` con `ingredientId`,
`quantity`, `unit`, `unitPrice`, `totalCost`, `providerId`.

**No se crea ningún «InventoryItem».** El inventario **no se almacena: se
deriva** de compras − movimientos, en cada render.

## 5. Dónde se decide «crear nuevo» frente a «actualizar»

**En ningún sitio, y ese es el hallazgo.** No existe `createInventoryItem()`.
La única decisión equivalente es el `if (existing)` de
`buildStockFromPurchases`, y su criterio es `purchase.ingredientId`.

Por tanto **no hay nada que arreglar en el flujo de compra**. El
comportamiento que el encargo describe como objetivo —resolver el maestro,
encontrar la ficha, sumar— es **literalmente lo que ya hace**, siempre que el
`ingredientId` sea el mismo.

## 6. Por qué se están creando duplicados

Porque **en el catálogo hay tres documentos distintos** para lo que
conceptualmente es un producto (o dos). Visto en producción:

| Ficha | Cantidad | `unit` | Valor |
|---|---|---|---|
| VODKA ABSOLUT MANDARINA | 1 | `0.700 L` | 10,62 € |
| ABSOLUT VODKA | 1 | `BOTELLA (700ML)` | 9,99 € |
| VODKA ABSOLUT | 6 | `0.700 L` | 71,28 € |

Tres `ingredientId` distintos ⇒ tres filas de inventario. **Inevitable y
correcto** dado el dato de partida: el sistema no puede saber que dos documentos
son el mismo producto sin que alguien se lo diga.

El origen es la **importación masiva de CSV**, que crea un documento por línea
sin comprobar si ya existe un maestro equivalente.

Nótese además que `ABSOLUT MANDARINA` **no es un duplicado** de `ABSOLUT VODKA`:
es otro producto. Cualquier automatismo por parecido los habría fusionado.

## 7. ¿Existe ya un ID maestro reutilizable?

**Sí: `Ingredient.id`.** Es estable, es el que usan compras, movimientos, reglas
y las líneas de receta (`IngredientLineItem.ingredientId`).

Lo que **no** existe es una forma de decir *«este documento es en realidad el
mismo producto que aquel»*. Ese es el único campo que falta:

```ts
/** Si está presente, este documento es un ALIAS del maestro indicado. */
masterProductId?: string;
```

Un campo. No una arquitectura.

## 8. Cambios mínimos para resolverlo

Tres, en este orden:

1. **`masterProductId?: string` en `Ingredient`** — opcional, aditivo, sin
   migración. Ausente = el documento es su propio maestro.
2. **Resolver alias en lectura**, en un solo helper
   (`resolverMaestro(ingredientId)`), consumido por: construcción de stock,
   reglas de stock, agrupación de Mercado y resolución de líneas de receta.
   Nada se reescribe en la base: los `purchases` históricos siguen apuntando al
   documento alias y se resuelven al vuelo.
3. **Trasladar la oferta del alias a `supplierData` del maestro** durante la
   reconciliación: precio, unidad, formato y proveedor. Es lo que conserva el
   «N opc.» de Mercado.

**Ventaja decisiva de resolver en lectura y no reescribiendo:** es
**reversible**. Quitar el `masterProductId` deshace la fusión sin tocar ni un
histórico. Es lo contrario de una migración destructiva.

## 9. Impacto por módulo

| Módulo | Impacto | Riesgo |
|---|---|---|
| **Inventario** | Las filas alias se consolidan en el maestro | Medio — cambia lo que se ve, no lo que hay |
| **Mercado** | Pasa a agrupar por `masterProductId` en vez de por parecido | **Alto si se hace mal**: perder `supplierData` mata el «N opc.» |
| **StockMovement** | Ninguno en escritura; se resuelven al leer | Bajo |
| **Reglas de stock** | Dos alias podían tener dos reglas → hay que elegir una y conservar la otra como histórico | Medio |
| **Recetas** | Las líneas siguen apuntando a su `ingredientId`; el coste se resuelve vía maestro | **Alto**: es el módulo cerrado, hay que no romperlo |
| **Costes** | Sin cambio de política (ver abajo) | Bajo si no se toca la política |
| **Pedidos** | Un maestro con varias ofertas permite elegir proveedor de verdad | Bajo, y es mejora |

### Política económica actual — **no la toco, la documento**

Pedido explícitamente. Hoy funciona así:

1. `standardPrice` del documento maestro, si existe (precio por unidad base, ya
   ajustado por merma).
2. Si no, **precio de pack ÷ cantidad de pack**, tomando el formato de
   `standardQuantity`, o de `supplierData` (la **primera** entrada), o del
   nombre.
3. `enrichIngredientsWithPurchases` usa el **coste medio ponderado** de las
   compras (`averageUnitCost`), pero **solo para ingredientes que no tengan
   precio guardado** en el documento maestro.

En una frase: **manda el precio del catálogo; las compras son respaldo, y el
respaldo es media ponderada.**

### Qué precio manda con varias ofertas — **DECIDIDO 2026-08-09**

Decisión del fundador:

1. Manda el **proveedor preferente**, aunque otro sea más barato. La preferencia
   no es solo precio: es plazo, trato, fiabilidad y mínimo de pedido.
2. Si otro es más barato, **se señala** — sin cambiar nada por su cuenta.
3. Sin preferente configurado, manda el **más barato**, y se avisa de que
   conviene configurar uno.

Implementado como función pura en `src/core/identity/offerSelection.ts`.
**Todavía no lo consume el motor de coste**, y es deliberado: mientras las
ofertas sigan viviendo como documentos duplicados, ningún maestro tiene varias
entradas en `supplierData`, así que no habría nada entre lo que elegir.
Conectarlo hoy sería tocar la fuente única de coste a cambio de nada. Se conecta
en la **Fase D**, cuando la reconciliación empiece a poblar `supplierData`.

Sustituye a lo que hay hoy: `getAnyPackPrice` cae en
`Object.values(supplierData)[0]` —la primera clave del objeto— y solo si ningún
campo heredado (`precioCompra`, `costo`…) tiene valor.

## 10. Datos que necesitan reconciliación

- **Catálogo**: documentos duplicados del mismo producto real.
- **`unidadCompra` como formato, no como unidad.** `unit: "0.700 L"` y
  `unit: "BOTELLA (700ML)"` son **formatos**. La cantidad («6») cuenta envases.
  Es exactamente el I1 pendiente, y aquí se ve por qué van juntos: **fusionar
  dos alias con formatos distintos exige normalizar antes**, o se suman peras
  con manzanas.
- **Reglas de stock** duplicadas entre alias.
- **Compras históricas** apuntando a alias (se resuelven en lectura, no se
  reescriben).

## 11. Informe en seco de candidatos — **cómo se va a producir**

**Limitación honesta:** no puedo consultar tu Firestore. La sesión vive en el
navegador y la SDK no está expuesta globalmente; y sacar tus datos fuera de la
app para analizarlos sería peor idea todavía.

**Propuesta:** un **informe de solo lectura dentro de la app**, detrás de un
botón en la barra de Grimorio. No escribe nada. Por cada grupo candidato:

- ficha A y ficha B: id, nombre, familia, unidad, formato, stock, coste;
- movimientos, reglas, recetas, sub-recetas y cartas que las referencian;
- ofertas y proveedores asociados;
- maestro propuesto y simulación de stock resultante, en unidad normalizada;
- **RIESGO: BAJO / MEDIO / ALTO** con su motivo;
- y `BLOQUEADO PARA REVISIÓN` en todo lo ambiguo.

La similitud de texto se usa **solo para proponer candidatos**, nunca para
decidir. Casos como `ABSOLUT VODKA` / `ABSOLUT MANDRIN` o
`Coca-Cola Original` / `Coca-Cola Zero` deben salir **bloqueados por defecto**:
la heurística los acerca y la decisión es humana.

---

## 12. Plan por fases

### Fase A — Ver el problema · *sin escribir nada*

- **Objetivo:** el informe en seco del punto 11.
- **Archivos:** nuevo `src/features/identity/` (detección de candidatos +
  panel de informe); un botón en `GrimoriumToolbar`.
- **Datos:** ninguno. Solo lectura.
- **Riesgo:** ninguno.
- **Pruebas:** el informe no dispara ni una escritura (verificable en la
  pestaña de red).
- **Cierre:** el fundador ha leído la lista y sabe cuántos duplicados reales
  hay.

### Fase B — La identidad existe pero no hace nada  ✅ **HECHA 2026-08-09**

- `masterProductId?` y `proveedorPreferente?` en `Ingredient` (`types.ts`).
- `src/core/identity/masterProduct.ts`: `resolverMaestro`, `indicePorId`,
  `aliasDe`. Resuelve cadenas de alias, con guarda anti-ciclos: ante un ciclo
  devuelve el punto de partida en vez de colgarse.
- `src/core/identity/offerSelection.ts`: la política de precio decidida arriba.
- **Ningún consumidor.** El motor de coste, el stock y Mercado están intactos.
- **Verificado con 14 comprobaciones**, entre ellas la que cierra la fase: sin
  ningún alias asignado, `resolverMaestro(id) === id` para todo el catálogo, así
  que el comportamiento es idéntico al de antes. Más ciclos, alias huérfanos,
  cadenas de dos saltos y los cinco casos de la política de precio.

### Fase C — Consolidar en lectura

- **Objetivo:** que stock, reglas y Mercado resuelvan alias.
- **Archivos:** `stockUtils.ts` (agrupar por maestro), `useStockRules`,
  `IngredientListPanel` (agrupar por `masterProductId`, con el parecido de
  nombre **solo** como respaldo mientras queden documentos sin alias).
- **Datos:** ninguno todavía; sin alias asignados, el comportamiento no cambia.
- **Riesgo:** **medio-alto en Mercado.** Criterio de no-regresión: el «N opc.»
  debe seguir mostrando lo mismo.
- **Pruebas:** con cero alias, Inventario y Mercado idénticos a hoy, píxel a
  píxel. Es la prueba que protege de todo lo demás.
- **Cierre:** verificado en producción sin ningún alias asignado.

### Fase D — Reconciliar, de una en una

- **Objetivo:** asignar `masterProductId` **caso por caso, con aprobación**, y
  trasladar la oferta del alias a `supplierData` del maestro.
- **Datos:** escribe `masterProductId` y `supplierData`. **No borra nada.**
- **Riesgo:** medio, y **reversible**: quitar el campo deshace la fusión.
- **Pruebas:** por cada fusión, antes/después de stock, coste de las recetas
  afectadas y reglas resultantes.
- **Cierre:** los duplicados aprobados, consolidados; los ambiguos, bloqueados.
- **Requisito previo:** **I1 (unidades) hecho**, o se suman formatos distintos.
- **Requisito previo:** la **decisión de precio** del punto 9.

### Fase E — Cerrar la puerta

- **Objetivo:** que la importación de CSV deje de crear maestros duplicados:
  al importar, propone el maestro existente en vez de crear documento nuevo.
- **Riesgo:** medio.
- **Cierre:** importar dos veces la misma lista no duplica el catálogo.

---

## Lo que NO se hace

Fusión automática por parecido · migración masiva · borrado de históricos ·
cambio de la política de coste · tocar Recetas · una arquitectura paralela ·
usar el nombre como identidad permanente.
