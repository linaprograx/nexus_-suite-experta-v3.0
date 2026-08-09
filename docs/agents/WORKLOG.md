# Worklog

## 2026-08-09 · Claude Code · Cierre del exportador de Recetas

Se da por cerrado Grimorio → Recetas. El exportador a PDF funciona en las tres
plantillas: **Editorial**, **Clubhouse Premium** y **Cartel**, con portada en su
hoja y una receta por página.

**Las cuatro causas reales, por si vuelven a aparecer**

1. **El documento no declaraba anchura de maquetación.** En un móvil se componía
   a ~390px, la tabla se estrujaba y el resultado eran decenas de páginas. Lo
   arregla `<meta name="viewport" content="width=794">` — 794px es A4 a 96 ppp.
   Todo lo que se «arregló» antes de esto fue tratar síntomas.

2. **Medidas absolutas en la composición de la ficha.** Una columna de foto de
   `300px` fijos se comía casi todo el ancho al imprimir, y la tabla colapsaba a
   una letra por línea. La regla: **proporciones con `minmax(0, …)`**, nunca
   anchuras fijas.

3. **Preparación, totales y pie iban DESPUÉS de la rejilla**, a ancho completo,
   así que caían siempre en la hoja siguiente. Ahora `.ficha` entera es la
   rejilla y `display: contents` disuelve el envoltorio `.ficha-top` para que
   sus hijos sean elementos de esa misma cuadrícula, sin tocar el HTML común.

4. **La altura de la portada NO se puede fijar en milímetros.** El área
   imprimible real no es la teórica: Safari añade cabecera y pie propios (URL y
   «Página n de m») que comen altura por encima del margen de `@page`, y esa
   merma no es medible desde el CSS. Se probó 244mm y 228mm; las dos se
   derramaban. La solución es `aspect-ratio: 1 / 1.33` — la portada mide en
   proporción a su propio ancho y escala con la página.

**Dos trampas de proceso que costaron horas**

- **Producción se despliega desde `deploy/mobile-v1`, no desde
  `feat/mobile-v1-unified`.** Dos iteraciones enteras fueron invisibles por
  empujar solo a `feat/…`. Empujar SIEMPRE a ambas.
- **Comillas invertidas dentro de los comentarios del CSS.** Terminan el literal
  de plantilla y rompen el build de Vercel con `Expected "}" but found …`.
  Ocurrió tres veces. La comprobación automática solo mira dentro de los bloques
  CSS; el fallo estaba en el comentario de encima.

**Pendiente inmediato, ya diagnosticado y sin implementar**

- `RecipeFinancialDashboard.tsx` (panel de Análisis) **no usa
  `calculateRecipeProfitability`**. Calcula el margen a mano como
  `(precio − coste de ingredientes) / precio`, así que ignora merma, comisiones,
  mano de obra, impuestos y estructura. El «margen medio» que muestra contradice
  lo que dice la ficha. Además, los umbrales `70%` y `25%` están escritos a
  fuego en vez de leer el objetivo de Economía.
- `BusinessCogsPanel.tsx` sí usa compras reales, pero **no pasa `allRecipes`**,
  así que no resuelve sub-recetas y su total queda por debajo del real.
- Recetas con líneas que apuntan a un ingrediente inexistente: se imprimen como
  «—» con coste 0,00 € (visto en *Water Hazard*, dos líneas).

**Siguiente fase**: Inventario y Mercado, nunca auditados en profundidad.

---

# Diario de trabajo

Memoria larga del proyecto. **Lo más reciente arriba.** Nunca se borra nada.

Cada entrada: qué se hizo, **por qué**, qué archivos, y qué quedó pendiente.
El "por qué" es lo que más vale dentro de tres semanas.

---

## 2026-08-08 · Claude Code · Tres días de uso real, y el plan que salió de ahí

**Sesión de documentación. No se tocó una línea de código**, por petición
expresa del fundador. Lo que sigue son hallazgos y planificación.

**De dónde sale**

