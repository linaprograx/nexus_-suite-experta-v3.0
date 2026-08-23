# Auditoría de Inventario y Mercado

**Fecha:** 2026-08-09 · **Autor:** Claude Code
**Método:** lectura de código + recorrido de la app **en producción con sesión
real** a 726×814 (ancho de tableta/móvil, el que usa el fundador).

**Datos reales, sin tocarlos.** No se pulsó Comprar, Enviar Pedido, Conteo,
borrar ni ningún control que escriba. Todo lo que sigue sale de mirar y de leer.

---

## Lo primero: parte de lo que creíamos pendiente YA ESTÁ CONSTRUIDO

Antes de la lista de defectos, una corrección al plan. En
`PLAN-GRIMORIO-MERCADO.md` se describen como trabajo futuro cosas que existen:

| Se creía por hacer | Realidad |
|---|---|
| Reparto del pedido por proveedor (E3) | **Existe.** `StockReplenishmentModal.handleCreateOrders` agrupa por `ing.proveedor` y crea una hoja por proveedor. En producción hay 3 pedidos vivos: *Proveedor Desconocido*, *FRUTAS ELOY*, *BORDINOS*. |
| Multi-proveedor por producto (E2) | **Existe.** Mercado agrupa referencias y muestra «N opc.» (visto: 5, 12, 16, 28 opciones). |
| Comparación de precios entre proveedores | **Existe el motor.** `evaluateMarketSignals` recibe un `supplierMap` con precio, formato y fecha por proveedor. |
| Ciclo de pedido | **Existe.** `draft → sent → completed`, con las compras creadas solo al recibir. |

> La consecuencia importa para planificar: **E3 no es una construcción desde
> cero, es una reparación.** Lo que falta no es el reparto — es que el pedido
> lleve precio, proveedor y cantidad de verdad.

---

## Orden de ejecución

| # | Hallazgo | Prioridad | Causa |
|---|---|---|---|
| **I1** | Las unidades son texto libre y se suman sin convertir | 🔴 P0 | Confirmada |
| **M1** | Los pedidos salen a 0,00 € | 🔴 P0 | Dos hipótesis, una comprobación |
| **M2** | El pedido no guarda a qué proveedor es | 🔴 P0 | Confirmada |
| **I2** | El semáforo de stock no significa nada | 🟠 P1 | Confirmada |
| **I3** | «+0% vs mes anterior» es una métrica falsa | 🟠 P1 | Confirmada |
| **M3** | Toda línea de pedido nace con cantidad 1 | 🟠 P1 | Confirmada |
| **I4** | Dos valores de almacén distintos | 🟠 P1 | Observada |
| **I5** | Tarjetas gigantes: ~238.000 px de scroll | 🟡 P2 | Confirmada |
| **M4** | Dos campos de precio conviviendo | 🟡 P2 | Confirmada |
| **I6** | El borrado masivo borra el historial de compras | 🟡 P2 | Confirmada |
| **M5/M6/T1** | Roces de interfaz | 🟡 P3 | Observados |

---

# INVENTARIO

## 🔴 I1 — Las unidades son texto libre, y se suman sin convertir

**El defecto que envenena todo lo demás.** `buildStockFromPurchases`
(`src/utils/stockUtils.ts:31`) hace:

```
const newQuantity = existing.quantityAvailable + purchase.quantity;
```

Suma `quantity` **sin mirar `unit`**. Y la unidad del ítem se fija con la
**primera** compra que se procesa (`:57`) y no se vuelve a mirar nunca. Si un
producto entró una vez en botellas y otra en litros, el resultado es un número
sin significado con la etiqueta de la primera.

