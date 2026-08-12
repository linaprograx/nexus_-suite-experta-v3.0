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
  avisa. Implementado en `core/identity/offerSelection.ts`, **sin conectar**.
- **Agrupación visual:** Inventario por familia; Mercado por proveedor.
- **Carta:** con alcohol primero, sin alcohol después, en pantalla y al exportar.

## Estado funcional

| Bloque | Estado |
|---|---|
| Recetas | **Cerrado.** `Escandallo = Ficha = Análisis = Lista` |
| Identidad A–D | Hecho. El fundador fusionó el grupo Aguerrido: 1327 → 1326 ítems con el valor intacto |
| Ingrediente exprés | Hecho: `pendienteRevision`, fuera de automatismos, filtro en Mercado |
| Fase 0 · cimientos | `origen` ✅ · I1 ✅ · I2 ✅ · I3 ✅ · I4 ✅ |
| Fase 1 · pedido útil | M1 compra ✅ · M1 hoja ✅ · M2 ✅ · **M3 cantidad pendiente** |
| Escrituras en lote | ✅ `services/firestore/escrituraPorLotes.ts`, cinco sitios convertidos |

## ⏸️ Lo siguiente — EMPIEZA POR AQUÍ

### Mercado · agrupar variantes. Plan aprobado, Fase 1 sin empezar

Buscar «absolut» debe dar **un** resultado con sus opciones dentro. Investigado
el 12-08; **el plan está aprobado y la Fase 1 no se ha tocado todavía.**

**Lo que se encontró, y cambia el enunciado:** Mercado **ya agrupa**
(`aggregatedProducts` en `IngredientListPanel`). No falta la función, falla la
que hay, y falla de tres maneras:

1. **Compara contra el nombre del grupo, no contra sus miembros.** El código
   omite la comprobación transitiva «por rendimiento», así que el agrupado
   **depende del orden**: dos fichas que se parecen a una tercera pero no entre
   sí acaban separadas.
2. **Es un segundo motor de parecido**, ajeno al de identidad. Usa prefijo
   (≥3 letras) y *substring* (>3). Es la familia de reglas que metió MANDARINA
   en el grupo Absolut y que se corrigió en `duplicateCandidates` exigiendo
   **conjuntos idénticos de palabras fuertes**. Esa corrección **no existe
   aquí**: hoy Mercado puede estar juntando cosas distintas sin avisar.
3. **Ignora `masterProductId`.** Los alias que el fundador ya fusionó **siguen
   apareciendo como fila propia**.

Además: el precio mostrado es siempre el más barato, ignorando
`offerSelection.ts`; y el algoritmo es O(N²) con la tokenización dentro del
bucle (~950.000 comparaciones sin término de búsqueda).

**Las cuatro fases, en orden:**

1. **Colapsar lo ya decidido.** Los alias con `masterProductId` dejan de ser
   fila y pasan a ser una opción dentro de su maestro. Riesgo cero: no es
   parecido, es una decisión humana ya tomada, reversible quitando el campo.
2. **Un solo motor de identidad.** Sustituir `doTokensMatch` por la regla de
   `duplicateCandidates`. **Aviso: saldrán MÁS filas, no menos**, porque lo que
   hoy se agrupa por prefijo dejará de agruparse. Es correcto, pero es visible:
   **enseñar antes/después sobre datos reales antes de dejarlo**.
3. **La ficha del grupo.** Una fila por producto con «N opciones» desplegable:
   proveedor, precio, formato, y cuál manda según `offerSelection`.
4. **Rendimiento.** Índice por clave en lugar de comparar contra todos.

### Después de Mercado

- **M3 · cantidad en el pedido**, lo último de la Fase 1.
- **Selector de la barra lateral.** El fundador propuso dos opciones y se le
  recomendó la suya nº 2 —degradado del color de la sección, no el arcoíris del
  logo— **con una corrección**: en una fila de 38 px un desvanecido vertical se
  lee como una mancha, así que va **de izquierda a derecha**, anclado por una
  barrita sólida de 3 px en el borde izquierdo. Los degradados por sección ya
  existen en `PremiumLayout` (`gradients`). **Sin visto bueno todavía.**
- **264 referencias sin proveedor.** No es un fallo del código: son fichas sin
  asignar. Decisión del fundador.

## Pendiente del fundador

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
