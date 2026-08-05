# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-05
**Sesión anterior:** Codex
**Estado:** Inventario móvil compactado y listo para desplegar/probar; TypeScript y build correctos.

## Dónde se trabaja

| | |
|---|---|
| **Rama de desarrollo** | `feat/mobile-v1-unified` ← **trabaja aquí** |
| **Worktree** | `/Users/lianalviz/nexus-suite-mobile-v1` |
| **Rama de producción** | `deploy/mobile-v1` |
| **URL en producción** | `nexus-suite-experta-v3-0.vercel.app` |
| **Servidor de desarrollo** | **puerto 3100** (nunca el 3000) |

`node_modules` está instalado en este worktree. `.env` no se versiona: si
Firebase informa de configuración incompleta, cópialo del checkout principal.

### Desplegar

`deploy/mobile-v1` desciende de la rama de desarrollo; el despliegue es avance
directo:

```bash
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

No se ha desplegado esta sesión.

## Qué se cerró en esta sesión

### Grimorio — diagnóstico read-only y roadmap transversal

- Se trazaron los tres bugs móviles de datos sin cambiar código. Inventario no
  renderiza el catálogo de ~1300 ingredientes: construye stock desde compras
  y movimientos. Las alertas corresponden a compras huérfanas/sin vínculo.
- El selector de vínculo recibe `allIngredients`, el mismo catálogo que Mercado;
  si resulta vacío hay que comprobar la consulta/hook en la sesión afectada.
- Mercado móvil y escritorio consumen la misma `IngredientListPanel` y el mismo
  `allIngredients`; el shell móvil solo reubica columnas. No hay evidencia para
  corregir CSS o crear una fuente móvil distinta.
- Se reescribió `PLAN-GRIMORIO-MERCADO.md` como roadmap coordinado de Recetas,
  Inventario y Mercado: catálogo, pedido, facturas, recetas compartidas y guía
  interna. Pizarrón y Oráculo permanecen fuera.

### Grimorio — primera mejora móvil visible

- `StockInventoryPanel` ahora deja el scroll al documento en móvil (las alturas
  y el `overflow` interno quedan tras `lg:`), de acuerdo con el patrón de
  `StackedMobileShell`. En escritorio no cambia.
- En móvil se compactaron márgenes, indicadores y tarjetas métricas de
  Inventario para que se vea más lista operativa y menos tablero de tarjetas.
- `npm run typecheck` y `npm run build` correctos. El build mantiene avisos
  preexistentes de `eval`, CSS y tamaño de chunks.

### Pendiente imprescindible

En un iPhone/sesión autenticada a 390px, capturar el estado de
`useIngredients` (longitud/loading/error), compras y stock calculado. No hacer
la corrección hasta distinguir en tiempo real: catálogo vacío, error Firestore,
filtro/render, o compras huérfanas.

### Tema, escritorio

- El botón de claro/oscuro de la barra lateral resuelve ahora el **tema
  efectivo**, también cuando la preferencia guardada es `system`. Usa el mismo
  dato que móvil para que texto e icono estén siempre sincronizados.
- El sol de “Modo claro” es exactamente el mismo icono correcto que se ve en
  móvil.

### Pizarrón, escritorio y móvil

- El Inspector de escritorio no se monta con la selección vacía. La tarjeta
  que decía `Multiple Selection` era un estado fantasma: sin selección no hay
  inspector; con una o varias selecciones se muestran las propiedades reales.
- Se verificó y confirmó la corrección pendiente de gesto multitáctil: durante
  pellizco o arrastre con dos dedos, el motor de edición ignora los eventos
  pointer. Evita que un pellizco active por accidente el doble toque y cree
  un nodo `Type something...`.

### Verificación

- `npm run typecheck` correcto.
- `npm run build` correcto.
- Permanecen avisos anteriores: `eval` en `ingredientParser.ts`, dos reglas
  CSS con interpolaciones literales y avisos de tamaño/dynamic import. No se
  introdujeron ni se modificaron en esta sesión.

## Lo siguiente

1. Desplegar esta mejora y validar **Inventario** a 390px: scroll de página,
   métricas compactas, filas legibles y acceso a detalle.
2. **Validación real Grimorio a 390px** con sesión afectada y los cuatro datos
   de instrumentación descritos en `PLAN-GRIMORIO-MERCADO.md`.
3. Acordar las cuatro decisiones del catálogo global antes de programarlo;
   después validar un proveedor de prueba.
4. Validación real en iPhone del pellizco de Pizarrón y luego sus menores B6/B7,
   solo cuando se prioricen.

## Recordatorios críticos

- `engine/renderer.ts`, `engine/interaction.ts` y `state/store.ts` son núcleo
  sensible. Punto de retorno: etiqueta `pre-merge-frosty`.
- Antes de asumir que una función está rota, comprobar que esté conectada. Este
  módulo ya acumuló varios componentes o ramas escritos pero nunca montados.
- Una propiedad debe tener una sola fuente de verdad: herramientas en
  `pizarronTools.tsx`, propiedades de nodo en `Inspector`, y tema en
  `UIContext`.
