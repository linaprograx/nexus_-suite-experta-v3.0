# Diario de trabajo

Memoria larga del proyecto. **Lo más reciente arriba.** Nunca se borra nada.

Cada entrada: qué se hizo, **por qué**, qué archivos, y qué quedó pendiente.
El "por qué" es lo que más vale dentro de tres semanas.

---

## 2026-08-05 · Codex · Tema de escritorio e Inspector fantasma

**Qué**

- Se corrigió el conmutador claro/oscuro de escritorio. `UIContext` expone
  ahora `isDarkMode`, el tema efectivo que resuelve el valor guardado
  `system`; Sidebar y la navegación móvil consumen esa misma fuente.
- Se eliminó el Inspector fantasma de Pizarrón: con selección vacía devuelve
  `null`, no una tarjeta que decía *Multiple Selection*.
- Se revisó, validó y confirmó el trabajo sin commit de Claude para los gestos
  multitáctiles: una bandera entre `useCanvasGestures` e `interaction.ts`
  bloquea la edición durante un pellizco/dos dedos, evitando nodos de texto
  creados accidentalmente.
- `npm run typecheck` y `npm run build` correctos.

**Por qué**

El escritorio mostraba icono/texto basándose en `theme === 'dark'`; si el
usuario conservaba `system`, eso podía no representar lo que estaba viendo y
dejaba dos criterios entre móvil y escritorio. El Inspector confundía “cero
selecciones” con “varias selecciones”, por eso quedaba visible nada más abrir
un lienzo vacío.

**Pendiente**

Probar el pellizco en iPhone real y continuar solo después con la sesión
separada de Grimorio/Mercado.

---

## 2026-08-03 · Codex · Worktree único de relevo

**Qué**

- Se creó `/Users/lianalviz/nexus-suite-mobile-v1` en la rama nueva
  `feat/mobile-v1-unified`, desde `deploy/mobile-v1` en `5cdf911`.
- Se verificó que el árbol está limpio y que el punto de partida coincide
  exactamente con el commit desplegado por Vercel.
- Se corrigió el relevo: Git confirma que P1–P4 de Pizarrón móvil están
  implementadas, aunque `HANDOFF.md` y `ROADMAP.md` aún marcaban P3/P4 como
  pendientes.

**Por qué**

Los worktrees de Claude y Codex existentes están marcados como obsoletos por
`AGENTS.md`; el repositorio raíz estaba en una rama distinta. Un único
worktree limpio evita que los relevos trabajen sobre árboles diferentes y
mantiene la aplicación local alineada con la versión desplegada.

**No se tocó**

- Código de la aplicación.
- El worktree anterior de Claude, la rama raíz ni la rama de producción.

**Siguiente**

Trabajar únicamente desde `feat/mobile-v1-unified` en este worktree. Antes de
cualquier tarea de código, revisar de nuevo `git status`, este `HANDOFF.md` y
la fase correspondiente del roadmap.

---

## 2026-08-03 · Claude Code · Pizarrón móvil completo y limpieza del módulo

**Qué**

- **P0–P4 del plan de Pizarrón**, cerrados: panel contextual único, tira de
  herramientas horizontal, barra superior mínima, modo consulta y gestos
  nativos (pellizcar para zoom, dos dedos para desplazar).
- **Segunda auditoría** del módulo, y sus tres graves y tres medios resueltos.
- **727 líneas eliminadas**: `MiniToolbar` (499), `ShapeSelector` y
  `ColorPickerModal` (228), más la rama muerta de `isMobileMode`.
- Correcciones de app: modo oscuro, área segura, arranque, sesión, login.

**Los hallazgos que más valen**

*El modo oscuro fallaba al primer toque.* El botón hacía
`prev === 'dark' ? 'light' : 'dark'`, pero el tema inicial es `'system'`. Con el
sistema en oscuro, el primer toque pasaba de `'system'` a `'dark'` —lo que ya se
estaba pintando— y no cambiaba nada. Ahora `toggleTheme` resuelve `'system'` a
su valor efectivo antes de invertirlo, y vive en `UIContext` para que no vuelva
a haber dos versiones.

