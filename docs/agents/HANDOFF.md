# Estado del relevo

> Este archivo se reescribe entero al cierre de cada sesión. El historial
> acumulado vive en `docs/agents/WORKLOG.md`.

---

**Última actualización:** 2026-08-11
**Estado:** árbol limpio, TypeScript 0 errores, build correcto. `HEAD`,
`deploy/mobile-v1` y ambas ramas en `origin` sincronizadas y desplegadas.

## Dónde se trabaja

| | |
|---|---|
| Worktree | `/Users/lianalviz/nexus-suite-mobile-v1` |
| Desarrollo | `feat/mobile-v1-unified` ← trabaja aquí |
| Producción | `deploy/mobile-v1` |
| URL | `https://nexus-suite-experta-v3-0.vercel.app` |

### Desplegar — a las DOS ramas, siempre

```bash
git push origin feat/mobile-v1-unified
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

### Verificar el despliegue — tres condiciones, no una

Esto costó **cuatro falsos positivos en un solo día**. Un marcador vale solo si
cumple las tres:

1. **El bundle se descargó**: vuélcalo a fichero y comprueba que pesa ~4 MB. Un
   `curl` fallido deja el fichero vacío y cualquier `grep -c` da 0, que se lee
   como «ya no está».
2. **Cadena de control presente** (`Recetario Maestro`). Prueba que estás
   leyendo la app y no una respuesta rara.
3. **Solo entonces**, el marcador de tu cambio.

Y el marcador **no puede ser**:
- un nombre de variable o de prop → el minificador los renombra;
- una cadena con tilde escrita sin tilde en el `grep`, ni con `·`;
- una clase CSS de una rama que sigue existiendo aunque nadie la active;
- un identificador que React ya incluye por su cuenta (`fetchPriority`).

**Lo más fiable es el cambio de hash del bundle** más la cadena de control.
Cadenas de texto visible al usuario son buenos marcadores; todo lo demás, no.

```bash
JS=$(curl -s "$URL/?cb=$RANDOM" | grep -o 'assets/index-[^"]*\.js' | head -1)
curl -s "$URL/$JS" -o /tmp/prod.js && wc -c < /tmp/prod.js
grep -c -F 'Recetario Maestro' /tmp/prod.js   # control
grep -c -F 'TU_CADENA_VISIBLE' /tmp/prod.js   # marcador
```

## Reglas de seguridad, no negociables

- Datos **reales** (~1.327 ítems, ~1.367 referencias, 30 recetas). Ninguna
  acción destructiva para verificar. Abrir un modal y **cancelar** sí vale.
- Migraciones: informe en seco → aprobación → **las ejecuta el fundador**.
- `core/costing/` y Grimorio Recetas están cerrados. **No tocar
  `buildStockFromPurchases`**: lo consume el motor de coste.
- Identidad: la similitud de nombres solo **propone**. Un grupo por operación.
- Fusión: **primero** trasladar la oferta del alias a `supplierData` del
  maestro, **después** escribir `masterProductId`. Nunca borrar el alias.

## Decisiones de diseño vigentes

- **La franja de Grimorio NO se pliega.** Todo lo que va del título a los
  filtros queda fijo en las tres pestañas. Ver `CONTEXT.md`. Si algún día
  estorba: hacerla **más baja**, no volver a esconderla.
- **Precio con varias ofertas:** manda el proveedor preferente aunque otro sea
  más barato, y se señala la alternativa. Sin preferente, el más barato y se
  avisa. Implementado en `core/identity/offerSelection.ts`, **sin conectar** al
  motor todavía.
- **Agrupación visual:** Inventario por familia; Mercado por proveedor.
- **Carta:** con alcohol primero, sin alcohol después, en pantalla y al exportar.

## Estado funcional

| Bloque | Estado |
|---|---|
| Recetas | **Cerrado.** `Escandallo = Ficha = Análisis = Lista` |
| Identidad A-C | Hecho y verificado sin regresión |
| Identidad D | **Mecanismo listo y probado** (`mergeMaster`), botón en el informe. El fundador fusionó el grupo Aguerrido: 1327 → 1326 ítems con el valor intacto |
| Ingrediente exprés | Hecho: alta desde la receta, marca `pendienteRevision`, fuera de automatismos, filtro en Mercado |
| Fase 0 · cimientos | `origen` ✅ · I2 ✅ · I3 ✅ · I4 ✅ · **I1 ✅ informe + corrección con deshacer** |
| Fase 1 · pedido útil | M1 compra ✅ · M2 ✅ · **M1 hoja de pedido y M3 cantidad pendientes** |

## ⏸️ Lo siguiente — EMPIEZA POR AQUÍ

1. **I1 · hecho. Queda que el fundador vaya confirmando formatos.**
   Vive en Mercado → panel lateral → **«Revisar Unidades»**.

   La primera lectura sobre datos reales: **27 fichas bloqueadas están dentro
   de recetas**, con **€6.032,49** de inventario colgando de ellas. Casi todas
   son `heredado`: 700 ml exactos sin nada que lo respalde. No son datos
   corruptos, son datos que nunca se rellenaron — y el sistema acertó por
   casualidad en unos (Chartreuse sí es de 700) y falló en otros (400 Conejos
   es de 750) sin que nada los distinga.

   Al desplegar cada ficha bloqueada hay un corrector: se elige el tamaño del
   envase, se ve el cambio de coste **antes** de escribir, y queda
   `formatoVerificado` con su botón de deshacer. **Una ficha por operación.**

   Ese botón antes decía «Normalizar Catálogo» y **ejecutaba la migración a
   ciegas**: escribía la botella de 700 ml inventada en las 1.300 fichas y con
   ella recalculaba `standardPrice`. Prometía ser «reversible al reimportar»:
   **no hay deshacer**. La migración sigue en su módulo, sin botón que la
   dispare, y así debe quedarse.

2. **⚠️ `proveedor` está obsoleto y el pedido sigue agrupando por él.**
   Salió al hacer M2 y **no se ha tocado**, porque cambiarlo altera lo que se
   ve en la hoja de reposición y eso es decisión del fundador.

   En `types.ts`, `proveedor?: string` está marcado `@deprecated` a favor de
   `proveedores?: string[]` + `proveedorPreferente`. Pero
   `StockReplenishmentModal` agrupa por `ing.proveedor || 'unknown'`. Si el
   catálogo real ya usa el modelo nuevo, **todo cae en «Sin Proveedor
   Asignado»** y M2 no luce, porque no hay proveedor que guardar.

   **Cómo comprobarlo sin tocar nada:** abrir la hoja de reposición. Si casi
   todo aparece bajo «Sin Proveedor Asignado», es esto. La corrección sería
   agrupar por `proveedorPreferente ?? proveedores[0] ?? proveedor`, y es un
   cambio visible: enseñar antes/después.

3. **M1 parte 2 · la hoja de pedido a 0 €** — misma raíz que la compra, pero en
   bloque: avisar de cuántas líneas van sin precio antes de crear la hoja.

4. **Dos bugs de UX móvil reportados y abiertos:**
   - el **conteo físico** deja filas tapadas detrás de la franja fija;
   - el **modal de proveedores** queda por detrás del gradiente. Es un problema
     de *stacking context*, **no** de subir el `z-index` a lo bruto.

5. **Importador: trocear el `writeBatch`.** `recipeImporter.importIngredientsFromCsv`
   usa un solo batch y Firestore corta en 500. El patrón correcto ya está en
   `useOrders.createOrder`.

## Pendiente del fundador

- **`VITE_FIREBASE_APP_ID` en Vercel sigue con dos saltos de línea al final.**
  El código lo recorta y la app funciona, pero el valor sigue sucio. Fue la
  causa raíz de Mercado vacío y costó tres diagnósticos equivocados.
- **Depuración de categorías**: la herramienta está lista y previsualiza 724
  fichas, con su botón de **deshacer**. Sin ejecutar.

## Código muerto localizado y NO retirado

- `src/components/grimorium/RecipeCard.tsx` — no lo importa nadie; la tarjeta
  real vive dentro de `RecipeList.tsx`.
- `src/features/ingredients/useIngredients.ts` — duplicado del de `hooks/`.
- `RecipeToolbar.tsx` e `IngredientToolbar.tsx` — importados y nunca
  renderizados.
- `src/views/UnleashView.tsx` + `src/views/unleash/` — no enrutado.

> **Si algo parece una función y no responde, comprueba primero si está
> conectado**, antes de darlo por roto y «arreglarlo».
