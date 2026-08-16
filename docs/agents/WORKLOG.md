# Worklog

## 2026-08-12 · Claude · I1, M1, M2, troceado de escrituras y una tanda de UX móvil

**I1 · unidades canónicas.** `resolveStandardPack` nunca falla: sin evidencia
devuelve una botella de 700 ml, y ese número divide el precio del envase. Un
producto de formato desconocido no aparecía como desconocido, aparecía como
700 ml. `core/costing/unitAudit.ts` repite la resolución anotando de dónde sale
cada cifra y bloquea cinco casos sin proponer valor: sin pista, unidad desnuda,
**contradictorio** (la ficha guarda 700 ml y su unidad de compra dice
`10813.000 L`), **heredado** (700 ml exactos sin nada que lo respalde) e
impacto mayor del 500 %. La primera versión daba por buena la pareja canónica
guardada y dejaba pasar el dato corrupto real como «correcto».

Primera lectura sobre datos reales: **27 fichas bloqueadas dentro de recetas,
€6.032,49 de inventario** colgando de ellas. Casi todas `heredado` — no son
datos corruptos, son datos que nunca se rellenaron, y el sistema acertó por
casualidad en unos (Chartreuse sí es de 700) y falló en otros (400 Conejos es
de 750) sin nada que los distinga.

La corrección es por ficha, con deshacer exacto (`formatoAntesDeCorregir`
guarda los tres valores anteriores; si un campo estaba vacío se retira con
`deleteField` en vez de escribir un cero) y marca `formatoVerificado`, sin la
cual la auditoría volvería a bloquear la ficha en cada recarga. Sin precio de
compra la corrección se bloquea sola: cambiar el formato no arreglaría el
coste.

El botón «Normalizar Catálogo» **ejecutaba esa migración a ciegas** y prometía
ser «reversible al reimportar» sin que exista deshacer. Ahora abre el informe.
La migración sigue intacta en su módulo, sin botón que la dispare.

**M2 · el proveedor viaja en el pedido.** `providerId` estaba declarado en
`Order` y no se escribía nunca. La hoja agrupaba por proveedor y solo
sobrevivía el nombre dentro del texto «Pedido - Fulano»; al recibir se deducía
otra vez del ingrediente, o sea que se respondía a «a quién le compras esto
HOY» cuando la pregunta era «a quién le compraste ESTO». Dos centinelas
distintos convivían (`unknown` en la hoja, `generic_provider` en el receptor):
guardar el primero habría convertido una ausencia en un dato.

Al arreglarlo salió lo de fondo: la hoja agrupaba por `ing.proveedor`, marcado
`@deprecated`, vacío en el catálogo real, así que **todo** caía en «Sin
Proveedor Asignado». `proveedorDeIngrediente` es ahora el único sitio que
responde a esa pregunta, compartido por la hoja y el receptor. Medido: IN VINO
VERITAS 626, FRUTAS ELOY 484, sin asignar 264, BORDINOS 6 — **1.116 de 1.380
pasan a tener proveedor real**.

**M1 parte 2 · líneas sin precio.** Medido primero: de 775 líneas
seleccionadas, 40 salen a 0 € y 735 con precio, un 5 % que cuadra con el «39
SIN PRECIO» del Dashboard. Los borradores del fundador a 0,00 € son de enero y
no representaban el estado actual. Ahora se avisa antes de generar, con
recuento y nombres; informa, no bloquea.

**Troceado de escrituras.** Corrección de un diagnóstico previo: un
`writeBatch` de más de 500 **no se pierde a medias**, Firestore rechaza el lote
entero y no escribe nada. Con 1.380 referencias el CSV no dejaba el catálogo a
medio hacer: no hacía nada. `services/firestore/escrituraPorLotes.ts` confirma
cada 450 y —esto es lo que cambia— al trocear aparece un fallo parcial que
antes era imposible, así que `FalloEnLotes` lleva dentro cuántas se
confirmaron y la interfaz lo muestra. Cinco sitios convertidos; el peor era la
subida de catálogo de proveedor, que escribe **dos** operaciones por línea y
reventaba a las 250 filas.

