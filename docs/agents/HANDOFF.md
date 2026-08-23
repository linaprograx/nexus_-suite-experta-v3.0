# Estado del relevo

> Este archivo se reescribe entero al cierre de cada sesión. El historial
> acumulado vive en `docs/agents/WORKLOG.md`.

---

**Última actualización:** 2026-08-12
**Estado:** árbol limpio, TypeScript 0 errores, build correcto. `HEAD`,
`deploy/mobile-v1` y ambas ramas en `origin` sincronizadas y desplegadas.

## Dónde se trabaja

| | |
|---|---|
| Worktree | `/Users/lianalviz/nexus-suite-mobile-v1` |
| Desarrollo | `feat/mobile-v1-unified` ← trabaja aquí |
| Producción | `deploy/mobile-v1` |
| URL | `https://nexus-suite-experta-v3-0.vercel.app` |

### Desplegar — a las DOS ramas, siempre

```bash
git push origin feat/mobile-v1-unified
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

### Verificar el despliegue — tres condiciones, no una

Esto costó **cuatro falsos positivos en un solo día**. Un marcador vale solo si
cumple las tres:

1. **El bundle se descargó**: vuélcalo a fichero y comprueba que pesa ~4 MB. Un
   `curl` fallido deja el fichero vacío y cualquier `grep -c` da 0, que se lee
   como «ya no está».
2. **Cadena de control presente** (`Recetario Maestro`). Prueba que estás
   leyendo la app y no una respuesta rara.
3. **Solo entonces**, el marcador de tu cambio.

Y el marcador **no puede ser**:
- un nombre de variable o de prop → el minificador los renombra;
- una cadena con tilde escrita sin tilde en el `grep`, ni con `·`. Pasó otra
  vez el 12-08: `grep 'Compra rapida'` dio 0 y el texto real era «Compra
  rápida»;
- una clase CSS de una rama que sigue existiendo aunque nadie la active;
- un identificador que React ya incluye por su cuenta (`fetchPriority`).

**Lo más fiable es el cambio de hash del bundle** más la cadena de control.
Cadenas de texto visible al usuario son buenos marcadores; todo lo demás, no.

```bash
JS=$(curl -s "$URL/?cb=$RANDOM" | grep -o 'assets/index-[^"]*\.js' | head -1)
curl -s "$URL/$JS" -o /tmp/prod.js && wc -c < /tmp/prod.js
grep -c -F 'Recetario Maestro' /tmp/prod.js   # control
grep -c -F 'TU_CADENA_VISIBLE' /tmp/prod.js   # marcador
```

## Reglas de seguridad, no negociables

- Datos **reales** (~1.326 ítems, ~1.380 referencias, 32 recetas). Ninguna
  acción destructiva para verificar. Abrir un modal y **cancelar** sí vale.
- Migraciones: informe en seco → aprobación → **las ejecuta el fundador**.
- `core/costing/` y Grimorio Recetas están cerrados. **No tocar
  `buildStockFromPurchases`**: lo consume el motor de coste.
- Identidad: la similitud de nombres solo **propone**. Un grupo por operación.
- Fusión: **primero** trasladar la oferta del alias a `supplierData` del
  maestro, **después** escribir `masterProductId`. Nunca borrar el alias.
- **No introducir credenciales.** Si el servidor de desarrollo pierde la
  sesión, se verifica por otra vía (render aislado, pruebas sintéticas) y se
  dice que no se verificó en pantalla.

## Decisiones de diseño vigentes

Las tres primeras están explicadas a fondo en `CONTEXT.md`.

- **La franja de Grimorio NO se pliega.** Si algún día estorba: hacerla **más
  baja**, no volver a esconderla.
- **Una lista de más de 15 elementos se agrupa y se pliega.** Pieza:
  `components/ui/Plegable.tsx` con `UMBRAL_LISTA_LARGA`. Por debajo del umbral
  **no** se agrupa.
- **El logo NO lleva filtros CSS.** Ni `blur()`, ni `drop-shadow`, ni
  animaciones de `filter` cerca. Ver más abajo por qué.
- **Los modales van a `document.body`.** `components/ui/CapaModal.tsx` para los
  nuevos; la primitiva `Modal` ya lo hacía.
- **Precio con varias ofertas:** manda el proveedor preferente aunque otro sea
  más barato, y se señala la alternativa. Sin preferente, el más barato y se
  avisa. `core/identity/offerSelection.ts`, **conectado** en Mercado a través
  de `opcionesDeCompra.ts`. El motor de coste sigue sin usarlo.
- **Agrupación visual:** Inventario por familia; Mercado por proveedor.
- **Carta:** con alcohol primero, sin alcohol después, en pantalla y al exportar.

## Estado funcional

| Bloque | Estado |
|---|---|
| Recetas | **Cerrado.** `Escandallo = Ficha = Análisis = Lista` |
| Identidad A–D | Hecho. El fundador fusionó el grupo Aguerrido: 1327 → 1326 ítems con el valor intacto |
| Ingrediente exprés | Hecho: `pendienteRevision`, fuera de automatismos, filtro en Mercado |
| Fase 0 · cimientos | `origen` ✅ · I1 ✅ · I2 ✅ · I3 ✅ · I4 ✅ |
| Fase 1 · pedido útil | **CERRADA.** M1 compra ✅ · M1 hoja ✅ · M2 ✅ · M3 cantidad ✅ · punto 3 techo ✅ |
| Escrituras en lote | ✅ `services/firestore/escrituraPorLotes.ts`, cinco sitios convertidos |
| Mercado · buscar y agrupar | ✅ Fases 1–4. Un solo buscador en los ocho sitios |
| Fase 2 · navegación | **CERRADA.** Plegables ✅ · M5 ✅ · M6 ✅ · T1 ✅ |
| Fase 3 · modelo canónico | **CERRADA.** 17 ✅ · 16 ✅ · 19 ✅ · 20 ✅ · taxonomía, precios y lector de catálogos ✅ |
| Fase 4 · alertas | **EN MARCHA.** 5 ✅ · 6 ✅ · 8 ✅ · 34 ✅ · **falta el 7 (zonas)** |
| Punto 34 · gasto | ✅ escalón barato: por proveedor, por mes y concentración |
| Puntos 19 y 20 | **CERRADOS.** Preferente elegible desde Mercado · filtro por proveedor completo |
| Fase 3 · modelo canónico | **EN MARCHA.** Decisiones ✅ · alias resueltos en toda la app ✅ · taxonomía ✅ · precios ✅ · lector de catálogos ✅ (sin escribir) |

## ⏸️ Lo siguiente — EMPIEZA POR AQUÍ

### Mercado · CERRADO. Las cuatro fases

Mercado no es que no agrupara: **agrupaba mal**, con un emparejador propio
ajeno al sistema de identidad, y buscaba con un `includes`.

- **Fase 1 ✅** `core/identity/colapsarAlias.ts`. Los alias con
  `masterProductId` dejan de ser fila. Dos trampas: buscar por el nombre del
  alias **sustituye** por el maestro en vez de descartar (descartarlo dejaba la
  búsqueda vacía habiendo escrito un nombre que existe), y un maestro borrado
  habría hecho desaparecer la ficha, así que se comprueba que exista.
- **Fase 2a ✅** `core/search/buscador.ts`. «vodka absolut» daba **cero**
  resultados y «limon» no encontraba «LIMÓN». Ahora normaliza, exige TODOS los
  términos, acepta prefijo de palabra y ordena por relevancia.
- **Fase 2b ✅** `core/identity/agruparProductos.ts`. El emparejador viejo se
  conformaba con **una** palabra fuerte común: metía AGUERRIDO ANTONIO, BENIGNO
  y TOMAS en un grupo y enseñaba uno. **Tres mezcales, uno visible**, y la
  alerta de stock crítico señalaba un producto que el buscador no mostraba.
  Ahora rige el conjunto **idéntico** de palabras fuertes.
- **Fase 3 ✅** `core/identity/opcionesDeCompra.ts`. La insignia «N opc.» se
  despliega: proveedor, ficha, precio y formato, con la que manda marcada.
  Conecta por fin `offerSelection` —preferente aunque sea más caro, señalando
  la alternativa—. **Y no compara lo incomparable**: solo compite el precio por
  unidad base; si los formatos no coinciden (0.700 L frente a UND), se listan
  todas y **no se corona a ninguna**.
- **Fase 4 ✅** Medido antes de tocar: 414 ms de bloqueo por tecla con 1.380
  tarjetas, de los cuales **solo 30 ms eran buscar y agrupar**. El cuello de
  botella era pintar el catálogo entero. Se conectó `useDebounce` —que ya
  estaba escrito y sin usar— y se pintan 60 tarjetas con «Mostrar más».
  Resultado: **37–56 ms y un 94 % menos de nodos**.
- **El buscador, en los ocho sitios ✅** Recetas, compra rápida, hoja de
  reposición, Inventario, conteo físico, modal de reglas, generador de carta y
  `Combobox` (la primitiva compartida). Dos decisiones no mecánicas:
  Inventario filtra por categoría **antes** de buscar, para no deshacer el
  orden por relevancia; y el conteo físico busca pero ordena **alfabéticamente**,
  porque ahí se recorre la lista con las botellas delante.

**Hallazgo para el fundador:** AGUERRIDO, TOMAS CUPREATA tiene dos fichas del
**mismo proveedor** a €89,50 y €68,50, ambas en 700 ml. Un 24 % de diferencia
que estaba invisible, y un duplicado que el informe de identidad puede fusionar.

### Después de Mercado

- **Punto 3 · stock máximo y sobrestock**, lo único que queda de la Fase 1.
  `useStockRules` solo sabe de mínimo y de cantidad de reposición: no hay techo,
  así que no se puede avisar de que sobra producto. Es barato, no depende de
  nada y alimenta las alertas de la Fase 4. Con anulación manual: nada de
  bloqueos absurdos.
- **Selector de la barra lateral ✅.** Degradado horizontal del color de la
  sección. La barrita sólida de 3 px que se propuso **se retiró**: el fundador
  vio el corte entre la barra y el degradado. Es un solo degradado de siete
  paradas, sin raíl.
- **264 referencias sin proveedor.** No es un fallo del código: son fichas sin
  asignar. Decisión del fundador.

## Pedido y aún no hecho

- **Un pastel 3D flotante para el total de la carta** (coste total contra
  margen total). Ofrecido y no elegido. Por fila no se hace, y el motivo está
  en `cartaASheet.ts`: los gráficos de Sheets flotan sobre la cuadrícula, así
  que doce se descolocarían al ordenar. Uno solo, arriba, sí aguanta.
- **Dashboard y Pizarrón**: sus colores de sección (`#4f46e5` y `#475569`)
  siguen siendo **propuestas**. Los demás están verificados contra la pantalla.
