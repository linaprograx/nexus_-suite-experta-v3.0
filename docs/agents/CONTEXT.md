# Contexto del proyecto

Hechos estables y decisiones tomadas. Cambia poco. Si tomas una decisión de
arquitectura, anótala aquí **con su motivo** — una decisión sin motivo se
revierte por accidente al mes siguiente.

---

## Qué es Nexus

React + TypeScript + Vite + Firebase (Firestore). SPA de gestión para
bares y coctelería de autor.

Módulos: **Grimorio** (Recetas / Inventario / Mercado), **Cerebrity** (IA
creativa), **Pizarrón** (canvas colaborativo), **Avatar**, **Colegium**,
**Dashboard**, **Personal** (perfil, ajustes, membresía).

## Rutas de Firestore

| Datos | Ruta |
|---|---|
| Recetas | `users/{uid}/grimorio` |
| Ingredientes | `artifacts/{appId}/users/{uid}/grimorio-ingredients` |
| Compras | `users/{uid}/purchases` |
| Movimientos de stock | `users/{uid}/stock_movements` |
| Carta activa | `users/{uid}/menu_items` |
| Auditoría | `users/{uid}/audit_log` |
| Notificaciones | `artifacts/{appId}/users/{uid}/notifications` |

## Piezas centrales

| Qué | Dónde |
|---|---|
| Motor de costes (**fuente única**) | `src/core/costing/costCalculator.ts` |
| Normalización de unidades | `src/utils/packNormalization.ts` |
| Secciones navegables (**fuente única**) | `src/config/appSections.ts` |
| Visibilidad de secciones | `src/store/sectionsStore.ts` |
| Hook responsive | `src/hooks/useResponsive.ts` |
| Hoja inferior | `src/components/ui/BottomSheet.tsx` |
| **Modelo de layout móvil** | `src/components/layout/StackedMobileShell.tsx` |
| Gesto de bordes | `src/hooks/useEdgeSwipe.ts` |
| Layout de 3 columnas | `src/components/layout/PremiumLayout.tsx` |

`appSections.ts` alimenta a la vez el sidebar de escritorio, la barra inferior
de móvil y el centro de mando de secciones en Personal. **No crees una segunda
lista de secciones.**

---

## Decisiones de arquitectura

### El umbral móvil es `lg` (1024px), no `md` (768px)

Tres columnas necesitan ~1024px para ser usables. A 800px la rejilla de recetas
resuelve a 240 / 352 / 208 px: eso no es una vista de tablet, es una de
escritorio estrujada. Por eso **las tablets reciben el mismo trato apilado que
los móviles**.

Consecuencia en todo el código de layout:

```
hidden md:flex    →  hidden lg:flex
md:hidden         →  lg:hidden
md:grid-cols-[…]  →  lg:grid-cols-[…]
md:h-full         →  lg:h-full
md:overflow-*     →  lg:overflow-*
```

> Si ves un `md:` gobernando **estructura** (altura, overflow, columnas,
> visibilidad), es un bug. Los `md:` de puro espaciado o tipografía están bien.

### El modelo móvil es "tres columnas → tres estados", y vive en un solo sitio

`StackedMobileShell` es **la** implementación del layout móvil: el contenido
principal ocupa la pantalla y las columnas laterales pasan a ser hojas
inferiores, que se abren arrastrando desde el borde o tocando la pestaña de
color que lo señala.

Apilar las columnas en vertical —la respuesta ingenua del responsive— convierte
cada pantalla en un scroll interminable y pierde el sentido de dónde estás.

Lo consumen dos tipos de vista:
- **`PremiumLayout`**, que delega en él (Grimorio, Colegium…).
- **Vistas que pintan su propio fondo** y por eso no pueden ceder el shell
  entero: Cerebrity lo usa directamente para conservar su degradado por
  pestaña.

> Si añades una vista con columnas laterales, **úsalo**. No escribas otra
> variante: el gesto, las hojas y las pestañas deben comportarse igual en
> toda la app.

Ojo: no toda vista con rejilla necesita este shell. Las de Avatar son rejillas
de **tarjetas**, no columnas izquierda/centro/derecha; ahí basta con que la
rejilla colapse a una columna y que los saltos estén en `lg:`.

### La escala `spacing` de Tailwind NO se sobrescribe