**Contexto de apilamiento.** El armazón móvil pintaba el contenido dentro de un
`<div relative z-20>`, que es un contexto de apilamiento: todo modal quedaba
encerrado en el nivel 20 y salía por debajo de la franja (`z-30`) por muy
`z-50` que fuese. Había **doce ficheros** con ese patrón. Se quitó el nivel del
contenedor: un cambio de una línea en vez de doce parches, y el fallo no puede
reaparecer en el siguiente modal que alguien escriba.

**El logo y los filtros.** Dos diagnósticos equivocados antes de acertar.
Primero se culpó a los filtros CSS —un elemento con `filter` dentro de un
ancestro con `backdrop-filter` se pinta en WebKit como un rectángulo, y eso
**sí** era un fallo real, que se corrigió—; después al color del dibujo. La
causa verdadera se encontró midiendo el canal alfa: el original tiene
separaciones **blancas** entre las palas que **se abren hacia fuera**, así que
al recortar el fondo se fueron con él. De 26.679 píxeles transparentes, solo 3
quedan encerrados. Sobre blanco el logo se ve íntegro; sobre oscuro las
separaciones dejan pasar el fondo. **No falta color, falta fondo**, y ningún
CSS lo arregla. Parado a petición del fundador hasta que rehaga el fichero.

**Mercado · buscar y agrupar, las cuatro fases.** El enunciado era «que buscar
absolut dé un resultado con sus opciones dentro». Al investigarlo cambió: no
faltaba el agrupado, **el que había estaba mal**, y además hacía dos trabajos
distintos con la misma herramienta.

Ejecutando el emparejador real de Mercado contra el catálogo del fundador,
AGUERRIDO ANTONIO, BENIGNO y TOMAS caían en un mismo grupo —comparten la
palabra «aguerrido» y bastaba **una** coincidencia fuerte—, así que de tres
mezcales distintos se veía uno. Hasta el punto de que la alerta de stock
crítico apuntaba a un producto que el buscador no mostraba. Encima comparaba
cada ficha solo contra el nombre de la primera del grupo, con la comprobación
transitiva omitida «por rendimiento»: el resultado dependía del orden.

Se separaron los dos trabajos. **Encontrar** (`core/search/buscador.ts`):
normalizar, exigir todos los términos, prefijo de palabra y orden por
relevancia; «vodka absolut» daba cero resultados y «limon» no encontraba
«LIMÓN». **Agrupar** (`core/identity/agruparProductos.ts`): conjunto idéntico
de palabras fuertes, la regla ya aprobada en `duplicateCandidates`,
deliberadamente conservadora —prefiere separar de más a juntar de menos,
porque juntar esconde producto y falsea la comparativa—. Y `colapsarAlias.ts`
para respetar por fin las fusiones ya hechas.

`opcionesDeCompra.ts` despliega las opciones de cada grupo y conecta la
política de precio del 09-08, que llevaba desde entonces sin consumir. Con un
cuidado que el catálogo real exige: **dos precios de formatos distintos no se
comparan**. Conviven opciones a «€68,50 / 0.700 L» y «€77,80 / UND»; solo
compite el precio por unidad base, y si no coinciden se listan todas sin
coronar a ninguna. Al probarlo apareció que AGUERRIDO, TOMAS CUPREATA tiene dos
fichas del mismo proveedor a 89,50 y 68,50 €, ambas de 700 ml.

**Rendimiento, medido antes de tocar.** 414 ms de bloqueo por tecla con 1.380
tarjetas en el DOM, de los cuales solo 30 ms eran buscar y agrupar: el cuello
de botella era pintar un catálogo entero que nadie recorre con el dedo. No se
optimizó el algoritmo. Se conectó `useDebounce` —que ya estaba escrito y no se
usaba en ese camino porque se declaraba después del cálculo que lo
necesitaba— y se pasó a pintar 60 tarjetas con «Mostrar más». 37–56 ms y un
94 % menos de nodos. Se descartó una medición de 6.000 ms por ser un fallo del
propio sondeo: mejor sin dato que con un dato falso.

Por último, el buscador se llevó a los ocho sitios que tenían el suyo, como
pidió el fundador. Al migrar tres de ellos se sustituyó el predicado del filtro
por `true` en lugar de aplicar `buscar`, lo que **elimina** el filtro en vez de
mejorarlo; TypeScript lo acepta porque `true` es un booleano válido, y se
detectó revisando el resultado, no compilando.