- **Tres modales de Avatar** siguen con el patrón crudo `fixed inset-0 z-50` en
  vez de `CapaModal`. Funcionan hoy; se caerán detrás en cuanto un ancestro
  cree contexto de apilamiento.

## Pendiente del fundador

- **Que exportar a Sheets no pida permiso cada vez.** Pedido el 2026-08-16.
  Hoy el token de Drive **no se guarda a propósito** —caduca en una hora y así
  no queda un permiso de Drive durmiendo en el navegador— pero eso obliga a
  pasar por la ventana de Google en cada exportación.

  Lo que hay que decidir antes de tocarlo: **dónde vive el token**. Guardarlo en
  el navegador es cómodo y es exactamente lo que se evitó. La vía limpia es un
  *refresh token* en el servidor —el gateway que ya existe para El Vigía— de
  modo que la app pida el permiso **una vez** y después el servidor renueve el
  acceso sin volver a molestar. Eso convierte esto en trabajo de backend, no de
  la app, y va con su propia decisión de seguridad.

  Se junta de forma natural con el otro pendiente de Google: servir
  `/__/auth/*` desde el propio dominio. Los dos tocan el arranque de sesión.


- **El arreglo de raíz del «A Sheets» en la app instalada.** Decidido el
  2026-08-16: de momento el aviso; **antes de producción**, servir `/__/auth/*`
  desde el propio dominio con una redirección en `vercel.json` y dejar de pasar
  por `firebaseapp.com`. Arregla la exportación dentro de la app instalada y de
  paso el login por redirección que se abandonó por roto. Toca el arranque de
  sesión de todos, así que va con su verificación y es reversible quitando la
  redirección.