El fundador usó Nexus en el móvil, en barra, durante tres días. Es la primera
prueba de uso sostenido de verdad, y vale más que cualquier auditoría de código:
sacó cinco defectos que ninguna revisión había visto. Además cerró qué quiere
que sea Mercado, y señaló Cerebrity como lo siguiente.

**Qué se escribió**

- **`docs/agents/AUDIT-MOVIL.md`** (nuevo) — los cinco defectos, rastreados
  hasta archivo:línea, priorizados P0–P2, con orden de ejecución y criterios de
  aceptación. Más el mandato de la auditoría completa de interacción móvil.
- **`docs/agents/PLAN-CEREBRITY.md`** (nuevo) — auditoría de Cerebrity hecha
  **sin ejecutar una sola llamada de IA**, y las fases C1–C5.
- **`PLAN-GRIMORIO-MERCADO.md`** — ampliado con el detalle del destino: pedido
  ficticio mensual, recetas compartidas entre usuarios, catálogo de proveedores
  de Madrid, reparto multi-proveedor, envío externo, facturas y guía de primer
  uso.
- **`ROADMAP.md`** — nueva fase **M3.2** (estabilidad de uso móvil), que pasa a
  ser el "aquí estamos". Cerebrity aparece como línea propia fuera del móvil.
- **`HANDOFF.md`** y este diario.

**Lo que se encontró leyendo código, y merece la pena recordar**

*Desactivar dos secciones deja al usuario sin cerrar sesión.* La causa es una
cuenta que sale sola: `APP_SECTIONS` tiene 6 entradas, `PERSONAL` se añade
aparte, y `MAX_SLOTS` vale 5. Con dos secciones desactivadas quedan exactamente
5 destinos, así que `FloatingBottomNav.tsx:105` devuelve `overflow: []`, el
botón "Más" no se pinta (`:144`) — y modo oscuro (`:184`) y cerrar sesión
(`:192`) **viven dentro de esa hoja**.

> El error de diseño no es la aritmética: es haber tratado "Más" como un
> **desbordamiento** cuando es un **destino fijo**. Los controles del sistema
> acabaron colgando de una preferencia del usuario. Merece revisión general:
> **nada estructural debería renderizarse condicionalmente a partir de una
> preferencia.**

*Cerebrity tiene dos Synthesis.* La real es la pestaña `creativity` de
`CerebrityView` (el rótulo `SYNTHESIS` se pinta en `:845`), que lee recetas e
ingredientes y llama al gateway. La otra, `views/unleash/SynthesisView.tsx`,
tiene su `handleGenerate` **con el resultado escrito a mano** y no importa
ningún poder — y `UnleashView` ni siquiera está enrutado (`/unleash` redirige a
`/cerebrity`). Octavo caso del patrón de este proyecto: *si algo parece una
función y no responde, comprueba primero si está conectado.*

*El árbol de poderes está escrito dos veces.* Los nueve poderes visibles son una
lista literal en `CerebrityView.tsx:383-393`, mientras `features/cerebrity/powers/`
tiene once módulos que **nadie importa desde fuera de su propia carpeta**; dos
de ellos (`intensityCreative`, `techCoherence`) ni siquiera están en el barril.
Y el despacho compara **el nombre en castellano** (`:406`), así que renombrar un
poder en la interfaz rompería su ejecución en silencio.

**Una nota de método que salió sola**

Toda esta sesión —incluida la auditoría entera de Cerebrity— se hizo **leyendo**.
Cero llamadas de IA, cero euros. Merece quedar escrito porque el motivo por el
que Cerebrity nunca se había recorrido era precisamente el miedo al coste: buena
parte de lo que hay que arreglar allí **no necesita ejecutar nada**.

**Qué quedó pendiente**

Todo. Ni un defecto corregido: era el encargo. El orden está en `HANDOFF.md`,
empezando por A1.

## 2026-08-06 · Claude Code · La causa raíz del catálogo vacío y la franja fija

**Lo importante de esta entrada: el `appId` con saltos de línea.** Si vuelve a
aparecer algo "vacío sin error" en Grimorio, empieza por ahí.

