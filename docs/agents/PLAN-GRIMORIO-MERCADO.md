# Plan — Grimorio: Recetas, Inventario y Mercado

**Actualizado:** 2026-08-06 · **Estado:** **bugs de datos RESUELTOS**;
decisiones de producto del catálogo global, pendientes.

Grimorio es un solo flujo operativo: **Mercado/pedido inicial → Inventario y
reglas → creación o recepción de Recetas → coste y operación**. Pizarrón y
Oráculo quedan expresamente fuera de este plan.

## ✅ Los tres bugs de datos, resueltos (2026-08-06)

**Causa única, y no era de la vista móvil:** `VITE_FIREBASE_APP_ID` se pegó en
Vercel con dos saltos de línea al final. Como `appId` forma parte de las rutas
de Firestore (`artifacts/${appId}/users/...`), todas ellas apuntaban a una
colección inexistente. Firestore no da error —una colección que no existe es
simplemente una colección vacía—, así que se veía como "no hay datos".

Corregido recortando toda la configuración en `src/config/firebaseConfig.ts`.
**Verificado en producción:** Mercado muestra 1367 productos y 3 proveedores, el
selector de ingredientes lista con normalidad y los conflictos de stock son 0.

> Pendiente: que el usuario limpie el valor en el panel de Vercel. El código lo
> recorta, pero el valor sigue sucio allí.

El diagnóstico de Codex que sigue **acertó al descartar** que fuera un problema
de CSS o de bifurcación móvil, y su paso 3 —"si `allIngredients` es 0,
investigar la consulta o permisos"— es exactamente el que cerró el caso. Se
conserva por eso.

La pista que estaba a la vista: **recetas y compras funcionaban**, y son las
colecciones que **no** usan `appId` en su ruta.

<details>
<summary>Diagnóstico previo (resuelto, se conserva por su método)</summary>

## Diagnóstico móvil (lectura de código)

La comprobación en una sesión autenticada a 390px sigue pendiente: no había una
sesión abierta disponible durante este diagnóstico. El recorrido de datos sí
permite separar las causas, sin inferir que sean de CSS.

| Incidencia | Veredicto | Evidencia |
|---|---|---|
| Inventario muestra alertas, no ~1300 productos | **No es la lista del catálogo.** El inventario solo construye existencias desde compras, menos movimientos. Si las compras no tienen `ingredientId` válido, se omiten de la lista y aparecen como conflictos de vinculación. | `GrimoriumView.tsx:296-303`, `usePurchaseIngredient.ts:14-39`, `stockUtils.ts:23-61` |
| Selector «Seleccionar ingrediente» vacío | **Debe recibir el catálogo** a través de `allIngredients`; no tiene rama móvil propia. Si está vacío, `useIngredients` devolvió `[]`/error/no se habilitó, o el usuario observa otro origen de selector. | `StockResolverPanel.tsx:86-97`; el catálogo procede de `useIngredients.ts:18-28` |
| Mercado vacío en móvil, lleno en escritorio | **La vista móvil usa la misma instancia de `IngredientListPanel` y el mismo `allIngredients`.** No hay bifurcación móvil de datos ni de renderizado en la llamada. El siguiente paso debe capturar `isLoading`, `error` y longitud en la sesión afectada; el código no sustenta una corrección responsive. | `GrimoriumView.tsx:90-96,835-855`; `PremiumLayout.tsx:104-117` transforma columnas en hojas, no los datos. |

### Prueba mínima pendiente en iPhone, 390px

1. Abrir Recetas, Inventario y Mercado con la cuenta afectada; capturar la
   consola para errores de Firestore e índice/permisos.
2. Registrar, temporalmente y sin datos sensibles, `allIngredients.length`,
   `useIngredients.isLoading/error`, `purchaseHistory.length` y
   `calculatedStockItems.length`.
3. Si `allIngredients > 0` y Mercado sigue vacío, investigar
   `IngredientListPanel`/filtros; si es 0, investigar la consulta o permisos.
