# Estado del relevo

> **Este archivo se SOBRESCRIBE entero al final de cada sesión.**
> No añadas al final: describe el estado *actual*. Lo acumulativo va a
> `WORKLOG.md`.

---

**Última actualización:** 2026-08-06 (noche)
**Sesión anterior:** Claude Code
**Estado:** árbol limpio, TypeScript 0 errores, build correcto, todo desplegado
y **verificado en la app en producción** a 390px y 1280px.

## Dónde se trabaja

| | |
|---|---|
| **Rama de desarrollo** | `feat/mobile-v1-unified` ← **trabaja aquí** |
| **Worktree** | `/Users/lianalviz/nexus-suite-mobile-v1` |
| **Rama de producción** | `deploy/mobile-v1` |
| **URL en producción** | `nexus-suite-experta-v3-0.vercel.app` |
| **Servidor de desarrollo** | **puerto 3100** (nunca el 3000) |

`node_modules` está instalado en este worktree. `.env` no se versiona: si
Firebase informa de configuración incompleta, cópialo del checkout principal
(`cp /Users/lianalviz/nexus_-suite-experta-v3.0/.env .env`).

### Desplegar

`deploy/mobile-v1` desciende de la rama de desarrollo; el despliegue es avance
directo:

```bash
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

Cada push despliega solo. **El hash del bundle de Vercel NO coincide con el de
tu build local** (compila por su cuenta), así que para saber si tu cambio ya
está en vivo busca una cadena tuya dentro del JS servido, no el nombre del
archivo:

```bash
until curl -s "https://nexus-suite-experta-v3-0.vercel.app/$(curl -s https://nexus-suite-experta-v3-0.vercel.app/ | grep -o 'assets/index-[^"]*\.js' | head -1)" | grep -q 'UNA_CADENA_DE_TU_CAMBIO'; do sleep 10; done
```

Tarda entre 1 y 7 minutos. Y el navegador cachea: para ver el cambio hay que
navegar con un parámetro distinto (`?v=8`), no basta con recargar.

---

## ⚠️ ACCIÓN PENDIENTE DEL USUARIO — importante

**La variable `VITE_FIREBASE_APP_ID` en Vercel contiene dos saltos de línea al
final.** Se pegó así. El código ya la recorta
(`src/config/firebaseConfig.ts`), de modo que la app funciona, **pero el valor
sigue sucio en el panel de Vercel**. Conviene limpiarlo: cualquier sitio que
lea la variable sin pasar por ese recorte volvería a romperse.

Por qué importaba tanto: `appId` no solo identifica la app, **forma parte de
rutas de Firestore** (`artifacts/${appId}/users/...`). Con el salto de línea
dentro, esas rutas apuntaban a una colección inexistente. Firestore **no da
error** —una colección que no existe es simplemente una colección vacía—, así
que el fallo se veía como "no hay datos". Fue la causa raíz de Mercado vacío,
del catálogo vacío, del selector de ingredientes sin resultados y de los ~1300
"conflictos de stock". Costó **tres diagnósticos equivocados** antes de dar con
ella.

---

## Qué se hizo en esta sesión

Detalle y motivos en `WORKLOG.md`. Resumen:

- **Causa raíz del `appId`** (arriba). Mercado pasó de vacío a **1367
  productos**; el selector de ingredientes de recetas volvió a listar.
- **Pizarrón**: el pellizco de dos dedos creaba nodos de texto; la fuente no
  escalaba al redimensionar un texto suelto.
- **Grimorio móvil**: la cabecera es ahora **una sola capa fija** que contiene
  título, pestañas, iconos, buscador y filtros. Ver la decisión
  *"Una franja fija es UNA capa"* en `CONTEXT.md` — **léela antes de tocarla**.
- Pestaña de borde derecha que no abría nada; recuento de Mercado cortado a
  "1…".

## ⏸️ Lo que queda — EMPIEZA POR AQUÍ

1. **Verificación en iPhone real.** Nada de la franja fija está confirmado con
   el dedo. `env(safe-area-inset-*)` vale 0 fuera de un móvil y las barras de
   Safari se recogen al scrollear, así que el ajuste fino solo se ve allí.
   Concretamente sin confirmar: el pliegue del título (umbral de 64px y
   tolerancia de 6px al temblor del dedo, en `useCabeceraPlegable.ts`).

2. **`docs/agents/PLAN-GRIMORIO-MERCADO.md`** — la Parte 1 (bugs de datos) está
   **resuelta**; queda la **Parte 2**: convertir Mercado en catálogo de
   proveedores de Madrid. Tiene **cuatro decisiones que tomar con el usuario**
   antes de escribir código.

3. **Restos de Pizarrón** — B3, B6 y B7 en `AUDIT-PIZARRON.md`.

4. **Infraestructura** (detalle en `CONTEXT.md`): desplegar el `ai-gateway`,
   rotar claves de Gemini y Stripe, activar Stripe.

## Código muerto localizado y NO retirado

No se tocó por no mezclarlo con lo urgente. Verifica antes de borrar:

- `src/features/ingredients/useIngredients.ts` — duplicado de
  `src/hooks/useIngredients.ts`. **No lo importa nadie.**
- `RecipeToolbar.tsx` e `IngredientToolbar.tsx` — importados en
  `GrimoriumView.tsx` y **nunca renderizados**.

Son el quinto, sexto y séptimo caso del patrón de este proyecto:

> **Si algo parece una función y no responde, comprueba primero si está
> conectado**, antes de darlo por roto y "arreglarlo".

## ⚠️ Cómo NO repetir los errores de esta sesión

Tres veces se rompió Grimorio entregando cambios que compilaban. Las causas,
por orden de gravedad:

1. **Un cambio "de móvil" que no estaba limitado a móvil.** Se limitó la
   *posición* con `sticky lg:static` y se olvidó el *fondo*, que pintó un
   bloque blanco sólido en escritorio. **Limita el componente entero, no una
   propiedad.**
2. **Reestructurar `StackedMobileShell`**, del que cuelgan las tres columnas de
   Grimorio entero: rompe las tres pestañas a la vez. Añade props opcionales
   apagadas por defecto; no reorganices su árbol.
3. **Entregar sin mirar.** TypeScript y el build no ven un rectángulo blanco.
   **Verifica en el navegador, midiendo el DOM**, antes de dar algo por hecho —
   no después.

Punto de retorno si el motor de Pizarrón se rompe: etiqueta
**`pre-merge-frosty`**.