**Qué**

- **Causa raíz de todos los fallos de datos de Grimorio.** El bundle de
  producción llevaba grabado
  `appId: "1:368869694849:web:5d6b8efb3305d374dddc80\n\n"`: la variable se pegó
  en Vercel con dos retornos de carro. Como `appId` forma parte de rutas de
  Firestore, todas las de `artifacts/...` apuntaban a una colección
  inexistente. Mercado pasó de vacío a **1367 productos**; el selector de
  ingredientes de recetas, de "sin resultados" a listar con normalidad.
- **Pizarrón**: el pellizco de dos dedos creaba nodos de texto; la fuente no
  escalaba al redimensionar un texto suelto (sí funcionaba en multiselección).
- **Grimorio móvil**: cabecera fija de una sola capa con buscador y filtros
  dentro, título que se pliega al bajar, pestaña de borde derecha operativa,
  recuento de Mercado que ya no se corta.

**El diagnóstico, y los dos que fallaron antes**

Los ~1300 "conflictos manuales de stock" se atribuyeron primero a **latencia de
red**: el catálogo llega vacío mientras carga y el resolver marca todo como
huérfano. Se puso una guarda para no calcular sin catálogo. **La guarda estaba
bien pero el diagnóstico no**: tapaba el síntoma de un catálogo que estaba
vacío de verdad.

El segundo intento fue el `orderBy('nombre')`, que en Firestore **excluye en
silencio los documentos que no tengan ese campo**. Plausible, y el cambio se
conserva porque protege de un fallo real, pero tampoco era la causa.

Lo que cerró el caso fue **mirar la app corriendo**. El aviso en consola
distinguía dos cosas que hasta entonces se veían igual —lectura denegada frente
a colección vacía— y dijo *"el catálogo existe pero está vacío"*, con la ruta
impresa. En esa ruta se veía el salto de línea.

> La pista que estaba a la vista desde el principio: **recetas y compras
> funcionaban**, y son las dos colecciones que **no** usan `appId` en su ruta.
> Cuando unas cosas cargan y otras no, mira qué comparten las que fallan.

Una comparación anterior del `appId` local contra el de producción los dio por
idénticos: la expresión regular que usé para extraerlo **se comía el espacio
final**. Comparar valores "limpiándolos" primero puede ocultar justo el
problema que buscas.

**La franja fija: por qué costó tantas iteraciones**

Se intentó primero lo obvio —cabecera fija por un lado, barra de filtros
pegajosa por otro, alineadas por una variable con la altura— y produjo una
ristra de defectos: bloque blanco en escritorio, borde cuadrado con costuras,
hueco enorme entre los iconos y el buscador, rendija por la que se veía pasar el
listado, barra descolgada del contenido. Cada corrección ajustaba una medida y
desajustaba la otra.

**El error no era ninguno de esos defectos, era el planteamiento**: dos bloques
posicionados por separado obligados a coincidir al píxel, con alturas que
cambian solas. La solución fue dejar de tener dos bloques — la barra se inyecta
dentro de la cabecera con un portal. Detalle y motivos en `CONTEXT.md`.

**Tres veces se rompió Grimorio en producción**

Y conviene que quede escrito, porque las tres son evitables:

1. Reestructurar `StackedMobileShell`, del que cuelgan las tres columnas de
   Grimorio entero: rompió las tres pestañas a la vez.
2. Limitar a móvil la *posición* de la barra y olvidar el *fondo*, que pintó un
   bloque blanco sólido en escritorio.
3. Entregar sin haberlo mirado. TypeScript y el build no ven un rectángulo
   blanco.

Lo que cambió el ritmo fue **poder medir el DOM en la app corriendo**: alturas,
posiciones a distintos scrolls, contenedores de scroll intermedios, capas
visibles por anchura. Los tres últimos arreglos salieron a la primera.

**Hallazgos secundarios**

- La pestaña de borde derecha estaba inerte por `??` en vez de `||`.
- El recuento de Mercado llevaba `truncate` y se cortaba a "1…" — con el
  catálogo vacío nunca había pasado de una cifra.