- **Habilitar la API de Google Sheets** en su proyecto de Google Cloud y
  declarar el ámbito `drive.file` en la pantalla de consentimiento. **Sin esto
  el botón «A Sheets» dará error de permiso**, por muy bien escrito que esté el
  código: no es algo que pueda hacer el código ni el agente. Es el único paso
  que falta para que la exportación funcione.
- **Probar «A Sheets»** una vez habilitado (Grimorio → Recetas → Carta). El
  agente no puede: exige conceder acceso al Drive con su cuenta, y no introduce
  credenciales. Lo verificado es el modelo de la hoja y que el botón renderiza.
- **Confirmar formatos en «Revisar Unidades»** (Mercado → panel lateral). 27
  bloqueadas están dentro de recetas, con €6.032,49 detrás. Confirmar 700 en
  una que ya está en 700 no cambia ningún coste: la pasa de suposición a dato,
  que es todo el objetivo.
- **El logo.** Parado a petición suya hasta que rehaga el fichero. La causa está
  medida: el original tiene separaciones **blancas** entre las palas que **se
  abren hacia fuera**, así que al recortar el fondo se fueron con él —de 26.679
  píxeles transparentes solo 3 quedan encerrados—. Sobre blanco se ve íntegro;
  sobre oscuro las separaciones dejan pasar el fondo. **No falta color, falta
  fondo: ningún CSS lo arregla.** Hace falta una exportación con los huecos
  dibujados.
