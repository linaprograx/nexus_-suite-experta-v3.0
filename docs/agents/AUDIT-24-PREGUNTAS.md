# Auditoría — las 24 preguntas del prompt maestro

**Fecha:** 2026-08-09 · Respuesta al documento «Grimorio / Inventario + Mercado».
**Nada migrado, nada fusionado.**

> Buena parte ya estaba auditada o corregida en las sesiones de hoy. Se marca
> **✅ HECHO**, **🔍 YA AUDITADO** o **🆕 NUEVO**. Detalle en
> `AUDIT-IDENTIDAD-PRODUCTO.md`, `AUDIT-INVENTARIO-MERCADO.md` y
> `PLAN-INVENTARIO-MERCADO.md`.

---

## Respuestas

| # | Pregunta | Estado | Respuesta corta |
|---|---|---|---|
| 1 | ¿Cómo se modela Product/Ingredient? | 🔍 | `Ingredient` en `types.ts:82`. `id` es la identidad; `supplierData` el mapa de ofertas; `precioCompra`/`unidadCompra`/`proveedor` marcados `@deprecated` |
| 2 | ¿Existe `masterProductId`? | ✅ | **Sí, desde hoy** (`ea80cc9`). Opcional, se resuelve en lectura, reversible |
| 3 | ¿Cómo agrupa Mercado las ofertas? | 🔍 | **Por parecido de nombre en cada render**. La clave del grupo es el `id` del documento que lo creó primero. No lee `supplierData` |
| 4 | ¿Cómo identifica Inventario? | 🔍 | Por `purchase.ingredientId`, estricto y correcto |
| 5 | ¿Por qué una 2ª compra crea otro producto? | 🔍 | **No lo hace.** Comprar dos veces el mismo `ingredientId` siempre cae en la misma fila. Los duplicados vienen del catálogo |
| 6 | ¿Dónde está el detector de duplicados? | ✅ | `src/features/identity/duplicateCandidates.ts` + `IdentityReportModal.tsx` |
| 7 | ¿Por qué «LICOR» da falsos positivos? | ✅ **CORREGIDO** | Ver abajo — era un bug mío, y grave |
| 8 | ¿De dónde salen `5522.000 L`? | 🆕 | Es el campo `unit`, texto libre, heredado de la importación. Ver abajo |
| 9 | ¿Cómo se almacenan las reglas? | 🆕 | `users/{uid}/stock-rules`, **id del documento = `ingredientId`** |
| 10 | ¿Qué impide la unicidad? | 🆕 | Nada en el modelo: ya es única por ingrediente. El problema es otro. Ver abajo |
| 11 | ¿Cómo funciona el conteo físico? | 🔍 | `PhysicalCountModal` → diferencias como movimientos `adjustment` con signo. No sobrescribe |
| 12 | ¿Cómo funciona Compra rápida? | 🆕 | Un `placeholder="Compra rápida…"` dentro de `StockRulesPanel:138`. Funciona; está escondido |
| 13-14 | Ciclo y estados de pedido | 🔍 | `draft → sent → completed \| cancelled`. **No inventar más sin migrar** |
| 15 | ¿«Proveedor Desconocido» y pedidos a 0 €? | ✅ **CAUSA HALLADA** | El precio nunca existió y nadie lo decía. Corregido en compra (`a83e933`); falta la hoja de pedido |
| 16 | Relación proveedores/ofertas/productos | 🔍 | `supplierData` es el modelo bueno; hoy las ofertas **son** los documentos duplicados |
| 17-19 | Importador y su límite | 🆕 | **Encontrado.** Ver abajo |
| 20 | ¿Qué reutilizar para el sincronizador? | 🆕 | `recipeImporter.importIngredientsFromCsv` + `supplierData` como destino de la oferta |
| 21 | Bugs visuales móviles | 🆕 | Dos confirmados por ti: conteo tapado y modal de proveedores por detrás |
| 22 | Cambios seguros sin migración | — | Todo lo hecho hoy: fases A/B/C, `origen`, I2/I3/I4, M1 |
| 23 | Cambios que tocan datos | — | Solo la Fase D (asignar `masterProductId`) y la normalización de unidades (I1) |
| 24 | Riesgos de regresión | — | Tabla en `AUDIT-IDENTIDAD-PRODUCTO.md` |

---

## Los cinco hallazgos nuevos

### 🔴 CRÍTICO · P7 — «LICOR» y «LICOR 43» se proponían como el mismo producto

**Era un bug mío, y peor de lo que reportaste.** No solo aparecían como
«variantes cercanas»: **compartían clave y estaban en el mismo núcleo**,
propuestos para fusionar.

Dos causas encadenadas en `tokensFuertes`:

1. `RUIDO` tenía palabras de envase (`botella`, `caja`, `cl`) pero **no tipos de
   producto**. Así que `licor`, `vodka` o `whisky` contaban como identidad.
2. Los números se filtraban **siempre**, por considerarlos formato. En
   `LICOR 43` el 43 **es la marca**, y al filtrarlo el nombre quedaba reducido a
   `licor` — idéntico al de un producto llamado solo `LICOR`.

**Corregido:**

- Nuevo conjunto `GENERICOS` con ~50 tipos de producto. Se conservan en la clave
  —«LICOR CAFÉ» no es «SIROPE CAFÉ»— pero **no cuentan como identidad**.
- Los números solo se descartan **si queda algo específico**. Sin nada
  específico, recuperan su papel: `LICOR 43` → `{43, licor}`.