`tailwind.config.js` define una escala fluida con `clamp()` para `fontSize`
(2xl→9xl) y tokens `fluid-xs`…`fluid-xl` para espaciado.

Pero la escala `spacing` base se deja intacta **a propósito**: la comparten
`p-6` (padding) y `w-6`/`h-6` (tamaño de iconos). Tocarla encogería todos los
iconos de la app junto con los márgenes.

### Autenticación: popup, nunca redirect

`signInWithRedirect` está roto en Safari y Chrome modernos. El redirect rebota
por `<proyecto>.firebaseapp.com` y el particionado de almacenamiento de
terceros impide leer el estado pendiente al volver: `getRedirectResult()`
devuelve `null` y el usuario aterriza otra vez en el login.

Ahora es **popup siempre**, con redirect solo como respaldo si el navegador
bloquea el popup. Firebase documenta este problema y recomienda lo mismo.

### Las capas de fondo van ancladas a UNA pantalla, no a `inset-0`

Efecto secundario de pasar las raíces de `h-full` a `min-h-full` para recuperar
el scroll: un fondo `absolute inset-0` dejó de medir una pantalla y pasó a
cubrir **todo el contenido**. Como los degradados se desvanecen al 45%, ese 45%
se convirtió en ~1000px de color macizo y Grimorio se veía verde plano.

Patrón correcto para degradados, ruido y halos:

```
absolute inset-x-0 top-0 h-[100dvh] lg:h-full
```

Aplica a `PremiumLayout`, `CerebrityView` y `AvatarView`.

### Nada flotante por debajo de 60px + área segura

Ahí vive la barra de navegación. Cualquier elemento `fixed`/`absolute` anclado
abajo debe usar:

```
bottom-[calc(60px+env(safe-area-inset-bottom)+0.5rem)] lg:bottom-0
```

Ya mordió a la píldora de Avatar (`bottom-12` = 48px, por debajo de la barra) y
al dock de colapsados de Pizarrón (`h-24` sobre los 96px inferiores).

### Los overlays posicionados por JS necesitan clamp con el ancho REAL

En Pizarrón, el Inspector usaba `left:50%` + `marginLeft:220px`: en 390px eso
es x=415, entero fuera de pantalla. Y el clamp de MiniToolbar asumía 560px de
ancho fijo, con lo que en un móvil devolvía siempre el mismo valor y la barra
se salía igualmente.

En móvil estos paneles se anclan abajo a ancho completo en vez de seguir a la
selección; el espacio no da para otra cosa.

### `100dvh`, no `100vh`, en pantallas completas

En iOS Safari, `vh` incluye las barras que se colapsan: `100vh` mide más de lo
que se ve y recorta el contenido por abajo.

### Centrado vertical con `m-auto`, no `items-center`

Cuando el contenido puede ser más alto que el viewport, `items-center` deja
**inalcanzable** lo que desborda por arriba. `margin: auto` no.

### Botones con color propio: `dedupeVariant()`

`src/components/ui/Button.tsx` elimina las clases de color de la variante
cuando quien lo llama pasa las suyas. Sin eso, las utilidades de Tailwind
comparten especificidad y el `bg-primary` de la variante (casi blanco en modo
oscuro) ganaba de forma impredecible → botones blancos sobre blanco.

---

## Problemas conocidos que NO son bugs de layout

- **`ERR_CONNECTION_REFUSED` a `localhost:3001`** en Cerebrity y Avatar: es el
  `ai-gateway`, que no está levantado. La IA no responderá aunque el layout
  sea perfecto.
- **Avisos de Recharts** `width(-1) and height(-1)`: contenedores de gráficas
  sin altura resuelta. Real, pero de baja prioridad.
- **`THREE.WebGLRenderer: Context Lost`**: el fondo WebGL del login. Cosmético.

## Pendientes fuera del trabajo de móvil

- **Desplegar el `ai-gateway`** con URL permanente, y proteger las rutas sin
  autenticar (`/api/text`, `/api/image`, `/vertex/*`, `/stripe/create-*`)
  **antes** de desplegarlo.
- **Rotar las claves** de Gemini y Stripe (estuvieron en un repo público). El
  usuario quiere ayuda para hacerlo, no lo hagas por tu cuenta.
- **Stripe**: el código está listo, faltan credenciales. Es lo **último** antes
  de pasar a producción, por decisión explícita del usuario.