4. Si hay compras sin `ingredientId`, usar el resolver; si hay ~1300 ingredientes
   pero ninguna compra, decidir explícitamente si Inventario debe representar
   catálogo, existencias reales, o ambos como listas distintas.

No aplicar cambios hasta obtener esa evidencia de sesión. En particular, no
mezclar «catálogo» con «stock real»: hoy son modelos distintos.

</details>

## El destino, en una frase (ampliado 2026-08-08)

Un usuario nuevo abre Nexus y **ya encuentra Mercado lleno** con los catálogos
de los proveedores de hostelería de Madrid. Lanza un **pedido ficticio** que le
monta el inventario del bar que ya tiene, sin gastar un euro. Le **comparten
recetas** de otro usuario y la app le resuelve los ingredientes que le faltan.
Cuando pide de verdad, la cesta **se reparte sola entre proveedores**, cada uno
recibe su hoja, y la factura que vuelve alimenta el control de gasto mensual.
Un **guía** lo lleva de la mano la primera vez que entra a cada pantalla.

Eso es el plan entero. Lo que sigue lo desmenuza y lo ordena.

**Dependencia dura entre piezas** — no se pueden adelantar:

```
catálogo de proveedores  →  pedido ficticio  →  recetas compartidas
        ↓                                              ↓
  multi-proveedor  →  envío externo  →  factura  →  economía
```