- Para considerar a alguien «variante cercana» hace falta al menos **una palabra
  específica en común**. Compartir la familia ya no acerca a nadie.
- Si el nombre entero es genérico, el grupo sube a riesgo **ALTO** en vez de
  descartarse: dos fichas llamadas ambas «LICOR CAFE» sí pueden ser duplicados.

**Verificado con tus nueve licores reales:** `LICOR`, `LICOR 43`,
`LICOR AVALLEN`, `LICOR CAFE`, `ANKA LICOR DE MELOCOTON`, `LICOR AGAVERO
TEQUILA`, `LICOR AMARETO DISARONNO`, `LICOR ANCHO REYES`, `LICOR BOLS LYCHEE`
→ **0 grupos, 0 variantes**.

### 🔴 CRÍTICO · P9/P10 — Las reglas: el modelo está bien, la escritura no

**El modelo ya garantiza unicidad:** `useStockRules.saveRule` escribe en
`users/{uid}/stock-rules/{ingredientId}` con `setDoc`. Un ingrediente, una
regla, por construcción. `StockRuleModal:53` genera un `id` aleatorio, pero
`saveRule` lo pisa con el `ingredientId`.

**Entonces, ¿por qué ves reglas repetidas?** Dos causas distintas, y ninguna es
la que parece:

1. **Son productos duplicados, no reglas duplicadas.** Dos documentos llamados
   `LICOR AVALLEN` son dos `ingredientId`, así que **dos reglas legítimas** para
   lo que tú ves como un producto. Se resuelve con la Fase D, no tocando reglas.
2. **Y hay un problema serio de escritura**, este sí grave:

```
onUpdateRules={(newRules) => newRules.forEach(saveStockRule)}   // GrimoriumView:810
```

Al guardar **una** regla se reescriben **las 611**, una a una. Son 611
escrituras en Firestore por cada regla que creas o borras. No duplica datos
—`setDoc` es idempotente— pero es un coste y una lentitud absurdos, y explica
que el panel se sienta pesado.

### 🟠 ALTO · P8 — De dónde salen los `5522.000 L`

Es el campo **`unit`**, y es **texto libre almacenado**, no un problema de
pintado: `StockInventoryPanel` lo renderiza tal cual con `{item.unit}`. Llega
así: `PurchaseModal` toma `ingredient.unidadCompra` → `confirmPurchase` lo
guarda en la compra → `buildStockFromPurchases` lo copia al ítem de stock, y
**lo fija con la primera compra sin volver a mirarlo**.

Es decir: el dato ya es absurdo **en origen**, en el catálogo, desde la
importación. Confirma I1 y confirma tu regla final: el dato es absurdo antes de
llegar a la pantalla.

### 🟠 ALTO · P17-P19 — El límite del importador, encontrado

`recipeImporter.importIngredientsFromCsv` usa **un solo `writeBatch`** y no lo
trocea. **Firestore limita un `writeBatch` a 500 operaciones.** Ese es tu
recuerdo del «límite de 500»: no es una decisión de producto ni una validación,
es el tope duro de Firestore, y el código no lo gestiona.

`useOrders.createOrder` sí trocea a 500 (`CHUNK_SIZE`), así que **el patrón
correcto ya existe en el proyecto** — solo hay que aplicarlo al importador. Con
eso, la carga masiva y el futuro sincronizador dejan de tener techo.

### 🟡 MEDIO · P12/P16 — Compra rápida y jerarquía visual

«Compra rápida» es un `placeholder` de un campo de búsqueda dentro del panel de
reglas. Funciona —buscar, elegir, abrir el diálogo de compra— pero no se anuncia
como función.

---

## Encaje en el plan

El orden que propones (Fase 0 auditoría → 1 integridad → 2 bugs → 3 UX móvil →
4 Mercado → 5 importación → 6 sincronización → 7 inteligencia) **coincide con el
que ya seguíamos**. Lo nuevo se inserta así:

| Fase | Qué entra de este documento |
|---|---|
| **1 · Integridad** | ✅ P7 (hecho) · P9 reescritura masiva de reglas · P8/I1 unidades · Fase D de identidad |
| **2 · Bugs** | Hoja de pedido a 0 € (M1 parte 2) · `providerId` (M2) · cantidad ± en pedidos |
| **3 · UX móvil** | Conteo tapado por la franja · modal de proveedores por detrás · jerarquía de Compra rápida y de Comparativa · buscador y filtros de reglas |
| **4 · Mercado** | Agrupar por maestro sin perder «N opc.» · proveedor preferente (ya implementado, sin conectar) |
| **5 · Importación** | Trocear el batch a 500 · plantilla maestra · esquema antes de importar |
| **6 · Sincronización** | Identidad de oferta `supplierId + SKU` · diff · vista previa · histórico de precios |
| **7 · Inteligencia** | Alertas, priorización, Supplier Score |
| **Posterior** | Facturas · onboarding · roles · panel de gerencia |

### Lo que cambia respecto a lo que creíamos

- **P5 responde que no hay nada que arreglar en la compra.** El objetivo que
  describes ya se cumple; el trabajo está en el catálogo.
- **P10 responde que la unicidad de reglas ya existe.** Lo que hay es un
  problema de rendimiento y un reflejo de los duplicados.
- **P19 responde que el límite no se decidió: se heredó** de Firestore, y el
  proyecto ya tiene la solución en otro sitio.