> ### ⚠️ CORRECCIÓN — medido el 2026-08-23 sobre las compras reales
>
> **Lo de abajo es cierto en el código y falso en la conclusión.** Sí se suma
> sin mirar `unit`; pero en el catálogo real eso **no** produce números sin
> significado, porque `quantity` es **siempre número de envases**:
>
> - 435 de 435 fichas con etiquetas mezcladas son el mismo patrón: el
>   **formato** («0.700 L») frente a la **unidad** («UND»), con la misma
>   cantidad. **Cero** casos de volumen contra peso.
> - De 147 compras donde el precio pagado distingue «precio del envase» de
>   «precio por litro», **147 son el del envase y ninguna el del litro**.
> - **Ninguna cantidad de todo el histórico pasa de 60.**
>
> Las sumas están bien. Lo que está mal es la **etiqueta**, que sale de la
> primera compra procesada. Y los `10813.000 L` no son un stock: son un
> **código de producto pegado a un formato** por el importador — hay 43 así,
> con SKU secuenciales (14023, 14024, 14025…).
>
> **Consecuencia práctica:** I1 **no necesita migrar ninguna cantidad**. Ver
> `core/unidades/mezclaDeUnidades.ts`.
>
> **Y destapó un fallo que este audit no vio:** `recipeDepletion` leía la
> etiqueta antes que el formato de la ficha, así que 137 productos etiquetados
> `L` con envase de 700 ml **descontaban un 43 % de más** en cada producción.
> Arreglado el 2026-08-23.

**Evidencia en producción**, tal cual se lee en pantalla:

```
LA VENENOSA TUTSI      3   10813.000 L + 0.700 L    163,90 €
LICOR THUNDER BITCH    3     793.000 L + 0.700 L     11,39 €
```

Nadie tiene 10.813 litros de raicilla. Ese texto **es el campo `unit`**: llegó
así en la importación y se muestra crudo. Conviviendo, además:
`UND · LT · L · KG · BJ · BL · PZ · PZA · MJ · 100 UDS · 0.700 L`. `PZ` y `PZA`
son lo mismo escrito de dos formas.

**Lo que duele:** `src/utils/packNormalization.ts` existe y es la fuente única
de unidades y formatos — pero **no se aplica en la entrada**. Se normaliza al
calcular costes y no al guardar la compra, así que el dato sucio se queda en la
base y cada consumidor lo interpreta a su manera.

**Dirección:** normalizar en el punto de entrada (compra e importación), guardar
cantidad canónica + unidad de presentación, y migrar lo existente con un informe
previo de qué va a cambiar. **Esto toca datos reales: se diseña con una vista
previa, y la migración la ejecuta el fundador, no el agente.**

## 🟠 I2 — El semáforo de stock no significa nada

`StockInventoryPanel.tsx:364`:

```
item.quantityAvailable > 5 ? verde : rojo
```

Un 5 a fuego, igual para todas las unidades. **3 botellas de mezcal salen en
rojo; 6 kilos de patata, en verde.** En el recorrido, prácticamente todas las
tarjetas tenían el punto rojo, así que el indicador no informa: es ruido.

Y lo peor es que **ya existe `useStockRules`**, con reglas por ingrediente
(mínimo, punto de pedido). El panel no las consulta.

## 🟠 I3 — «+0% vs mes anterior» no es lo que dice

`StockInventoryPanel.tsx:116`:

```
pct = before > 0 ? (thisMonth / before) * 100 : …
```

Dos errores en una línea:

1. **`before` es *todo* el histórico**, no el mes anterior. El bucle solo separa
   «este mes» de «todo lo demás».
2. Una variación se calcula `(actual − anterior) / anterior`, no
   `actual / anterior`.

Por eso muestra `+0%` el mismo día en que hay compras registradas hace 46
minutos: unos cientos de euros sobre ~39.000 € de histórico redondean a cero.
La cifra es tranquilizadora y falsa a la vez.

## 🟠 I4 — Dos valores de almacén distintos

En la misma sesión, con los mismos datos:

| Pantalla | Valor |
|---|---|
| Dashboard → «Valor Almacén» | **39.471 €** |
| Grimorio → Inventario → «Valor Inventario» | **39.452,96 €** |

~18 € de diferencia. No es redondeo: son dos cálculos distintos sobre lo mismo,
el patrón que `CONTEXT.md` señala como origen de los peores fallos del proyecto.
Falta localizar el segundo cálculo y dejar uno solo.

## 🟡 I5 — La lista es inviable en un teléfono

Cada ítem ocupa ~180 px (nombre, categoría, cantidad, valor, casilla, icono,
punto de estado). Con **1.325 ítems son unos 238.000 px de scroll**: cuarenta
minutos de arrastre para llegar al final.