- **`VITE_FIREBASE_APP_ID` en Vercel** sigue con dos saltos de línea al final.
  El código lo recorta y la app funciona, pero el valor sigue sucio. Fue la
  causa raíz de Mercado vacío y costó tres diagnósticos equivocados.
- **Depuración de categorías**: lista, previsualiza 724 fichas, con deshacer.
  Sin ejecutar. Ya trocea en lotes de 450, así que las 724 no son un problema.
- **Validar una importación real** con un CSV de 3–4 filas, si quiere estar
  seguro del troceado antes de meter un catálogo entero. No se ha probado
  contra Firestore: escribiría en su catálogo.

## Código muerto localizado y NO retirado

- `src/components/grimorium/RecipeCard.tsx` — no lo importa nadie; la tarjeta
  real vive dentro de `RecipeList.tsx`.
- `src/features/ingredients/useIngredients.ts` — duplicado del de `hooks/`.
- `RecipeToolbar.tsx` e `IngredientToolbar.tsx` — importados y nunca
  renderizados.
- `src/views/UnleashView.tsx` + `src/views/unleash/` — no enrutado.
- `PowerTreePanel.tsx:92` — `from-[${palettes.violet.primary}]` mete una
  plantilla de JavaScript dentro de una clase de Tailwind y genera CSS roto.
  Sale como aviso en cada build.

> **Si algo parece una función y no responde, comprueba primero si está
> conectado**, antes de darlo por roto y «arreglarlo».
