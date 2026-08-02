# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-02
**Sesión anterior:** Claude Code (se agotó el límite)
**Rama:** `feat/mobile-v1` · último commit `ebf9ed9`
**Estado del árbol:** limpio, TypeScript 0 errores, build correcto

## Dónde estamos

Fase **M3 — adaptación vista por vista**. Puntos 1, 2 y 3 cerrados.
El punto 4 está **a medias** (ver abajo). El 5 sin empezar.

## ⏸️ Lo que quedó a medias — EMPIEZA POR AQUÍ

**Punto 4 de M3: compactar Inventario y Mercado.**

- ✅ **Inventario hecho** (`src/components/grimorium/IngredientListPanel.tsx`,
  commit `ebf9ed9`): padding de ficha 16→10px, hueco 16→8px, señales de mercado
  ocultas en móvil, precio de 18→16px.
- ⬜ **Mercado sin tocar.** Es el mismo tipo de problema: fichas grandes y
  espaciadas. Empieza mirando `viewMode === 'market'` en
  `src/views/GrimoriumView.tsx` (líneas ~622, ~637, ~681, ~836) para localizar
  qué componente pinta esa lista, y aplícale el mismo criterio que a
  Inventario. El usuario lo describió así: *"hay que compactar las cards, me
  parecen muy grandes y espaciadas, se podría mostrar de otra forma"*.

**Punto 5 de M3: Pizarrón.** Sin empezar. Al tocar un elemento del canvas se
abren menús flotantes que **se salen de las dimensiones de la pantalla**.

## Lo cerrado en esta sesión

1. **Un solo modelo de layout móvil.** Se extrajo de `PremiumLayout` a
   `src/components/layout/StackedMobileShell.tsx`, y `PremiumLayout` ahora
   delega en él. Ver la decisión y su motivo en `CONTEXT.md`.
2. **Cerebrity** migrado a ese shell: sus tres columnas se declaran una vez y
   las consumen escritorio y móvil. El historial pasa a hoja inferior.
3. **Avatar**: scroll (las 5 sub-vistas fijaban `h-full`+`overflow-hidden`),
   rejilla 2×2 en Núcleo, indicador de pasos compactado en Competición.
4. **Colegium**: ritmo vertical (era el problema real, no las columnas).
5. **Pizarrón**: las plantillas no se añadían al doble toque.

## Reglas que NO debes romper

> **El umbral móvil es `lg` (1024px), no `md`.** Si ves un `md:` gobernando
> estructura —altura, overflow, columnas, visibilidad—, es un bug.

> **Toda vista debe gatear su `h-full` y su `overflow` tras `lg:`.** Si alguna
> los fija en móvil, rompe el scroll de toda la pantalla. Es el primer sitio
> donde mirar si el scroll se rompe otra vez.

> **Si añades una vista con columnas laterales, usa `StackedMobileShell`.** No
> escribas otra variante. Pero ojo: una rejilla de *tarjetas* no lo necesita —
> las de Avatar y Colegium no lo usan, y es deliberado.

Los tres motivos están razonados en `docs/agents/CONTEXT.md`.

## ⚠️ Verificación pendiente

Nada de lo hecho hoy está **verificado en pantalla con sesión iniciada**: el
agente no tiene la sesión de Firebase del usuario. Compila y pasa TypeScript,
que no es lo mismo que funcionar.

Sin confirmar visualmente:
- Fichas compactas de Inventario (lo último, sin ver).
- El scroll vertical en Avatar, Cerebrity, Colegium y Grimorio.
- Cerebrity con el historial en hoja inferior.
- Avatar Núcleo en rejilla 2×2.
- El gesto de arrastre desde los bordes y las pestañas de color.
- Las plantillas de Pizarrón al segundo toque.
- El efecto glass del panel de notificaciones.

**Pizarrón sigue siendo la verificación de mayor riesgo**: viene de una fusión
con 10 archivos en conflicto resueltos por criterio (commit `915c957`). El
usuario ya confirmó que funciona en general, pero conviene no construir encima
sin probar. Punto de retorno: etiqueta `pre-merge-frosty`.

## Avisos

- **Servidor de desarrollo: puerto 3100.** No uses el 3000: hubo un incidente
  real depurando un worktree que no tenía los cambios.
- El `ai-gateway` (puerto 3001) no está levantado. Los
  `ERR_CONNECTION_REFUSED` de Cerebrity y Avatar son eso, no fallos de layout.
- Quedan por hacer, fuera del trabajo de móvil: desplegar el gateway, rotar las
  claves y activar Stripe. Detalles en `CONTEXT.md`.