Recetas compartidas necesita que Mercado tenga producto (si no, "cómprame lo que
me falta" no tiene de dónde); el envío externo necesita que la cesta ya sepa
partirse por proveedor; y la contabilidad necesita facturas, que solo existen si
antes hubo pedido real.

## Decisiones bloqueantes del catálogo global ⬜ PENDIENTE

Antes de implementar Mercado-catálogos hay que acordar:

1. **Entrada y extracción:** PDF/Excel/CSV publicado, scraping autorizado o
   carga manual; propietario de la extracción y frecuencia de actualización.
   No existe instalada la skill `csv-inventario-app` citada en la nota previa.
2. **Taxonomía:** familia → subfamilia, más etiquetas transversales necesarias
   (frío/seco, alcohólico, formato, alérgenos, etc.).
3. **Visibilidad:** catálogo global leído por todas las cuentas, o copia por
   usuario; cambia reglas Firestore, coste de lectura, actualizaciones y borrado.
4. **Precio:** precio vigente con fecha, o histórico inmutable por proveedor y
   referencia. La recomendación a validar es histórico por observación de
   precio, manteniendo una proyección vigente para consulta.

Restricciones: `src/core/costing/costCalculator.ts` sigue siendo la fuente única
de coste y `src/utils/packNormalization.ts` la de unidades/formato. Cualquier
importación debe pasar por ellas; no crear una calculadora o normalizador paralelo.

## Roadmap transversal por entregas

### E1 — Fiabilidad de datos y contrato operativo

- Ejecutar la prueba móvil anterior y reparar solo la causa demostrada.
- Definir la separación visible entre catálogo, compra y stock real.
- Especificar el pedido inicial ficticio mensual: crea inventario desde una
  proyección, no factura ni gasto, y debe ser identificable/reversible.
- Acordar permisos para recetas compartidas: propietario autoriza, receptor
  previsualiza e importa; los ingredientes faltantes pasan a una lista de compra.

### E2 — Fundaciones del catálogo y de coste

- Resolver las cuatro decisiones bloqueantes y validar un proveedor con un
  catálogo de prueba.
- Modelo de catálogo global y referencias proveedor-producto; normalización,
  deduplicación auditable y precios fechados.
- Navegación móvil y escritorio para explorar por taxonomía, buscar y comparar;
  no duplicar los datos por usuario salvo decisión explícita.
- Enlazar referencias seleccionadas con ingredientes propios sin romper el
  coste ni el historial de compras.

### E3 — Pedido y recepción

- Preferencias/puntuación de proveedor y comparación reproducible.
- Cesta que divide el pedido por proveedor y genera una hoja por proveedor.
- Recepción de pedido: convierte líneas aceptadas en compras/stock, registra
  sustituciones, diferencias y precios efectivamente pagados.
- Preparar envío externo como integración posterior: requiere autorización por
  proveedor, credenciales/configuración y trazabilidad; no se enviará nada por
  defecto.

### E4 — Finanzas y colaboración de recetas

- Ingesta de facturas con revisión humana, conciliación con recepción y control
  mensual. Requiere política de retención, permisos y proveedor OCR si se usa.
- Recetas compartidas: autorización, versión/origen, importación y resolución
  de ingredientes faltantes en Mercado/Inventario.
- El coste operativo mantiene `costCalculator.ts` como única fuente; los datos
  de factura enriquecen compras, nunca lo sustituyen con fórmulas paralelas.

### E5 — Guía interna no IA

- Primer uso por pantalla: overlay/blur, foco sobre elemento real, secuencia
  lógica, Atrás/Siguiente/Omitir y ayuda repetible.
- Estado por usuario y versión de guía, accesible y no bloqueante.
- Recorrido Grimorio: Mercado → pedido inicial/Inventario y reglas → Recetas,
  incluidas recetas compartidas y compra de faltantes.

Cada entrega requiere diseño/validación en móvil y escritorio. Las integraciones
externas (envío de pedidos, OCR/facturas) no se activan sin autorización y
configuración explícitas.

---

# Ampliación 2026-08-08 — detalle de las entregas

Lo que sigue **no sustituye** el roadmap de arriba: lo concreta con lo que el
fundador especificó el 2026-08-08. Cada bloque dice a qué entrega pertenece.

## E1 · Pedido ficticio inicial ("ya tengo el bar montado")

**El problema real.** Un bar que ya está abierto tiene botellas en el almacén.
Obligarle a **comprar de nuevo** para que aparezcan en Inventario es pedirle que
gaste dinero y acumule producto que no necesita. Es el primer muro de entrada de
la app, y es artificial.

**Qué hace.** Un pedido que se cursa **contra el catálogo de Mercado** pero:

- no genera factura,
- no sale de la app —**no se envía a nadie**—,
- sí crea existencias en Inventario, con precio tomado del catálogo.

**Límite:** al menos **una vez al mes**. La periodicidad existe para que sea un
arranque y una regularización, no un atajo permanente para inventar stock.

**Reglas que debe cumplir:**

- **Identificable.** Cada compra nacida así queda marcada como tal. Si no se
  distingue de una compra real, el control de gasto de E4 queda envenenado desde
  el primer mes: aparecería un gasto que nunca ocurrió.
- **Reversible.** Se puede deshacer entero.
- **Sin coste falso.** Cuenta para existencias y para el coste de escandallo,
  **no** para el gasto del periodo.
- Pasa por `costCalculator.ts` y `packNormalization.ts` como cualquier otra
  compra. Sin excepciones ni atajos.

**Decisión pendiente:** qué precio se le asigna. ¿El del catálogo el día del
pedido ficticio, o cero? Afecta directamente al escandallo. La recomendación a
validar es **precio de catálogo marcado como estimado**: un coste aproximado es
útil; un coste cero miente en todas las recetas.

## E4 · Recetas compartidas entre usuarios

**Para qué.** Un usuario nuevo entra, ve Mercado lleno, pero crear su primera
ficha de receta le cuesta. Que alguien le comparta unas cuantas resuelve dos
cosas a la vez: **ve la app funcionando con datos reales** y aprende el formato
de la ficha copiando una que ya está bien hecha.

**Flujo, con la autorización en el sitio correcto:**

1. El propietario comparte una o varias fichas con otro usuario de Nexus.
2. El receptor **previsualiza** antes de aceptar nada.
3. Al importar, la app calcula **qué ingredientes le faltan** en su catálogo y
   en su inventario.
4. Le propone: añadir esos ingredientes a su catálogo, y **comprar en Mercado**
   los que no tenga.
5. **Nada de esto ocurre sin que el receptor lo autorice**, y la autorización es
   por paso, no un único "acepto" que arrastre compras detrás.

> El punto delicado es el 4. Que importar una receta pueda **generar un pedido**
> es exactamente el tipo de efecto que un usuario no espera de un botón
> "importar". La compra debe ser una decisión aparte, con su propia pantalla y
> su importe a la vista.

**A resolver al diseñarlo:** identidad y origen de la ficha compartida
(quién la escribió, qué versión), si el receptor obtiene una copia
independiente o un enlace vivo —la recomendación es **copia**, para que editarla
no altere la del autor—, y qué ocurre con las sub-recetas y garnishes que
cuelgan de ella (se arrastran, o se rompen los enlaces).

## E2 · Catálogo de proveedores de Madrid

**El objetivo.** Que Mercado contenga los catálogos de **todos** los proveedores
de hostelería de Madrid, agrupados y organizados. Nombres puestos sobre la mesa
como punto de partida: **Bordino, In Vino Veritas, La Fuente, Álvarez,
Barkonsult, OTC, Amer Global, Martins Brands**, y los que se vayan encontrando.
Fruta y verdura es una familia aparte —**Frutas Eloy** o equivalente—, y esa
separación no es un detalle: es la que fuerza el reparto de E3.

Un mismo producto **existirá en varios proveedores a distinto precio**. Ese es
el dato que da valor a todo lo demás; el modelo debe soportarlo desde el primer
día, no añadirlo después.

**Esto sigue bloqueado por las cuatro decisiones de más arriba.** En particular
la de extracción: no es lo mismo un PDF publicado que una tarifa que el
comercial manda por WhatsApp, y de eso depende quién mantiene el catálogo al día
y con qué frecuencia. **El catálogo no se mantiene solo**, y un catálogo con
precios de hace un año hace daño en vez de ayudar.

## E3 · Un pedido, varios proveedores

**El caso que lo define.** El usuario mete en la cesta: 5 botellas de Bacardí,
4 de Martini Rosso, la gama Monin completa, 12 L de zumo de limón, 6 L de
naranja y 4 kg de limas.

Ningún distribuidor de alcohol sirve fruta. El pedido **tiene que partirse**: una
parte a Bordino, otra a una frutería.

**Lo que hace el sistema:**

1. Para cada línea, mira qué proveedores la tienen.
2. Elige proveedor por **preferencia del usuario** o por **puntuación** —el
   sistema de puntos está por inventar, y hasta que exista manda la preferencia
   manual—.
3. Agrupa por proveedor y **genera tantas hojas de pedido como proveedores**.
4. El usuario ve el reparto **antes** de que salga nada, y puede moverlo a mano.

La generación de la hoja de pedido **ya existe**. Lo nuevo es el reparto y la
comparación entre proveedores.

**Caso a decidir:** el mínimo de pedido. Repartir con criterio de precio unitario
puede dejar dos líneas sueltas en un proveedor que exige 150 € mínimos. La
comparación tiene que ser **por pedido completo**, no línea a línea, o
recomendará cosas que no se pueden cursar.

## E3/E4 · Envío externo y vuelta de la factura

**El objetivo del fundador:** que la hoja de pedido salga sola hacia el
**comercial** de cada proveedor por WhatsApp o correo, que este prepare y
facture, y que **la factura vuelva a Nexus** y alimente un control de economía:
cuánto se está gastando este mes, y dónde se podría optimizar.

**Es la parte más difícil del plan, y no por el código.** Conviene decirlo
claro para que no sorprenda a mitad de camino:

- **Los datos de contacto de los comerciales no existen en ninguna base de
  datos.** Hay que recopilarlos uno a uno y mantenerlos: la gente cambia de
  empresa. Es trabajo manual y continuo, no un desarrollo.
- **WhatsApp no se automatiza sin más.** El envío programático exige la API de
  WhatsApp Business: número de empresa verificado, plantillas aprobadas de
  antemano y un proveedor de por medio. No es "abrir un enlace de WhatsApp".
- **Correo es mucho más barato de arrancar** y no depende de aprobaciones
  ajenas. Recomendación: **empezar por correo**, con WhatsApp después.
- **Enviar es irreversible.** Un pedido mal partido que sale solo llega a un
  proveedor de verdad. Debe existir siempre una confirmación explícita del
  usuario, y una hoja que se pueda revisar antes de salir.
- **La factura que vuelve es un PDF de formato libre.** Leerla automáticamente
  es OCR con revisión humana; cada proveedor tiene su plantilla. La primera
  versión razonable es **subir la factura y casarla a mano** con el pedido, y
  automatizar después con datos reales delante.

**Escalón intermedio que da casi todo el valor sin nada de lo anterior:**
generar la hoja por proveedor y dejar que el usuario **la envíe él** con un
toque (compartir nativo, o abrir el correo con todo redactado). El pedido sale
igual, y la app no depende de integraciones ni de credenciales de nadie.

**La economía es lo último**, y no por importancia: sin facturas conciliadas no
hay nada que contabilizar. El escalón previo es **gasto por proveedor y por mes
a partir de las compras registradas**, que ya existen. Eso se puede tener pronto
y responde a la mitad de la pregunta.

## E2/E3 · Agrupación por proveedor en secciones plegables

**Decidido el 2026-08-09.** Aplica a **Inventario y Mercado**, y es la respuesta
estructural a la pregunta «¿cómo se navega esto cuando haya miles de productos
de decenas de proveedores?».

**La idea, en las palabras del fundador:** todo lo que venga de Bordino, en una
sección de Bordino; todo lo de Frutas Eloy, en la suya; lo de Coca-Cola en la de
Coca-Cola. Secciones que se pliegan y se despliegan. Al tocar una, se abre el
catálogo entero de ese proveedor.

En **Mercado** hay además varios proveedores por familia: alcoholes tiene
Bordino, In Vino Veritas, La Fuente y Álvarez; fruta tiene Frutas Eloy, El Anón
Cubano y Frutería Madrid; refrescos tiene Coca-Cola, Pepsi y Schweppes.

### Por qué esto no es solo estética

Resuelve **I5** de `AUDIT-INVENTARIO-MERCADO.md`: hoy Inventario son 1.325
tarjetas de ~180 px seguidas, unos 238.000 px de scroll. Con secciones plegadas,
**lo cerrado no se monta**, así que el árbol de nodos cae de miles a decenas.
Es a la vez la mejora de navegación y la de rendimiento — y muy probablemente
buena parte del **A4** de `AUDIT-MOVIL.md` (Inventario lento al tocar).

### Estado real de los datos (medido en producción, 2026-08-09)

Antes de diseñar sobre lo que habrá, conviene mirar lo que hay:

| | |
|---|---|
| Referencias en Mercado | 1.367 |
| **Productos** tras agrupar duplicados | **279** |
| IN VINO VERITAS | 143 productos |
| FRUTAS ELOY | 109 |
| **BORDINOS** | **1** |
| Sin proveedor asignado | ~26 |

Dos lecturas, y las dos importan:

- **La cobertura es mejor de lo esperado**: ~9 de cada 10 productos ya tienen
  proveedor. La agrupación tiene con qué trabajar desde el primer día.
- **Pero Bordino tiene UN producto.** La sección «todo el alcohol de Bordino»
  que se imagina hoy saldría con una sola línea: el alcohol está casi todo bajo
  In Vino Veritas o sin asignar. **La agrupación no crea el dato**; hará
  evidente lo que falta, que es justo lo que se quiere de ella.

### Decisiones de diseño

1. **Eje de agrupación: el proveedor.** En Mercado, segundo nivel por categoría
   cuando el proveedor sea grande (In Vino Veritas ya tiene 143). En Inventario
   basta un nivel, al menos al principio.
2. **La sección «Sin proveedor asignado» se muestra siempre**, nunca se esconde:
   es la lista de tareas de limpieza del catálogo, y ahora mismo es la única
   forma de ver qué falta por asignar.
3. **En Mercado agrupado por proveedor se listan REFERENCIAS, no productos.**
   Cada proveedor enseña su propia entrada con su precio y su formato — que es
   justo lo que permite comparar. El distintivo «N opc.» cambia de sentido: pasa
   de «hay N opciones» a «también en otros N proveedores», y debe llevar a las
   otras.
4. **Lo plegado no se renderiza.** No es `display:none`: es no montar. De ahí
   sale la mejora de rendimiento.
5. **El estado de plegado se recuerda** por usuario y por pestaña. Quien trabaja
   con un proveedor no quiere volver a abrirlo cada vez.
6. **La búsqueda atraviesa las secciones**: al buscar, se abren solas las que
   tengan resultados y se indica cuántos hay en cada una.
7. **Cabecera de sección con lo que importa de un vistazo**: nombre del
   proveedor, nº de productos y —en Inventario— valor acumulado de ese
   proveedor. Ese último número no existe hoy en ninguna pantalla y responde
   solo a «cuánto dinero tengo parado con cada proveedor».

### Dependencias — leer antes de empezar

- **Inventario depende de M2.** El proveedor de un ítem de stock sale de la
  compra, y `handleReceiveOrder` lo vuelve a deducir del ingrediente al recibir
  en vez de leerlo del pedido. Mientras eso siga así, agrupar Inventario por
  proveedor agrupará por un dato que puede ser incorrecto. **M2 va antes.**
- **Conviene después de I1** (unidades canónicas), porque la cabecera de sección
  con el valor acumulado suma importes que hoy no son fiables donde hay dos
  formatos del mismo producto.
- No depende del catálogo de proveedores de Madrid (E2): funciona ya con los
  tres proveedores actuales, y escala sola cuando entren los demás.

### Encaje en las fases

Va en la **Fase 2** de `AUDIT-INVENTARIO-MERCADO.md` («que se pueda usar con el
pulgar»), y **sustituye** al punto genérico de «filas densas + virtualización»:
las secciones plegables son la forma concreta que toma esa fase. La densidad de
fila sigue haciendo falta *dentro* de cada sección abierta.

## E5 · El guía de primer uso

**Alcance ampliado:** el fundador lo quiere **en todas las vistas de todas las
secciones**, no solo en Grimorio.

**Comportamiento:** al entrar por primera vez a una vista, toma la pantalla —
desenfoca y oscurece todo **menos el elemento que hay que tocar**— y lleva al
usuario por una secuencia de pasos. La siguiente vez ya no aparece, pero la guía
**se puede volver a lanzar** cuando el usuario quiera.

**Recorrido de Grimorio**, que es el que define el orden correcto del módulo:

1. Comprar en **Mercado** para tener producto.
2. Cómo funcionan **stock y reglas** en Inventario.
3. Crear una **receta**, o pedir que te compartan una.
4. Sobre todo: **cómo se trabaja con la ficha de receta**.

**Una decisión que tomar, con recomendación.** El fundador lo llama "agente" y
dice que "vivirá dentro de Nexus". El plan original lo especificó como guía
**no IA**. La diferencia importa: una guía con guion fijo cuesta **cero** por
uso, funciona sin conexión al gateway y es predecible; un agente con IA cuesta
una llamada por paso, en la pantalla donde el usuario todavía no ha aportado
nada, y puede equivocarse justo cuando el usuario aún no sabe distinguirlo.

> Recomendación: **v1 con guion determinista**, con la puerta abierta a que más
> adelante un agente conteste preguntas libres *dentro* de esa guía. El efecto
> visual —desenfoque, foco, pasos— es el mismo en ambos casos, así que empezar
> por el guion no cierra ninguna puerta. Ver `PLAN-CEREBRITY.md` para el criterio
> general sobre gasto de API.

**Cuidado con el orden:** una guía escrita antes de que el flujo esté cerrado se
queda obsoleta a la primera. Va **después** del pedido ficticio y de recetas
compartidas, porque son justo los pasos que tiene que enseñar.

