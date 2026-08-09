# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-09 (noche)
**Sesión anterior:** Claude Code
**Estado:** árbol limpio, TypeScript 0 errores, build correcto, **todo
desplegado a las dos ramas y verificado en producción con la sesión del
fundador**.

## Lo primero que tienes que entender

**Recetas está CERRADO.** Los cuatro criterios económicos que había sueltos se
unificaron hoy: `Escandallo = Ficha = Análisis = Lista`. No lo reabras.

**El plan canónico de Inventario y Mercado es
`docs/agents/PLAN-INVENTARIO-MERCADO.md`.** Manda sobre el orden. Los otros
documentos de plan describen el destino, no la secuencia.

Y hay dos auditorías que **contradicen la intuición** y conviene leer antes de
tocar nada:

- **`AUDIT-IDENTIDAD-PRODUCTO.md`** — el flujo de compra **no** crea duplicados;
  la arquitectura maestro/ofertas **ya existe** en el modelo; y los duplicados
  del catálogo **son** hoy las ofertas de Mercado, así que fusionarlos sin
  trasladar antes su precio a `supplierData` rompería el «N opc.».
- **`AUDIT-24-PREGUNTAS.md`** — respuestas a las 24 preguntas del prompt maestro
  del fundador, con qué estaba ya hecho y qué era nuevo.

## Dónde se trabaja

| | |
|---|---|
| **Rama de desarrollo** | `feat/mobile-v1-unified` ← **trabaja aquí** |
| **Worktree** | `/Users/lianalviz/nexus-suite-mobile-v1` |
| **Rama de producción** | `deploy/mobile-v1` |
| **URL en producción** | `nexus-suite-experta-v3-0.vercel.app` |
| **Servidor de desarrollo** | puerto asignado por `PORT`, respaldo 3100 |

### Desplegar — **a las DOS ramas, siempre**