Ya estaba anotado en `ROADMAP.md` M3, punto 4 — *«en móvil deberían ser filas
densas, no tarjetas»*. Esta auditoría lo confirma y añade que sin
virtualización, además, es el sospechoso número uno del **A4** de
`AUDIT-MOVIL.md` (Inventario lento, retardo al tocar).

## 🟡 I6 — El botón de borrar no borra lo que parece

`handleDeleteSelected` (`:128`) no elimina «ítems de inventario»: elimina las
**compras** (`purchases`) de esos ingredientes. Como el stock se deriva de las
compras menos los movimientos, borrar compras **reescribe el histórico y el
coste medio**, y los movimientos de consumo que colgaban de ellas quedan
huérfanos.

Tiene `confirm()` nativo y avisa de que borra el historial — bien. Pero no dice
que el coste de las recetas que usen ese ingrediente va a cambiar. Con ~1.325
ítems y selección múltiple, es el control más peligroso de la sección.

---

# MERCADO

## 🔴 M1 — Los pedidos salen a 0,00 €

Los tres pedidos vivos en producción muestran **€0.00** de total, con todas sus
líneas a «x1 und». Un pedido sin importe no sirve para pedir ni para presupuestar.

`StockReplenishmentModal.tsx:108`:

```
estimatedCost: (quantities[ing.id] || 0) * (ing.precioCompra || 0)
```

**Dos causas posibles, y no conviene elegir sin comprobar:**

- **(a) Histórica.** Los pedidos son del **14/1/2026**, anteriores al arreglo del
  `appId`. Entonces el catálogo se leía vacío y `precioCompra` no existía. Si es
  esto, el código está bien y lo que sobra son tres pedidos muertos.
- **(b) Viva.** `precioCompra` sigue sin llegar en el momento de crear la hoja.

**Comprobación mínima, barata y reversible:** crear un borrador con **un solo
producto que tenga precio visible en Mercado** (p. ej. ABSOLUT VODKA, 9,99 €) y
mirar el total. Si sale 9,99 €, era (a). Es un `addDoc` en `orders` y se borra
con la papelera del propio pedido. **La ejecuta el fundador**, o yo con permiso
explícito.

## 🔴 M2 — El pedido no guarda a qué proveedor es

`useOrders.createOrder` (`:64`) escribe `items`, `totalEstimatedCost`, `status`,
`createdAt` y `name`. **No escribe `providerId`** — aunque el llamador lo tiene
calculado y `Order` lo declara en su interfaz (`:16`).

El proveedor sobrevive únicamente dentro del **nombre**: `"Pedido - FRUTAS
ELOY"`. Consecuencias:

- No se puede filtrar, agrupar ni puntuar por proveedor de forma fiable.
- Renombrar un pedido rompe el vínculo.
- Al recibir, `handleReceiveOrder` (`GrimoriumView.tsx:498`) **vuelve a deducir**
  el proveedor desde el ingrediente, así que si entretanto cambió, la compra se
  registra a nombre de otro.

Es exactamente la pieza sobre la que se apoya toda la entrega E3 del plan
(puntuación de proveedor, comparación, envío). **Sin esto, E3 no se puede
construir encima.**

## 🟠 M3 — Toda línea nace con cantidad 1

`StockReplenishmentModal.tsx:65`: al seleccionar un producto se le pone
`quantity: 1`. Por eso los tres pedidos son una lista alfabética de «x1 und».

Un pedido de **reposición** debería proponer cantidad a partir de algo: consumo
del periodo, regla de stock del ingrediente, mínimo del proveedor, formato de
compra. Hoy el usuario tiene que teclear cada cantidad a mano sobre cientos de
líneas, y por eso los pedidos acaban siendo listas de unos.

## 🟡 M4 — Dos campos de precio conviviendo

Mercado y los pedidos usan **`precioCompra`**. El motor de coste usa
**`standardPrice`** vía `resolvePricePerBase`. Son campos distintos que pueden
divergir, y el contador de «39 sin precio» mira solo uno de los dos.

Antes de construir el catálogo de proveedores (E2) hay que decidir cuál manda —
y muy probablemente sea el mismo problema que la decisión 4 del plan (precio
vigente frente a precio histórico fechado).