- Dos contenedores creaban scroll propio en móvil e impedían cualquier `sticky`
  dentro.
- Código muerto localizado y **no retirado**: `features/ingredients/useIngredients.ts`
  (duplicado sin importar), `RecipeToolbar` e `IngredientToolbar` (importados y
  nunca renderizados).

**Pendiente**

Limpiar `VITE_FIREBASE_APP_ID` en Vercel (el código la recorta, pero el valor
sigue sucio). Verificación en iPhone real de la franja fija y del pliegue del
título. Parte 2 de `PLAN-GRIMORIO-MERCADO.md`.

---

## 2026-08-06 · Codex · Consolidación de la visión del fundador

**Qué**

- Se creó `docs/NEXUS_MASTER_VISION_v1.1.md` como fuente canónica consolidada
  de visión de producto. Integra la visión aportada por el fundador y la
  auditoría técnica existente, sin tocar el código ni iniciar investigación de
  mercado.
- Se distinguieron capacidades actuales, en desarrollo y futuras. Se anotaron
  como contradicciones reales: el catálogo Mercado aún es por usuario, el
  pedido externo/recepción no está construido como flujo completo y la
  jerarquía organizativa aún no existe como modelo operativo verificable.

**Por qué**

La visión máxima debe dirigir el producto sin convertir una ambición en una
afirmación técnica falsa. La separación explícita de madurez permite usar el
documento después en un Brand Book o estudio de mercado sin prometer funciones
que todavía no están operativas.

**Pendiente**

No se ha iniciado el estudio de mercado, el Brand Book ni se ha modificado
ninguna carpeta de código. Cuando se autorice el siguiente trabajo estratégico,
partir de `docs/NEXUS_MASTER_VISION_v1.1.md`.

---

## 2026-08-05 · Codex · Diagnóstico móvil y roadmap de Grimorio

**Qué**

- Se realizó diagnóstico solo lectura de los tres síntomas móviles de Grimorio.
  El catálogo de ingredientes se consulta en `useIngredients`; Mercado lo pasa
  directamente a `IngredientListPanel`. Inventario, por su parte, calcula las
  existencias exclusivamente desde `purchases` menos `stock_movements`.
- Se confirmó que el panel de conflictos usa ese mismo catálogo en su selector:
  un selector vacío significa que `allIngredients` no llegó a ese render, no
  que exista un selector móvil independiente.
- Se documentó el roadmap transversal Recetas → Inventario → Mercado, con el
  pedido inicial ficticio, catálogo de proveedores, pedidos, facturas, recetas
  compartidas y guía interna no IA. También se anotaron sus permisos y
  dependencias de integración.
- Se inició M3.1 con una corrección visible, independiente de la incógnita de
  datos: Inventario deja de fijar altura/scroll interno en móvil, y se compactan
  métricas, espaciados e indicadores. La página vuelve a ser el único scroll;
  el diseño de escritorio se conserva detrás de `lg:`.

**Por qué**

La observación «en escritorio lleno, en móvil vacío» podía inducir a parchear
el responsive. El trazado muestra que Inventario y Mercado no representan el
mismo dominio: catálogo frente a stock real. Cambiarlo sin capturar los datos
de la sesión afectada podría ocultar compras huérfanas y romper el inventario.

**Pendiente**

No había una sesión autenticada abierta para validar las longitudes reales a
390px. Probar el cambio visual desplegado y capturar los conteos antes de tocar
la lógica de catálogo; acordar las cuatro decisiones antes de iniciar
importación o Mercado global.

**Nota de relevo**

El despliegue no llegó a `origin`: el checkout a `deploy/mobile-v1` encontró
archivos de Pizarrón de la rama de trabajo superpuestos y Git abortó el merge
antes del push. Se guardaron de forma recuperable en `stash@{0}` y el worktree
se restauró limpio a `feat/mobile-v1-unified`. Revisar ese stash antes de
retomar el despliegue.

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
