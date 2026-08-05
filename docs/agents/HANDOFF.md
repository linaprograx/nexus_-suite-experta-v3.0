# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-05
**Sesión anterior:** Codex
**Estado:** árbol limpio tras commit; TypeScript 0 errores y build correcto.

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

1. **Validación real en iPhone** del pellizco a dos dedos: no deben aparecer
   nodos de texto; comprobar también biblioteca como hoja inferior y
   deshacer/rehacer.
2. **`PLAN-GRIMORIO-MERCADO.md`**, en sesión separada: diagnosticar los tres
   bugs de datos en móvil antes de cambiar diseño. El catálogo de proveedores
   requiere las cuatro decisiones del usuario escritas en ese plan antes de
   programar.
3. Menores de Pizarrón B6/B7 y la infraestructura, solo cuando se prioricen.

## Recordatorios críticos

- `engine/renderer.ts`, `engine/interaction.ts` y `state/store.ts` son núcleo
  sensible. Punto de retorno: etiqueta `pre-merge-frosty`.
- Antes de asumir que una función está rota, comprobar que esté conectada. Este
  módulo ya acumuló varios componentes o ramas escritos pero nunca montados.
- Una propiedad debe tener una sola fuente de verdad: herramientas en
  `pizarronTools.tsx`, propiedades de nodo en `Inspector`, y tema en
  `UIContext`.
