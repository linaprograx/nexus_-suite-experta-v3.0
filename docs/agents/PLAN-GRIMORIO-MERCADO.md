# Plan — Grimorio: Recetas, Inventario y Mercado

**Actualizado:** 2026-08-06 · **Estado:** **bugs de datos RESUELTOS**;
decisiones de producto del catálogo global, pendientes.

Grimorio es un solo flujo operativo: **Mercado/pedido inicial → Inventario y
reglas → creación o recepción de Recetas → coste y operación**. Pizarrón y
Oráculo quedan expresamente fuera de este plan.

## ✅ Los tres bugs de datos, resueltos (2026-08-06)

**Causa única, y no era de la vista móvil:** `VITE_FIREBASE_APP_ID` se pegó en
Vercel con dos saltos de línea al final. Como `appId` forma parte de las rutas
de Firestore (`artifacts/${appId}/users/...`), todas ellas apuntaban a una
colección inexistente. Firestore no da error —una colección que no existe es
simplemente una colección vacía—, así que se veía como "no hay datos".

Corregido recortando toda la configuración en `src/config/firebaseConfig.ts`.
**Verificado en producción:** Mercado muestra 1367 productos y 3 proveedores, el
selector de ingredientes lista con normalidad y los conflictos de stock son 0.

> Pendiente: que el usuario limpie el valor en el panel de Vercel. El código lo
> recorta, pero el valor sigue sucio allí.

El diagnóstico de Codex que sigue **acertó al descartar** que fuera un problema
de CSS o de bifurcación móvil, y su paso 3 —"si `allIngredients` es 0,
investigar la consulta o permisos"— es exactamente el que cerró el caso. Se
conserva por eso.

La pista que estaba a la vista: **recetas y compras funcionaban**, y son las
colecciones que **no** usan `appId` en su ruta.

<details>
<summary>Diagnóstico previo (resuelto, se conserva por su método)</summary>

## Diagnóstico móvil (lectura de código)

La comprobación en una sesión autenticada a 390px sigue pendiente: no había una
sesión abierta disponible durante este diagnóstico. El recorrido de datos sí
permite separar las causas, sin inferir que sean de CSS.

| Incidencia | Veredicto | Evidencia |
|---|---|---|
| Inventario muestra alertas, no ~1300 productos | **No es la lista del catálogo.** El inventario solo construye existencias desde compras, menos movimientos. Si las compras no tienen `ingredientId` válido, se omiten de la lista y aparecen como conflictos de vinculación. | `GrimoriumView.tsx:296-303`, `usePurchaseIngredient.ts:14-39`, `stockUtils.ts:23-61` |
| Selector «Seleccionar ingrediente» vacío | **Debe recibir el catálogo** a través de `allIngredients`; no tiene rama móvil propia. Si está vacío, `useIngredients` devolvió `[]`/error/no se habilitó, o el usuario observa otro origen de selector. | `StockResolverPanel.tsx:86-97`; el catálogo procede de `useIngredients.ts:18-28` |
| Mercado vacío en móvil, lleno en escritorio | **La vista móvil usa la misma instancia de `IngredientListPanel` y el mismo `allIngredients`.** No hay bifurcación móvil de datos ni de renderizado en la llamada. El siguiente paso debe capturar `isLoading`, `error` y longitud en la sesión afectada; el código no sustenta una corrección responsive. | `GrimoriumView.tsx:90-96,835-855`; `PremiumLayout.tsx:104-117` transforma columnas en hojas, no los datos. |

### Prueba mínima pendiente en iPhone, 390px

1. Abrir Recetas, Inventario y Mercado con la cuenta afectada; capturar la
   consola para errores de Firestore e índice/permisos.
2. Registrar, temporalmente y sin datos sensibles, `allIngredients.length`,
   `useIngredients.isLoading/error`, `purchaseHistory.length` y
   `calculatedStockItems.length`.
3. Si `allIngredients > 0` y Mercado sigue vacío, investigar
   `IngredientListPanel`/filtros; si es 0, investigar la consulta o permisos.