*Deshacer no existía en móvil.* `undo` y `redo` estaban en el store y
funcionaban, sin exponer en ninguna parte de la interfaz táctil. En un lienzo
que se maneja con el pulgar eso no es comodidad: es la diferencia entre poder
equivocarse y no poder.

*El doble toque usaba dos umbrales.* 400ms en `interaction.ts:365` y 300ms en
`:542`, para el mismo gesto. Explica que el usuario reportara dos veces que
"cuesta seleccionar": según por dónde entrara el evento, se detectaba o no.

*El scroll fantasma lo causé yo.* Al estirar el degradado para cubrir el área
segura le puse una altura mayor que la pantalla; siendo `absolute` dentro del
`<main>` que scrollea, ese sobrante generaba altura desplazable y la vista se
quedaba descolocada entre secciones. El fondo pasó a `fixed`: es un telón, no
contenido.

**La lección del día**

Retirar `MiniToolbar` costó tres diagnósticos. Primero se dio por borrable.
Luego, comparándolo **con el Inspector**, aparecieron tres funciones que este no
tenía y se marcó como intocable. Finalmente, comparando **con toda la app**,
resultó que ninguna era exclusiva: ya vivían en `TopBar`, en
`MenuDesignInspector` y en los atajos de teclado.

Comparar contra un solo componente no basta para declarar algo único. El segundo
diagnóstico fue tan precipitado como el primero, en dirección contraria, y era
el que habría dejado 499 líneas duplicadas para siempre.

**Una decisión revertida a propósito**

El modo consulta arrancaba activo, partiendo de que en barra se mira más que se
edita. El uso real dijo lo contrario: entrar y no poder seleccionar se lee como
un fallo, no como un modo. Se invirtió el valor por defecto. La función sigue
ahí; deja de imponerse.

**Pendiente**

`PLAN-GRIMORIO-MERCADO.md` para una sesión aparte, los restos menores B6/B7 de
la auditoría, y la infraestructura (gateway, rotación de claves, Stripe). Nada
de lo desplegado hoy está verificado por completo en un móvil real.

---

## 2026-08-02 (noche) · Claude Code · Despliegue en producción y auditoría de Pizarrón

**Qué**

- **Primer despliegue en producción**: `nexus-suite-experta-v3-0.vercel.app`,
  desde la rama `deploy/mobile-v1`. Procedimiento completo en `HANDOFF.md`.
- **Icono de la app**: se generaron los PNG del orbe Nexus. `index.html`
  apuntaba a `/vite.svg`, que no existe, y no había manifest ni
  `apple-touch-icon`: iOS ponía la "N" genérica.
- **P0 de Pizarrón**: `MobileContextPanel` fusiona Inspector y MiniToolbar.
- **Auditoría de Pizarrón** en `docs/agents/AUDIT-PIZARRON.md`.

**Los tres tropiezos del despliegue, para no repetirlos**

1. La rama no estaba en GitHub. Vercel llevaba meses desplegando `main`.
2. GitHub bloqueó el push por una clave de Stripe en `ai-gateway/.env`. De ahí
   nace la rama aplanada `deploy/mobile-v1`. La clave **ya estaba** en `main`,
   repo público: pendiente de rotar.
3. Las variables de entorno se añadieron al entorno **Preview** y el build de
   producción seguía fallando con el mismo error. Son entornos separados.

Además, el CSP tenía `frame-src 'none'`, que habría roto el login con Google en
producción: Firebase Auth carga un iframe en `<proyecto>.firebaseapp.com`. Se
detectó leyendo `vercel.json` antes de desplegar, no en caliente.

**El hallazgo de la auditoría**

Rounding, opacidad y sombra no funcionaban por dos defectos encadenados: props
cableadas a literales (los deslizadores volvían siempre a cero) y un manejador
que descartaba `borderRadius` y `shadow`. El renderer sí sabía pintarlos —14 y
9 menciones en `renderer.ts`—, el dato nunca llegaba.

Lo relevante es que **el mismo defecto está copiado en 4 inspectores más**, y
cada uno descarta un subconjunto distinto de campos. La corrección buena no es
parchear uno a uno, sino cambiar la firma de `VisualEffectsController`.

**Pendiente**

G2 de la auditoría, Mercado, y las fases P1–P4 de Pizarrón. Nada verificado en
móvil real.

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