**Otros.** Listas de más de 15 elementos agrupadas y plegadas (611 reglas → 49
grupos, ver `CONTEXT.md`); categorías de proveedor con 19 opciones de
hostelería y multi-selección en una barra desplegable; la explicación de
compra rápida movida dentro de la barra que explica; tabla de la hoja de
pedido con variantes `dark:` —estaba escrita solo para modo claro y el importe
era invisible—; `unitPrice: Infinity` cuando la cantidad era 0 (`|| 0` no
atrapa `Infinity`, solo `NaN`); un `0` suelto en la ficha de proveedor
(`0 && <algo>` pinta el cero en React).


## 2026-08-10 · Codex · Mercado móvil, limpieza taxonómica e identidad visual

**Mercado móvil.** Se corrigió la estructura de la fila de filtros y acciones:
categoría, proveedor, importar, compra, borrar y alta se mantienen en una sola
fila y se contraen proporcionalmente cuando aparece la selección. Los menús
de categoría y proveedor se unificaron visualmente; el de categoría calcula su
ancho a partir del contenido y el de proveedor quedó pendiente de una última
validación de ancho en el dispositivo real.

**Categorías.** Auditoría en producción: los rótulos vienen de datos reales,
no de la interfaz. Se creó `normalizeIngredientCategories.ts`, una migración
sin fuzzy matching, por coincidencia exacta y con batches de 450. Conserva el
valor original en `categoriaAntesDeNormalizar` y excluye explícitamente los
casos ambiguos. El panel Mercado muestra el número real de fichas afectadas:
724. La herramienta se desplegó con el commit `2c17986`; la confirmación final
en el navegador quedó pendiente del fundador, por lo que no se debe afirmar que
la base de datos ya esté migrada.

**Identidad de producto.** El fundador eligió el tercer grupo de bajo riesgo:
dos fichas de Mezcal Aguerrido. Se documentó que el maestro debe ser el menor
precio salvo preferencia o rotura de proveedor. Sigue pendiente ejecutar la
operación de Fase D: copiar oferta a `supplierData`, asignar `masterProductId`,
y verificar stock, valor, reglas y costes. No se han escrito datos de esa
fusión.

**Identidad visual.** El fundador entregó un nuevo logo circular multicolor.
Se adopta como fuente `public/nexus-logo.png` y se regeneran los archivos que
ya consumen navegador, iOS y PWA (`favicon-32.png`, `apple-touch-icon.png`,
`icon-192.png`, `icon-512.png`). `NexusOrb` deja de dibujar el orbe CSS anterior
para que acceso y barra lateral muestren exactamente el mismo activo. TypeScript
y build han pasado. Producción verificada por lectura del bundle servido
(`nexus-logo.png`) y por los endpoints del manifiesto, icono PWA e icono Apple.
Más tarde se reemplazó el activo fuente por la variante entregada con el símbolo
más grande, manteniendo exactamente los mismos nombres y tamaños de salida para
no invalidar el navegador, iOS ni instalaciones PWA ya existentes.

**Corrección de transparencia (en curso).** La versión cuadrada anterior
conservaba blanco en la interfaz y rompía los fondos oscuros. Se generó una
fuente con alfa real desde el nuevo espiral y se retiró el `rounded-full` /
`object-cover` de `NexusOrb`, para no recortar las puntas del símbolo. El activo
activo de barra lateral pasa a usar cian, azul, violeta, magenta y ámbar. Falta
desplegar y verificar la versión transparente. **Cerrado:** producción sirve un
PNG con canal alfa y el bundle contiene la paleta multicolor de la barra lateral.

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

## 2026-08-11 · Claude Code · Ingrediente exprés, integridad del precio y la franja fija

Sesión larga, 15 commits. Lo que más vale para el futuro está al final, en los
errores.

**El ingrediente exprés, que era el bloqueo real del fundador**

Estaba diseñando cartas y se topaba con que el ingrediente no existía en el
catálogo: tenía que abandonar la receta a medio escribir, ir a Mercado, crearlo
entero y volver — o cambiar la receta para usar lo que sí había. Ahora el «Sin
resultados» del buscador ofrece crear ahí mismo, en un modal **encima** del
formulario, con cuatro campos, y el ingrediente se engancha solo a la línea.

Dos cosas que lo habrían roto: `useIngredients` es un `getDocs` **cacheado**,
así que sin esperar al refetch la línea apuntaría a un id que aún no existe en
`allIngredients` —campo vacío y coste 0—; y el alta pasa por
`resolveStandardPack`, la misma normalización que el alta completa, para no
colar texto libre en el catálogo por la puerta de atrás.