```bash
git push origin feat/mobile-v1-unified
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

Empujar solo a `feat/…` **no despliega nada**. Y después **verifica leyendo el
bundle servido**, no el push:

```bash
curl -s "https://nexus-suite-experta-v3-0.vercel.app/$(curl -s https://nexus-suite-experta-v3-0.vercel.app/ | grep -o 'assets/index-[^"]*\.js' | head -1)" -o /tmp/prod.js && grep -c -F 'UNA_CADENA_TUYA' /tmp/prod.js
```

Tarda 1-7 minutos. **Vuelca el bundle a un fichero y haz grep sobre el
fichero**: meter 4 MB de JS minificado en una variable de shell revienta zsh con
`character not in range`. Y usa marcadores **solo ASCII** — un `·` en el patrón
también lo rompe. Las dos cosas costaron diez minutos de falso negativo.

## Reglas que no se negocian

**Datos REALES** (~1.327 ítems, ~1.367 referencias). Ninguna acción destructiva
para verificar: nada de borrados, ajustes de stock ni resolución de conflictos.
Si hace falta probar algo que escribe, se lo pides al fundador o le pides
permiso explícito. Abrir un modal y **cancelar** sí es aceptable.

**Migraciones**: informe en seco primero, aprobación después, y **las ejecuta el
fundador**, no el agente.

**Motor económico**: `core/costing/costCalculator.ts` es la única fuente de
coste y `profitabilityEngine.ts` la única de rentabilidad. Nada de fórmulas
paralelas. `buildStockFromPurchases` **no se toca**: lo consume el motor de
coste, y cambiar su agrupación movería el coste de todas las recetas.

## Estado de las fases

| Fase | Estado |
|---|---|
| Fase 0 · cimientos | `origen` en movimientos ✅ · I2 semáforo ✅ · I3 variación ✅ · I4 valor único ✅ · **I1 unidades pendiente** |
| Identidad A · informe de duplicados | ✅ funcionando con datos reales |
| Identidad B · `masterProductId` + `proveedorPreferente` | ✅ sin consumidores |
| Identidad C · consolidar en lectura | ✅ verificado sin regresión |
| **Identidad D · reconciliar** | ⬜ **siguiente**, requiere aprobación |
| Fase 1 · pedido útil | M1 compra ✅ · **M1 hoja de pedido, M2 `providerId`, M3 cantidad pendientes** |

## ⏸️ Lo siguiente — EMPIEZA POR AQUÍ

1. **Fase D de identidad, un solo grupo.** Asignar un `masterProductId` real de
   los **16 de riesgo BAJO** del informe y comprobar en la app que las fichas se
   funden, el stock suma y el coste de las recetas no se mueve. **Escribe en
   datos: necesita el visto bueno del fundador.** Se deshace quitando el campo.
2. **I1 · unidades canónicas.** Informe en seco con diez columnas por ítem
   (unidad actual, propuesta, factor, stock, coste actual, coste resultante,
   recetas y sub-recetas afectadas, impacto, ambigüedades) y
   `BLOQUEADO PARA REVISIÓN` en todo lo que no se pueda determinar **con
   certeza**. No se infiere ningún valor. Desbloquea los grupos de riesgo MEDIO.
3. **M2 · `providerId` en el pedido**, y leerlo al recibir en vez de volver a
   deducirlo del ingrediente. Bloquea la agrupación de Inventario por proveedor.
4. **M1 parte 2 · la hoja de pedido a 0 €** — misma raíz que la compra, pero en
   bloque: avisar de cuántas líneas van sin precio antes de crear la hoja.
5. **Importador: trocear el `writeBatch`.** `recipeImporter.importIngredientsFromCsv`
   usa un solo batch y Firestore corta en 500 operaciones. El patrón correcto ya
   está en `useOrders.createOrder` (`CHUNK_SIZE = 500`).
6. **UX móvil** — conteo físico tapado por la franja fija; modal de proveedores
   por detrás del gradiente (**stacking context, no un z-index a lo bruto**);
   jerarquía de «Compra rápida» y de «Comparativa»; buscador y filtros para las
   611 reglas.

## Decisiones tomadas por el fundador

- **Precio con varias ofertas:** manda el **proveedor preferente** aunque otro
  sea más barato, y **se señala** la alternativa. Sin preferente, manda el más
  barato y se avisa de configurarlo. Implementado en
  `core/identity/offerSelection.ts`, **sin conectar al motor todavía**.
- **Agrupación visual:** Inventario por **familia** (con conmutador a
  proveedor); Mercado por **proveedor**. La búsqueda atraviesa las secciones
  cerradas.
- **Zero Waste** dejó de tener icono propio: es la tercera pestaña de
  «Rentabilidad y producción».

## ⚠️ Acción pendiente del fundador

`VITE_FIREBASE_APP_ID` en Vercel **sigue con dos saltos de línea al final**. El
código lo recorta (`src/config/firebaseConfig.ts`) y la app funciona, pero el
valor sigue sucio en el panel. Cualquier sitio que lea la variable sin pasar por
ese recorte volvería a romperse. Fue la causa raíz de Mercado vacío y costó tres
diagnósticos equivocados.

## Cómo NO repetir los errores de hoy

1. **Un contador que nunca puede cambiar no informa.** El «0 bloqueados» del
   informe de duplicados era cero **por construcción** y tranquilizaba en falso.
2. **`??` no es `||` cuando el cero es un valor posible.** Volvió a morder, esta
   vez en el importe de compras.
3. **Verifica la verificación.** Diez minutos perdidos con un bucle que fallaba
   por un carácter no ASCII en el patrón, no por el despliegue.
4. **Una heurística de nombres necesita saber qué palabras son familia.** Sin
   eso, el detector proponía fusionar `LICOR` con `LICOR 43`.

## Código muerto localizado y NO retirado

Verifica antes de borrar:

- `src/components/grimorium/RecipeCard.tsx` — **no lo importa nadie**; la
  tarjeta real vive dentro de `RecipeList.tsx`.
- `src/features/ingredients/useIngredients.ts` — duplicado de
  `src/hooks/useIngredients.ts`.
- `RecipeToolbar.tsx` e `IngredientToolbar.tsx` — importados y nunca
  renderizados.
- `src/views/UnleashView.tsx` + `src/views/unleash/` — no enrutado; su
  `SynthesisView` tiene el resultado escrito a mano.

> **Si algo parece una función y no responde, comprueba primero si está
> conectado**, antes de darlo por roto y «arreglarlo».