4. Si hay compras sin `ingredientId`, usar el resolver; si hay ~1300 ingredientes
   pero ninguna compra, decidir explícitamente si Inventario debe representar
   catálogo, existencias reales, o ambos como listas distintas.

No aplicar cambios hasta obtener esa evidencia de sesión. En particular, no
mezclar «catálogo» con «stock real»: hoy son modelos distintos.

</details>

## Decisiones bloqueantes del catálogo global ⬜ PENDIENTE

Antes de implementar Mercado-catálogos hay que acordar:

1. **Entrada y extracción:** PDF/Excel/CSV publicado, scraping autorizado o
   carga manual; propietario de la extracción y frecuencia de actualización.
   No existe instalada la skill `csv-inventario-app` citada en la nota previa.
2. **Taxonomía:** familia → subfamilia, más etiquetas transversales necesarias
   (frío/seco, alcohólico, formato, alérgenos, etc.).
3. **Visibilidad:** catálogo global leído por todas las cuentas, o copia por
   usuario; cambia reglas Firestore, coste de lectura, actualizaciones y borrado.
4. **Precio:** precio vigente con fecha, o histórico inmutable por proveedor y
   referencia. La recomendación a validar es histórico por observación de
   precio, manteniendo una proyección vigente para consulta.

Restricciones: `src/core/costing/costCalculator.ts` sigue siendo la fuente única
de coste y `src/utils/packNormalization.ts` la de unidades/formato. Cualquier
importación debe pasar por ellas; no crear una calculadora o normalizador paralelo.

## Roadmap transversal por entregas

### E1 — Fiabilidad de datos y contrato operativo

- Ejecutar la prueba móvil anterior y reparar solo la causa demostrada.
- Definir la separación visible entre catálogo, compra y stock real.
- Especificar el pedido inicial ficticio mensual: crea inventario desde una
  proyección, no factura ni gasto, y debe ser identificable/reversible.
- Acordar permisos para recetas compartidas: propietario autoriza, receptor
  previsualiza e importa; los ingredientes faltantes pasan a una lista de compra.

### E2 — Fundaciones del catálogo y de coste

- Resolver las cuatro decisiones bloqueantes y validar un proveedor con un
  catálogo de prueba.
- Modelo de catálogo global y referencias proveedor-producto; normalización,
  deduplicación auditable y precios fechados.
- Navegación móvil y escritorio para explorar por taxonomía, buscar y comparar;
  no duplicar los datos por usuario salvo decisión explícita.
- Enlazar referencias seleccionadas con ingredientes propios sin romper el
  coste ni el historial de compras.

### E3 — Pedido y recepción

- Preferencias/puntuación de proveedor y comparación reproducible.
- Cesta que divide el pedido por proveedor y genera una hoja por proveedor.
- Recepción de pedido: convierte líneas aceptadas en compras/stock, registra
  sustituciones, diferencias y precios efectivamente pagados.
- Preparar envío externo como integración posterior: requiere autorización por
  proveedor, credenciales/configuración y trazabilidad; no se enviará nada por
  defecto.

### E4 — Finanzas y colaboración de recetas

- Ingesta de facturas con revisión humana, conciliación con recepción y control
  mensual. Requiere política de retención, permisos y proveedor OCR si se usa.
- Recetas compartidas: autorización, versión/origen, importación y resolución
  de ingredientes faltantes en Mercado/Inventario.
- El coste operativo mantiene `costCalculator.ts` como única fuente; los datos
  de factura enriquecen compras, nunca lo sustituyen con fórmulas paralelas.

### E5 — Guía interna no IA

- Primer uso por pantalla: overlay/blur, foco sobre elemento real, secuencia
  lógica, Atrás/Siguiente/Omitir y ayuda repetible.
- Estado por usuario y versión de guía, accesible y no bloqueante.
- Recorrido Grimorio: Mercado → pedido inicial/Inventario y reglas → Recetas,
  incluidas recetas compartidas y compra de faltantes.

Cada entrega requiere diseño/validación en móvil y escritorio. Las integraciones
externas (envío de pedidos, OCR/facturas) no se activan sin autorización y
configuración explícitas.