**El precio estimado deja de disfrazarse de real**

`pendienteRevision` era solo visual: el precio tecleado al vuelo entraba en
escandallo, margen y valor de inventario igual que uno de catálogo. Ahora la
ficha marca el coste como ESTIMADO y **nombra** de qué ingredientes depende
(nuevo `costeEstimado.ts`, que expande sub-recetas referenciadas con guarda
anti-ciclos), y esos ingredientes quedan fuera del «mejor precio» de Mercado y
del motor de señales. En la hoja de pedido **sí** se pueden pedir —a veces es
justo lo que falta— pero la línea lo dice.

**Un tequila se ofrecía como el mejor precio de un mezcal**

La ficha de AGUERRIDO, ANTONIO CUPREATA proponía comprar un TEQUILA CURADO
CUPREATA a 32,20 € marcado como MEJOR PRECIO. La lista de palabras débiles
estaba **copiada en cuatro sitios** y a ninguno le habían añadido `mezcal` ni
las variedades de agave: bastaba compartir `cupreata` —una variedad, no un
producto— para presentar dos cosas distintas como alternativas.

Fuente única en `core/identity/genericTokens.ts`, y el emparejador endurecido en
dos puntos: **todas** las palabras específicas del objetivo, y **ninguna de más**
en el candidato. Fuera del vocabulario se quedan `reposado`, `añejo` y `blanco`:
esas sí distinguen referencias reales de la misma marca.

**Editar una receta la sacaba de su carta**

Pérdida de datos silenciosa, en cada edición. El efecto que marcaba «las cartas
en las que ya está» dependía solo de `initialData`, pero `menuCompleto` llega
por snapshot y está vacío en el primer render: la lista quedaba a cero y el
efecto no volvía a correr. Al guardar, la sincronización en dos sentidos leía
esa lista vacía y quitaba la receta de todas sus cartas.

Y el «Estado: En carta» resultó ser una etiqueta que mentía —era `Terminado`, y
no metía en ninguna carta—, mientras el selector sí funcionaba pero el fundador
estaba añadiendo a una carta **archivada**, que no se muestra.

**Errores míos, que son lo que hay que leer**

1. **Anuncié un arreglo que no era tal.** Dije haber hecho fluido el pliegue de
   cabecera y en realidad **lo maté**: el `WeakMap` de posiciones salía por la
   guarda de temblor *antes* de rellenarse, así que el delta era siempre 0. El
   fundador vio el resultado, le gustó la franja fija, y se adoptó como decisión
   —retirando el mecanismo entero— en vez de dejar la app apoyada en un defecto.

2. **Cuatro falsos positivos verificando despliegues, en un solo día**: un
   marcador que era nombre de variable (minificado), otro con tilde escrito sin
   tilde, otro sobre un fichero descargado vacío, y otro (`fetchPriority`) que
   React ya incluye. El procedimiento de tres condiciones está ahora en
   `HANDOFF.md`. Decir «desplegado» sin comprobarlo es peor que no decir nada.

3. **Toqué el trabajo del relevo anterior y encontré dos cosas**: el maestro
   propuesto se había cambiado a «el más barato» —el maestro es una identidad,
   no una oferta— y el logo pesaba **1,4 MB para pintarse a 40 px**. Revertido
   lo primero, 19× más ligero lo segundo.

**Y uno que costaba dinero cada día**

`onUpdateRules` reescribía **las 611 reglas** cada vez que se guardaba o borraba
una. No duplicaba datos, pero explicaba la lentitud del panel y se pagaba en
cuota de Firestore.

**Pendiente**

I1 (unidades canónicas) es lo que desatasca el resto. Todo lo demás, en
`HANDOFF.md`.

---

## 2026-08-09 · Claude Code · Recetas cerrado, y los cimientos de Inventario

Sesión larga. Dos bloques: cerrar Recetas de verdad y poner cimientos en
Inventario/Mercado. Todo desplegado a las dos ramas y verificado en producción
con la sesión del fundador.

**Recetas: había CUATRO criterios económicos, no dos**

El relevo anterior dejó anotado que el panel de Análisis no usaba
`calculateRecipeProfitability`. Al mirarlo resultó que **la ficha tampoco**, ni
la tarjeta de la lista. Cuatro sitios calculando margen de cuatro formas:

| Dónde | Margen | Umbrales |
|---|---|---|
| Ficha | a mano, solo ingredientes | 75/67 de costFormatter |
| Análisis | a mano, solo ingredientes | 70/25 a fuego |
| Lista | campo guardado `costoReceta` | pricing ×3/×4/×5 |
| Escandallo | motor | objetivo configurado |

Los tres primeros migrados al motor. Con los ajustes por defecto las cifras no
se mueven —el motor se reduce a la fórmula manual—, pero el fundador **tiene
Economía configurada con ~10% de impuesto**, así que sí cambiaron: Birdie Juice
pasó de 89,2% a 88,9% de margen y de 1,18 € a 1,42 € de coste, en las cuatro
vistas a la vez.

Dos cosas que NO se tocaron, y por qué: `costData` sigue siendo el coste de
ingredientes porque lo consumen el desglose y el **exportador**; y
`costSnapshot` de la carta activa sigue igual porque `menuDrift.ts:42` lo
compara contra `calculateRecipeCost` — guardar ahí el coste servido habría
mostrado toda la carta desviada de golpe sin que nada cambiara.

**Inventario: cuatro cifras que mentían**

- **I4** — Dashboard 39.471 € frente a Inventario 39.452,96 €. No era redondeo:
  el Dashboard llamaba a `buildStockFromPurchases` a secas, **sin restar los
  movimientos**. Enseñaba el almacén como si nunca se hubiera consumido nada.
  Nueva `buildCurrentStock` como fuente única.
- **I3** — «+0% vs mes anterior» calculaba `esteMes / TODO_EL_HISTÓRICO` y
  encima lo etiquetaba bajo «Valor Inventario», cuando mide **compras**.
- **I2** — el semáforo era `quantityAvailable > 5`, igual para toda unidad: 3
  botellas de mezcal en rojo y 6 kilos de patata en verde. Ahora sale de
  `useStockRules`, con un cuarto estado **desconocido** para los 824 ítems sin
  regla. Sin regla no se inventa umbral.
- **M1** — la causa de los pedidos y compras a 0 € no era que el precio se
  perdiera: **nunca hubo precio y nadie lo decía**. `PurchaseModal` calculaba
  `precioCompra || 0` sin permitir tocarlo. El fundador lo verificó comprando:
  el valor de almacén subió exactamente 633,33 €, que es lo que había comprado.

**Identidad de producto: el encargo era otro**

El fundador pidió resolver que «una segunda compra cree otro producto».
Auditando resultó que **eso no pasa**: `buildStockFromPurchases` agrupa estricto
por `ingredientId` y no existe ningún `createInventoryItem()` — el inventario no
se almacena, **se deriva**. Los duplicados están en el catálogo, de la
importación CSV.

Y la arquitectura maestro/ofertas **ya existía**: `Ingredient.id` es el maestro y
`supplierData` el mapa de ofertas, con los campos rivales marcados `@deprecated`
desde hace tiempo. No había que construirla: había que consumirla.

> **El hallazgo que más condiciona lo que viene:** el «N opc.» de Mercado **no
> lee `supplierData`** — recorre los documentos duplicados. Hoy **los duplicados
> SON las ofertas**. Fusionarlos sin trasladar antes precio y formato a
> `supplierData` destruiría la función multi-proveedor. La fusión no es un
> borrado: es un traslado.

Fases A (informe en seco), B (`masterProductId` + `proveedorPreferente`, sin
consumidores) y C (consolidar en lectura) hechas. C se cerró con la prueba que
la define: **sin ningún alias, la salida es idéntica byte a byte**. Verificado
después en producción — Dashboard e Inventario coinciden y el delta cuadra
exactamente con las compras del fundador.

**Tres errores míos, corregidos el mismo día**

1. El detector agrupaba a los parecidos con los idénticos, así que MANDARINA
   contaminaba el grupo de los dos Absolut y **bloqueaba una fusión legítima**.
   280 grupos y 270 bloqueos pasaron a 38 y 0.
2. El contador «BLOQUEADOS» quedó a cero **por construcción** tras ese arreglo.
   Un número que no puede cambiar no informa y tranquiliza en falso. Ahora
   cuenta **variantes**.
