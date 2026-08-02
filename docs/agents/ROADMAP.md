# Roadmap — Vista móvil

## Por qué

El **90% de los usuarios previstos** usará la app en el móvil, a diario, en
barra. El diseño nació de escritorio: tres columnas para casi todo.

En móvil esas columnas se apilaban en vertical, con dos consecuencias: scroll
interminable y pérdida del sentido general de la app. Y el responsive existente
solo **reordenaba** elementos, no los **escalaba** en proporción a la pantalla.

---

## Fases

### ✅ M0 — Escala fluida y hook responsive fiable

- Escala fluida con `clamp()` en `tailwind.config.js` (`fontSize` 2xl→9xl y
  tokens `fluid-*`). El máximo iguala el valor fijo anterior, así que
  **escritorio no cambia**; solo se encogen las pantallas pequeñas.
- `src/hooks/useResponsive.ts` sustituye al viejo `useIsMobile.ts`, que estaba
  roto: usaba `matchMedia('max-width: 768px')` mientras el CSS usa `md:` como
  `min-width: 768px`. Se contradecían exactamente en 768.

### ✅ M1 — Las tres columnas pasan a ser tres estados

- `BottomSheet` con puntos de anclaje, arrastre y descarte sensible a la
  velocidad.
- Rama móvil en `PremiumLayout`: el contenido principal ocupa la pantalla, y
  las columnas laterales pasan a ser hojas inferiores.

### ✅ M1.1 — Regresiones y navegación

- **Autenticación**: popup en vez de redirect (ver `CONTEXT.md`).
- **Página de login**: `100dvh`, scroll vertical permitido, centrado con
  `m-auto`, padding reducido en móvil.
- **Umbral movido de `md` a `lg`** en todo el layout (ver `CONTEXT.md`).
- **Barra de navegación inferior** reescrita: se alimenta de `APP_SECTIONS` +
  `sectionsStore`, activo por ruta, 5 destinos y el resto tras "Más".
  Antes recibía una cadena que no coincidía nunca con el enum `PageName`, así
  que **el destino activo no se resaltaba jamás**.
- **Eliminada la cabecera móvil** (logo + hamburguesa): ~64px recuperados.
- **Cabecera de Grimorio** reestructurada en dos niveles: las 3 pestañas ya no
  comparten tira con scroll con los 5 botones de acción (antes, cambiar a
  Inventario exigía descubrir un barrido lateral).
- **Gesto desde los bordes** para abrir Análisis / Detalle, con pestañas de
  color visibles como pista.
- **Pizarrón**: botón de salir movido abajo a la izquierda; arriba chocaba con
  los controles de zoom del canvas.
- **Notificaciones**: panel translúcido con efecto glass.

### ⬜ M2 — Ergonomía táctil

- Objetivos táctiles de 44px como mínimo.
- Modales de escritorio → hojas inferiores en móvil.
- Respeto de `env(safe-area-inset-*)`.
- Controles en la zona alcanzable por el pulgar.

### 🔄 M3 — Adaptación vista por vista ← **AQUÍ ESTAMOS**

**La causa común del "no hay scroll":** la rama móvil de `PremiumLayout` usaba
`h-full`, así que medía exactamente el alto del `<main>` que scrollea. Su
`scrollHeight` nunca superaba al `clientHeight` y el contenido sobrante se
recortaba en silencio. Ahora es `min-h-full` y el scroll lo lleva la página.

Corolario: **toda vista debe gatear su `h-full` y su `overflow` tras `lg:`**.
Si una vista los fija en móvil, vuelve a romper el scroll.


Por orden de gravedad:

1. ✅ **Avatar** — las 5 sub-vistas fijaban `h-full` + `overflow-hidden`.
   Gateado tras `lg:`. Pestañas a tira deslizable, cabecera reducida, saltos de
   rejilla movidos a `lg:`, y el indicador de 4 pasos de Competición ahora
   muestra solo la etiqueta del paso activo (las cuatro no caben en 390px).
   No usa `StackedMobileShell`: son rejillas de tarjetas, no columnas.
   En **Núcleo**, el contenedor de las 4 tarjetas de estado tenía
   `overflow-hidden` sin gatear y las centraba, así que en móvil salían a ancho
   completo, centradas y recortadas. Ahora fluye y la rejilla es 2×2, con las
   tarjetas a 200px de alto en vez de 260.
2. ✅ **Cerebrity** — migrado a `StackedMobileShell`. Sus tres columnas
   (historial · contenido · poderes) se declaran una sola vez y las consumen
   tanto la rejilla de escritorio como la pila móvil. El historial deja de
   ocupar pantalla y pasa a hoja inferior. Además la raíz usaba
   `h-[calc(100vh-80px)]`, con 80px de una cabecera ya eliminada.
3. ✅ **Colegium** — mismo origen que el scroll de Grimorio. No tiene columna
   derecha: el perfil va a la hoja izquierda y el resto son secciones de
   contenido, que se apilan por naturaleza. Lo que sobraba era el ritmo
   vertical: `space-y-10` y `gap-6` entre bloques, más `p-8` en paneles que en
   390px se comen el ancho. Las fichas pequeñas pasan a 2 por fila.
4. **Inventario y Mercado** — tarjetas demasiado grandes y espaciadas. En móvil
   deberían ser **filas densas**, no tarjetas.
5. 🔄 **Pizarrón** — en curso. Resuelto: Inspector y barra de texto que se
   salían de pantalla, barra superior pisando el reloj de iOS, "Salir" solapado
   con el Inspector, dock y minimapa chocando con la navegación, y los nodos
   nuevos que nacían con medidas de escritorio (ver `nodeDefaults.ts`).

   **Pendiente: auditoría completa.** El módulo tiene 9 capas flotantes
   compitiendo por 390px. Lo hecho evita solapes y desbordes, pero un lienzo
   cómodo en móvil pide decidir *qué herramientas se muestran*, no solo dónde.
   Candidatos: rail de herramientas en tira horizontal inferior, Inspector
   plegable, y modo "solo lectura" para consultar una pizarra sin editarla.

### ⬜ M4 — Rendimiento en móvil

---

## Ideas aparcadas

- **"Modo Servicio"**: vista de altísimo contraste y objetivos grandes para
  usar en barra, con poca luz y las manos ocupadas.
- Rediseño estético de la barra inferior (funciona, falta pulir el diseño).