## 🟡 M5 / M6 — Roces de interfaz

- La **barra de color** al pie de cada tarjeta es la **categoría**
  (`title={ing.categoria}`): un `title` solo se ve con ratón, así que en el
  teléfono es un color sin leyenda.
- Las **líneas de cada pedido** se muestran en una caja de ~4 líneas con scroll
  propio dentro de una hoja que también scrollea. Revisar un pedido de 300
  líneas por esa ventana es inviable.

## 🟡 T1 — El rótulo miente en dos de las tres pestañas

La cabecera dice **«Grimorio · RECETARIO MAESTRO»** también en Inventario y en
Mercado, que no son un recetario.

---

# Fases propuestas

Criterio: **primero que los números sean ciertos, después que el pedido sirva,
después que se pueda usar con el pulgar, y solo entonces lo nuevo.** Construir
el catálogo de proveedores sobre unidades que no suman sería edificar sobre
arena.

### Fase 0 — Que el dato sea cierto  ⟵ **empezar aquí**

Sin esto, cualquier función nueva hereda el error.

1. **I1 · Unidades canónicas.** Normalizar en la entrada con
   `packNormalization`, cantidad canónica + unidad de presentación. Incluye
   informe previo de migración; la migración la ejecuta el fundador.
2. **I4 · Un solo valor de almacén.** Localizar el segundo cálculo y eliminarlo.
3. **I3 · Arreglar o retirar la variación mensual.** Retirarla es aceptable:
   una métrica falsa es peor que ninguna.
4. **I2 · Semáforo desde `useStockRules`**, con respaldo por unidad cuando no
   haya regla.

*Verificable sin tocar datos: los tres primeros son de lectura. El 1 necesita la
vista previa antes de migrar nada.*

### Fase 1 — Que el pedido sirva para pedir

5. **M1 · Comprobar y arreglar el precio** (la prueba de un solo producto).
6. **M2 · Persistir `providerId`** en el pedido y usarlo al recibir, en vez de
   volver a deducirlo.
7. **M3 · Cantidad sugerida** a partir de regla de stock y formato de compra.

Al cerrar esta fase, un pedido tiene proveedor, cantidades con criterio e
importe — que es justo lo que E3 daba por supuesto.

### Fase 2 — Que se pueda usar con el pulgar

8. **I5 · Secciones plegables por proveedor** en Inventario y Mercado, con filas
   densas dentro de cada sección abierta. Especificado en
   `PLAN-GRIMORIO-MERCADO.md` → *«Agrupación por proveedor en secciones
   plegables»*. Lo plegado no se monta, así que es a la vez la mejora de
   navegación y la de rendimiento: cierra **I5** y buena parte de **A4** de
   `AUDIT-MOVIL.md`.
   > Requiere **M2** hecho antes: agrupar Inventario por un proveedor que se
   > deduce mal es agrupar mal.
9. **M5, M6, T1** y el repaso de la hoja de pedido.

### Fase 3 — Pedido ficticio inicial

El del plan (E1): crea inventario sin factura ni gasto, marcado y reversible,
una vez al mes. **Depende de la Fase 0**: montar el inventario inicial con
unidades sucias sería sembrar el problema en cada cuenta nueva.

### Fase 4 — Catálogo de proveedores de Madrid

E2 del plan, con sus **cuatro decisiones bloqueantes** todavía sin tomar. Ahora
se apoya en base sólida: multi-proveedor y señales de mercado ya existen.

### Fase 5 — Envío externo, facturas y economía

E3/E4 del plan. Lo más caro y lo que depende de terceros. Escalón intermedio
recomendado: que la hoja por proveedor la envíe el usuario con un toque, sin
integraciones.

---

## Lo que NO se ha podido verificar

- **M1** necesita la prueba del pedido de un producto (escribe, aunque sea
  reversible).
- El comportamiento de **Comprar** de extremo a extremo: abre `PurchaseModal`,
  pero no se confirmó ninguna compra.
- **Conteo físico**, **Reglas y proveedores** y **resolución de conflictos**: se
  vieron los accesos, no se ejecutaron.
- Rendimiento medido: falta perfilar en un teléfono real (A4).