3. **`LICOR` y `LICOR 43` compartían clave** y estaban en el mismo núcleo,
   propuestos para fusionar. Mi lista de ruido tenía palabras de envase pero no
   **tipos de producto**, y los números se filtraban siempre — en «LICOR 43» el
   43 es la marca. Nuevo conjunto `GENERICOS`: se conservan en la clave pero no
   cuentan como identidad. Los nueve licores reales del catálogo dan ahora 0
   grupos y 0 variantes.

**Y uno que costaba dinero cada día**

`onUpdateRules={(newRules) => newRules.forEach(saveStockRule)}`: guardar **una**
regla reescribía **las 611**, una a una. `onSaveRule` ya persistía y
`onDeleteRule` ya borraba; el volcado masivo no aportaba nada. Retirado.

**Método que funcionó y conviene repetir**

Verificar la matemática con datos **sintéticos** compilados con esbuild y
ejecutados en node, sin tocar Firestore: 14 comprobaciones en la identidad, 11
en la consolidación, 5 en el detector. Encontró el fallo de MANDARINA antes de
que llegara a producción.

**Pendiente**

Todo lo de `HANDOFF.md`. Lo siguiente es la Fase D con **un solo grupo** de los
16 de riesgo bajo, y necesita aprobación porque escribe en datos.

---

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

---

## 2026-08-16 · Claude Code · La carta a Google Sheets

**Qué se hizo**

Botón «A Sheets» en la modal de carta (Grimorio → Recetas → Carta). Crea la
carta como hoja de cálculo en el Drive del fundador: banda de portada de cuatro
filas combinadas a todo lo ancho, secciones con color, anchos de columna, euros
como número —sumables— y una barra coste/beneficio por cóctel.

- `src/core/export/cartaASheet.ts` — el modelo, puro. No habla con Google.
- `src/services/google/sheetsCliente.ts` — permiso y llamadas a la API.
- `ActiveMenuModal.tsx` — `prepararRecetas()` extraída y **compartida** por las
  dos exportaciones.

**Decisiones que conviene no deshacer**

- **Va al lado de «Exportar», no en su lugar.** La impresa es para verla, la
  hoja para trabajarla. Son las dos mitades, no dos versiones de lo mismo.
- **`drive.file`, no `drive`.** Solo da acceso a los ficheros que crea esta app.
  El permiso se pide al pulsar el botón, no al entrar, y el token no se guarda.
- **SPARKLINE y no un gráfico.** En Sheets los gráficos son objetos flotantes
  sobre la cuadrícula: doce pasteles se descolocarían en cuanto ordenas o
  insertas una fila, que es justo lo que arruina una hoja hecha para editarse.
  SPARKLINE vive dentro de la celda y es fórmula: cambias el precio y la barra
  se redibuja sola.
- **`valueInputOption=USER_ENTERED`.** Con `RAW`, la fórmula entraría como texto
  y se vería escrita en la celda.
- **Un cóctel sin PVP deja el precio y el margen vacíos.** Nunca un 0 ni un
  margen inventado.

**Verificado**

`tsc` y `build` limpios; el botón renderiza en la modal con la carta real (12
recetas); el modelo probado con datos reales — cada fórmula apunta a **su
propia** fila, y *Mulligan*, sin PVP, sale con precio y margen vacíos. Bundle
desplegado comprobado: `A Sheets`, `SPARKLINE`, `drive.file` y `Coste /
Beneficio` están en `/assets/index-CKhZbBFo.js`.

**NO verificado, y por qué**

La llamada a Google. Exige conceder acceso al Drive con la cuenta del fundador,
y este agente no introduce credenciales. Además falta **habilitar la API de
Sheets y declarar el ámbito en Google Cloud**: hasta que eso se haga, el botón
devolverá un error de permiso. El código lo detecta y lo dice con esas palabras
en vez de soltar el error crudo de Google.

---

## 2026-08-16 · Claude Code · Techo de stock — la Fase 1 queda cerrada

**Qué se hizo**

`useStockRules` solo sabía de **mínimo** y de **cantidad a pedir**. Con eso se
avisa de lo que falta pero **no de lo que sobra**, y sobrar también cuesta: es
capital parado, y en producto fresco es merma esperando a ocurrir.

- `src/core/stock/nivelDeStock.ts` — el nivel, puro y compartido.
- `maxStock?` opcional en `StockRule`.
- Tercer campo en la modal de reglas, con su validación al escribir.
- Sección «Sobrestock» en Reglas & Alertas, en azul.
- `sugerirCantidad` recorta la propuesta a lo que cabe bajo el techo.

