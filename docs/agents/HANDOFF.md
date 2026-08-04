# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-03
**Sesión anterior:** Claude Code
**Estado:** árbol limpio, TypeScript 0 errores, build correcto, todo desplegado

## Dónde se trabaja

| | |
|---|---|
| **Rama de desarrollo** | `feat/mobile-v1-unified` ← **trabaja aquí** |
| **Worktree** | `/Users/lianalviz/nexus-suite-mobile-v1` |
| **Rama de producción** | `deploy/mobile-v1` |
| **URL en producción** | `nexus-suite-experta-v3-0.vercel.app` |
| **Servidor de desarrollo** | **puerto 3100** (nunca el 3000) |

> ⚠️ Ese worktree **no tiene `node_modules`**. Antes de nada: `npm install`.
> Y `.env` no está versionado: si la app arranca con "Firebase configuration
> incomplete", cópialo del checkout principal
> (`cp /Users/lianalviz/nexus_-suite-experta-v3.0/.env .env`).

### Desplegar

`deploy/mobile-v1` **desciende** de la rama de desarrollo, así que el despliegue
es un avance directo — ya no hace falta aplanar nada:

```bash
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

Cada push despliega a producción automáticamente. Las variables de entorno viven
en el entorno **Production** de Vercel; si un build falla por variables ausentes,
es que se añadieron solo a Preview: son entornos separados.

## Qué se hizo en esta sesión

**18 commits.** Resumen; el detalle y el porqué están en `WORKLOG.md`.

### Pizarrón móvil: plan completo (P0–P4)

- **P0** `MobileContextPanel` — un solo panel contextual, que reutiliza el
  Inspector entero vía su prop `embedded`.
- **P1** `MobileToolStrip` — herramientas a tira horizontal sobre la barra de
  navegación. La lista vive en `pizarronTools.tsx`, compartida con el rail de
  escritorio.
- **P2** barra superior mínima: Posición y Alinear bajan al panel contextual.
- **P3** modo consulta — disponible, pero **ya no por defecto**. Se entra
  editando: arrancar sin poder seleccionar se leía como un fallo.
- **P4** `useCanvasGestures` — pellizcar para zoom y dos dedos para desplazar.

### Segunda auditoría de Pizarrón — cerrada

Ver `AUDIT-PIZARRON.md`. Los tres graves y los tres medios, resueltos:

- Deshacer y rehacer en móvil (existían en el store, sin exponer).
- Biblioteca de 320px a hoja inferior.
- Umbral único de doble toque (había 300ms y 400ms para el mismo gesto).
- **727 líneas** de código muerto o duplicado eliminadas.

### Correcciones de toda la app

Modo oscuro que fallaba al primer toque, área segura en las cabeceras, arranque
en Dashboard, cerrar sesión en móvil, degradados a sangre, login compacta.

## ⏸️ Lo que queda — EMPIEZA POR AQUÍ

1. **`docs/agents/PLAN-GRIMORIO-MERCADO.md`** — trabajo grande y **para una
   sesión aparte**. Tres bugs de datos en móvil (inventario, selector de
   ingredientes y mercado vacíos pese a verse en escritorio) y el cambio de
   Mercado a catálogo de proveedores de Madrid. Tiene **cuatro decisiones que
   hay que tomar con el usuario** antes de escribir una línea.

2. **Restos menores de Pizarrón** — B6 y B7 en `AUDIT-PIZARRON.md`: medidas de
   escritorio sueltas y ausencia de atajos táctiles.

3. **Infraestructura** (detalle en `CONTEXT.md`): desplegar el `ai-gateway`,
   rotar las claves de Gemini y Stripe, activar Stripe.

## ⚠️ Antes de tocar Pizarrón, lee esto

Este módulo ha dado **cuatro casos de código escrito y nunca conectado**:
`isMobileMode`, `editingImageId`, `ShapeSelector` y `ColorPickerModal`, más una
rama `else` en el renderer que jamás se ejecutó. Tres ya se limpiaron.

> **Si algo parece una función y no responde, comprueba primero si está
> conectado**, antes de darlo por roto y "arreglarlo".

Y la lección que más tiempo costó, al retirar `MiniToolbar`:

> **Comparar contra un solo componente no basta para declarar algo único.**
> Se dieron por exclusivas tres funciones que ya vivían en `TopBar`, en
> `MenuDesignInspector` y en los atajos de teclado. Hay que buscar en todo
> `src/`, no en el vecino.

## Verificación pendiente

Lo desplegado hoy **no está probado con el dedo en su totalidad**. El usuario
prueba en un iPhone real; el agente no puede, porque `env(safe-area-inset-*)`
vale 0 fuera de un móvil y los gestos táctiles no se reproducen en un navegador
de escritorio.

Sin confirmar: la biblioteca como hoja inferior, deshacer/rehacer, y que el
borrado de `MiniToolbar` no haya dejado hueco en escritorio.

Punto de retorno si algo del motor se rompe: etiqueta **`pre-merge-frosty`**.
