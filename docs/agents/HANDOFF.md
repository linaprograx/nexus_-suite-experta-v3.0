# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-02
**Sesión anterior:** Claude Code
**Estado:** árbol limpio, TypeScript 0 errores, build correcto

## 🚀 Hay despliegue en producción

Esto es nuevo desde el último relevo y **cambia cómo se trabaja**:

| | |
|---|---|
| **URL en producción** | `nexus-suite-experta-v3-0.vercel.app` |
| **Proyecto de Vercel** | `nexus-suite-experta-v3-0` (id `prj_GIIJu8AZfrDJtXW3Ydfd64zrU6R7`) |
| **Rama de producción** | `deploy/mobile-v1` |
| **Rama de desarrollo** | `feat/mobile-v1` ← **trabaja aquí** |

**Cada push a `deploy/mobile-v1` despliega a producción automáticamente.**

### El flujo de despliegue, y por qué es así

`deploy/mobile-v1` es un **espejo aplanado** de `feat/mobile-v1`, no una rama
normal. Motivo: el historial de `feat/mobile-v1` arrastra `ai-gateway/.env` con
una clave de Stripe, y la protección de secretos de GitHub bloquea el push.

Para desplegar:

```bash
git checkout deploy/mobile-v1
git checkout feat/mobile-v1 -- .     # trae el árbol, no el historial
git add -A && git commit -m "..."
git push origin deploy/mobile-v1
git checkout feat/mobile-v1          # vuelve a desarrollo
```

> ⚠️ **No uses `git merge` entre ambas.** Genera conflictos porque la rama de
> despliegue ya contiene la versión aplanada. El `checkout -- .` es el camino.

> ⚠️ **`.env` no está versionado.** Si al cambiar de rama la app deja de
> arrancar con "Firebase configuration incomplete", cópialo del checkout
> principal: `cp /Users/lianalviz/nexus_-suite-experta-v3.0/.env .env`

### Variables de entorno en Vercel

Están en el entorno **Production**. Si un build falla con "Missing required
environment variables", es que se añadieron solo a Preview: son entornos
separados. `VITE_AI_GATEWAY_URL` **no puede ir vacía** — el validador usa
`!process.env[key]` y la cadena vacía cuenta como ausente.

## Dónde estamos

Fase **M3 — adaptación vista por vista**. Ver `ROADMAP.md`.

## ⏸️ Lo que quedó a medias — EMPIEZA POR AQUÍ

**Hay una auditoría completa de Pizarrón en `docs/agents/AUDIT-PIZARRON.md`.**
Léela antes de tocar ese módulo: lleva archivo:línea de cada hallazgo,
clasificado en graves/medios/bajos, y una sección de "qué NO tocar".

Lo más rentable ahora, por orden:

1. **G2 de la auditoría** — el mismo defecto de props cableadas está copiado en
   4 inspectores más, y cada uno descarta campos distintos. La corrección buena
   no es parchear uno a uno, sino cambiar la firma de
   `VisualEffectsController` para que reciba el nodo y una sola función de
   guardado.
2. **Punto 4 de M3** — compactar **Mercado**. Inventario ya se hizo
   (`StockInventoryPanel`, no `IngredientListPanel`, que fue un error de
   diagnóstico previo). Empieza por `viewMode === 'market'` en
   `GrimoriumView.tsx`.
3. **P1 de Pizarrón** — herramientas a tira horizontal inferior. Libera los
   464px que hoy ocupa el rail lateral.

## ⚠️ Verificación pendiente

Nada de la última tanda está verificado **en un móvil real**. Compila y pasa
TypeScript, que no es lo mismo que funcionar.

Sin confirmar por el usuario:
- Que rounding, opacidad y sombra ya respondan (G1).
- El panel contextual de Pizarrón con una selección real: que el toque en el
  agarre cicle entre las tres alturas.
- Que los elementos nuevos ya no nazcan enormes tras cubrir los 4 puntos de
  creación.
- El icono del orbe al añadir a la pantalla de inicio — **iOS cachea el icono**,
  hay que borrar el acceso directo y volver a añadirlo.

## Avisos

- **Servidor de desarrollo: puerto 3100.** No uses el 3000: hubo un incidente
  real depurando un worktree sin los cambios.
- El `ai-gateway` (3001) no está desplegado. En producción apunta a una URL de
  marcador, así que **la IA de Cerebrity y Avatar no responde**. No es un bug
  de layout.
- **La clave de Stripe sigue publicada** en el historial de `main`, repo
  público. Es de prueba, pero hay que rotarla —y la de Gemini— antes de
  conectar Stripe de verdad. El usuario quiere ayuda; no lo hagas solo.