**Decisiones que conviene no deshacer**

- **Sin techo declarado no hay sobrestock.** Las 611 reglas de hoy no tienen
  `maxStock`. Si «sin máximo» valiera cero, el inventario entero habría salido
  sobrestockado el día del despliegue. Ausente = «no lo he decidido».
- **Sobrar no es una urgencia, así que no se pinta como tal.** Rojo = no puedes
  servir. Ámbar = te vas a quedar sin. Azul = dinero parado. Darle color de
  alarma le robaría atención a los dos que sí obligan a moverse hoy.
- **Un máximo por debajo del mínimo se rechaza donde se escribe**, no se
  invierte en silencio: eso sería inventar la intención del usuario.
- **El techo recorta la propuesta, nunca la línea.** Si ya estás en el máximo se
  propone 1 y se explica; no se deja la casilla a cero ni se impide escribir.
  Quien tiene una fiesta el sábado sabe algo que la regla no sabe.
- **La sección de sobrestock no lleva botón de acción.** La respuesta a «tengo
  de más» no es comprar ni tirar: es dejar de pedirlo, y de eso ya se encarga
  el recorte de la cantidad sugerida.

**Verificado**

27 pruebas de comportamiento en verde, entre ellas la que importa: **una regla
sin `maxStock` devuelve exactamente lo de antes**. En pantalla, con datos
reales: los tres campos, el aviso de contradicción con el guardado bloqueado, y
el semáforo del inventario intacto — 1.326 fichas, 610 verdes, 716 sin regla,
ningún azul porque todavía nadie tiene techo. La sección de sobrestock se montó
**en aislado** con datos inventados (+5 Bot, +22,5 Kg) para no escribir una
regla en el catálogo real; la sonda se borró después.

**Cómo se verificó una sección que no se puede provocar sin escribir datos**

Se montó `StockRulesPanel` solo, en una página aparte servida por Vite, con
reglas y stock de mentira. Es la salida cuando la única forma de ver algo en la
app sería tocar datos del negocio. La sonda vive lo que dura la comprobación.

---

## 2026-08-16 · Claude Code · T1, M5 y M6 — la Fase 2 queda cerrada

- **T1** · el rótulo decía «Recetario Maestro» también en Inventario y en
  Mercado, que no son un recetario. Ahora cambia con la pestaña.
- **M5** · la categoría era una franja de color con el nombre en un `title`: en
  el teléfono no hay ratón. Y con ratón tampoco identificaba nada — el color
  sale de un hash sobre 17 colores y hay 67 categorías, así que **cada color
  se repite unas cuatro veces**. (Aquí se escribió «724 categorías»: era el
  número de FICHAS de la depuración, no de categorías. Corregido el 2026-08-16
  al contarlas.) Iba a arreglarse «poniendo leyenda al color»; el
  color no tenía nada que explicar. Ahora la categoría va escrita y el color
  queda como punto de agrupación visual.
- **M6** · las líneas de cada pedido vivían en una caja de 96 px con su propia
  barra dentro de un panel que también scrollea (128 px en el historial, para
  grupos de 582 líneas). Una rueda dentro de otra siempre mueve la que no
  querías, y el borrar de cada línea del historial quedaba escondido detrás de
  ese scroll. Ahora se ven seis y el resto se despliega hacia abajo.

**Lo que se aprendió**

`renderOrderCard` era una **función de render**, no un componente: no podía
tener estado, así que «¿está desplegado este pedido?» no tenía dónde vivir.
Convertida en `TarjetaPedido`. El patrón «ver N más» quedó en `ListaConMas`
para no acabar con dos comportamientos distintos para lo mismo.

**Verificado** en pantalla con datos reales: los tres rótulos; 60 fichas de
Mercado con categoría escrita y ninguna franja ciega; y FRUTAS ELOY con 6 de
582 líneas, que al desplegar pinta las 582 con el contenedor en
`overflow: visible` y sin altura máxima.

---

## 2026-08-16 · Claude Code · Fase 3 · el informe en seco, y una alerta falsa viva

**Lo que se buscaba**: cumplir la condición 2 de las cinco del punto 17 —
*informe en seco completo antes de escribir un solo documento*.

