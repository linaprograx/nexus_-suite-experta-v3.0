# Diario de trabajo

Memoria larga del proyecto. **Lo más reciente arriba.** Nunca se borra nada.

Cada entrada: qué se hizo, **por qué**, qué archivos, y qué quedó pendiente.
El "por qué" es lo que más vale dentro de tres semanas.

---

## 2026-08-02 (tarde) · Claude Code · Un solo modelo de layout móvil

**Qué**

- **`StackedMobileShell` extraído** de `PremiumLayout`, que ahora delega en él.
  Es *la* implementación del modelo "tres columnas → tres estados".
- **Cerebrity migrado** a ese shell. Sus tres columnas (historial · contenido ·
  poderes) se declaran una sola vez y las consumen la rejilla de escritorio y
  la pila móvil. Antes estaban duplicadas dentro del JSX.
- **Avatar**: las 5 sub-vistas fijaban `h-full` + `overflow-hidden`; Núcleo
  centraba y recortaba sus 4 tarjetas, ahora rejilla 2×2 a 200px de alto; el
  indicador de 4 pasos de Competición muestra solo la etiqueta activa.
- **Colegium**: ritmo vertical (`space-y-10`, `gap-6`, `p-8` → mitad en móvil),
  fichas pequeñas a 2 por fila.
- **Inventario**: fichas compactadas.
- **Pizarrón**: las plantillas no se añadían al doble toque.

**Por qué**

Que las vistas scrollearan no bastaba. Cerebrity seguía apilando sus columnas
en vertical, con lo que el historial —decenas de entradas— tapaba la pantalla
antes de llegar al contenido. El usuario lo dijo claro: *"debemos utilizar la
lógica que ya hemos creado en grimorio vista movil, para que todas las demas
secciones tengan sentido"*. El modelo bueno existía pero estaba encerrado
dentro de `PremiumLayout`.

**Decisión que conviene recordar**

Avatar y Colegium **no** usan el shell, y es deliberado: sus vistas son
rejillas de *tarjetas*, no columnas izquierda/centro/derecha. Forzarlo sería
esconder contenido principal detrás de un gesto. En Colegium el problema real
no eran las columnas —no tiene columna derecha— sino el ritmo vertical.

**Diagnóstico que ahorró trabajo**

El doble toque de Pizarrón parecía secuela de la fusión. No lo era:
`onDoubleClick` aparecía 3 veces antes y 3 después, sin cambios. La causa es
que el navegador se reserva el doble toque para el zoom y `dblclick` no llega
en táctil. Comprobar antes de asumir evitó revertir una fusión sana.

**Pendiente**

Mercado (mismo trabajo que Inventario) y los menús flotantes de Pizarrón, que
se salen de la pantalla. Nada verificado en pantalla con sesión iniciada.

---

## 2026-08-02 (mañana) · Claude Code · Navegación móvil y arreglo del login

**Qué**

- **Login con Google arreglado.** `OAuthButtons.tsx` usaba
  `signInWithRedirect` cuando el user-agent decía móvil. Ese flujo está roto
  en Safari y Chrome modernos: `getRedirectResult()` devolvía `null` y el
  usuario volvía a la pantalla de login. Ahora popup siempre, con redirect
  solo como respaldo. También se silencia el error al cerrar el popup a
  propósito, que antes se mostraba como fallo.
- **Página de login que desbordaba**: `min-h-screen` + `overflow-hidden`
  recortaba la tarjeta sin dejar hacer scroll. Ahora `100dvh`,
  `overflow-y-auto` y centrado con `m-auto`. Verificado a 360×640: contenido
  de 670px sobre 660px visibles, con el último botón alcanzable.
- **Umbral movido de `md` (768) a `lg` (1024)** en todo el layout. A 800px la
  rejilla de recetas daba columnas de 240/352/208px. Alcanza a
  `PremiumLayout`, `Sidebar`, `BottomSheet`, `GrimoriumView`, `AvatarView`,
  `ColegiumView`, `PersonalView`, `DashboardLayout`, `PizarronView`.
- **Barra inferior reescrita.** Ya existía, pero `App.tsx` le pasaba
  `sectionName.toLowerCase()` (`"grimorium"`) mientras el enum `PageName` vale
  `'Grimorio – Recipes'`: **no coincidía nunca**, así que el destino activo no
  se resaltaba jamás. Ahora se alimenta de `APP_SECTIONS` + `sectionsStore`,
  detecta el activo por ruta (gana la ruta más larga, para que `/grimorium` no
  pierda contra el `/` del Dashboard) y desborda a un sheet "Más" pasados 5
  destinos.
- **Cabecera móvil eliminada** (logo + hamburguesa): ~64px de una pantalla de
  932px gastados en un título que cada vista ya pinta. `main` reserva ahora el
  hueco de la barra con `pb-[calc(...)]`, anulado en `lg`.
- **Cabecera de Grimorio** reestructurada: las 3 pestañas y los 5 botones de
  acción compartían una tira `overflow-x-auto`, así que en móvil las pestañas
  se salían de pantalla y cambiar a Inventario exigía descubrir un barrido
  lateral. Ahora dos filas en móvil (pestañas en tercios + acciones solo con
  icono) y una sola fila en escritorio.
- **Gesto desde los bordes** (`useEdgeSwipe.ts`) para abrir Análisis/Detalle,
  con pestañas de color visibles como pista — un gesto sin señal no lo
  encuentra nadie. El gesto se abandona en cuanto el recorrido vertical supera
  al horizontal, para que el scroll de la lista siempre gane.
- **Pizarrón**: botón de salir movido de arriba-izquierda (chocaba con los
  controles de zoom del canvas) a abajo-izquierda, sobre la barra inferior.
- **Notificaciones**: panel translúcido con `backdrop-blur-2xl` y tarjetas
  interiores también translúcidas (si se quedan opacas, tapan el desenfoque).

**Por qué**

El usuario reportó que en móvil no podía entrar con Google, que la login page
desbordaba, y que "al reducir la pantalla ocurre algo raro". Lo tercero
resultó ser el rango de tablet: no estaba viendo la rama móvil, sino el layout
de escritorio estrujado.

**Incidente que conviene no repetir**

Durante la sesión anterior se depuró contra el **puerto 3000**, que corría
desde `.codex/worktrees/624e/` — un worktree sin ninguno de los cambios. Se
perdió tiempo diagnosticando síntomas de otro código. De ahí la regla del
puerto 3100 en `AGENTS.md`.

**Pendiente**

Verificación visual con sesión iniciada (el agente no tiene la sesión de
Firebase). Y M3: Avatar, Cerebrity, Colegium, densidad de Inventario/Mercado.

---

## Anterior · Claude Code · M0 y M1

Ver commits `e0fe91a` (M0 — escala fluida y hook responsive) y `184b853`
(M1 — las tres columnas pasan a ser tres estados).