**Lo que se encontró por el camino**: un fallo **ya en producción**.

AGUERRIDO, BENIGNO CUPREATA CAPON aparecía en «STOCK CRÍTICO (1)» con **0 Und**
y un «→ Pedir 1», mientras su propia ficha declaraba **3 und**. El Dashboard
contaba ese mismo producto en «1 STOCK BAJO». La alerta pedía comprar algo que
estaba lleno, y llevaba ahí desde que se fusionó el grupo Aguerrido.

**La causa: media app resolvía el alias y la otra media no.**
`buildCurrentStock` consolida existencias en el maestro; el cruce con las reglas
se hacía por el id crudo. Cuatro sitios con el mismo error: semáforo del
inventario, alerta de crítico, sobrestock y contador del Dashboard. Ahora todos
pasan por `core/stock/reglasPorProducto.ts`.

**La lección, que vale más que el arreglo**

Una fusión correcta —que no borra nada y se puede deshacer— **igualmente parte
la app en dos** si solo la mitad de las lecturas resuelve el alias. El daño no
aparece como un error: aparece como un número tranquilo y equivocado. Antes de
fusionar nada más hay que preguntar, por cada sitio que use un `ingredientId`:
**¿esto resuelve el maestro?**

Inventario hecho a fecha de hoy:

| Camino | ¿Resuelve el maestro? |
|---|---|
| `buildCurrentStock` (existencias) | Sí |
| Mercado (colapso de alias) | Sí |
| Reglas de stock, semáforo, Dashboard | Sí, **desde este commit** |
| `costCalculator.ts:149` (coste de receta) | **NO** — 1 receta afectada hoy |

**El informe en seco**, medido sobre los 40 grupos del catálogo real: **1
receta** y **17 reglas en 15 grupos** quedarían colgando de un alias si se
fusionara todo hoy. El informe lo dice ahora por grupo, antes de tocar nada.

**Pendiente y NO hecho a propósito**: resolver `masterProductId` en
`costCalculator`. Es el motor económico y no se toca sin aprobación del
fundador.

---

## 2026-08-16 · Claude Code · Auditoría de alias cerrada

Barrido de **todos** los sitios que cruzan por `ingredientId`. Tabla completa:

| Camino | Resuelve el maestro | Nota |
|---|---|---|
| `buildCurrentStock` (existencias) | ✅ | **Orden corregido**: consolidar y luego restar |
| `consolidarPorMaestro` | ✅ | **Re-etiqueta también un grupo de una sola fila** |
| `costCalculator` (coste de receta) | ✅ | Aprobado por el fundador |
| `costeEstimado` (aviso de dato aproximado) | ✅ | |
| `recipeDepletion` (producir una receta) | ✅ en la lectura | El id **emitido** no cambia, a propósito |
| `ProduceRecipeModal` (aviso de faltante) | ✅ | |
| Reglas de stock, semáforo, sobrestock, Dashboard | ✅ | `core/stock/reglasPorProducto.ts` |
| Mercado (colapso de alias) | ✅ | `colapsarAlias.ts` |
| `duplicateCandidates` | n/a | Su trabajo es mirar fichas, no productos |
| `useStockResolver` | n/a | Repara compras huérfanas: ahí el id crudo es el dato |
| Pizarrón, importador de CSV de recetas | n/a | No cruzan con existencias |

**Los dos hallazgos que no se buscaban**

1. **Se podía perder consumo sin que nada avisara.** Los movimientos se
   aplicaban antes de consolidar, y `applyMovementsToStock` resta buscando una
   fila con el id exacto: un consumo anotado sobre el maestro con las compras
   sobre el alias no encontraba nada que restar. El almacén seguía diciendo que
   hay algo que ya se gastó.
2. **`consolidarPorMaestro` no re-etiquetaba los grupos de una sola fila.** Era
   el origen de casi todo lo demás: un alias sin compras en su maestro conserva
   su id, así que cualquiera que preguntara por «las existencias del maestro»
   se iba de vacío. Los síntomas eran cuatro; la causa, una.

**La regla que queda**

> Consolidar significa que el producto tiene **un** id, tenga una ficha o cinco.
> Y antes de dar por buena una lectura que use un `ingredientId`, la pregunta es
> siempre la misma: **¿esto resuelve el maestro?** El daño de no hacerlo no
> aparece como un error, aparece como un número tranquilo y equivocado.
