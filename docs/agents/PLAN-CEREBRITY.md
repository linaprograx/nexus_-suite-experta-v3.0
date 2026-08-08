# Plan — Cerebrity

**Creado:** 2026-08-08 · **Estado:** auditoría de código hecha, sin ejecutar
ni una llamada de IA. **Nada corregido todavía.**

Cerebrity está construido, como el resto de secciones. Lo que no se ha hecho
nunca es **recorrer su flujo y corregirlo**, porque hacerlo con la IA conectada
consume llamadas de API y eso cuesta dinero real.

---

## La regla de gasto

> **Cada llamada a la IA la paga el usuario de su bolsillo. Trabaja como si
> cada una fuese la última.**

En la práctica:

- **Lee el código antes de ejecutar.** Casi todo lo que hay que arreglar aquí se
  ve sin generar nada — de hecho, todo lo de este documento se encontró leyendo.
- **Nunca pruebes en bucle.** Una batería fija de 2–3 recetas patrón, una pasada
  por poder. Nueve poderes son nueve llamadas, no noventa.
- **Guarda las respuestas** de esa batería como fixtures. La segunda vuelta de
  desarrollo se hace contra el fixture, con coste cero.
- **Separa el envoltorio del contenido.** Que el prompt se arme bien, que el
  contexto llegue completo y que la respuesta se pinte donde debe **no requiere
  IA**: se comprueba con una respuesta guardada.
- El `ai-gateway` **no está desplegado** (`CONTEXT.md`). Hoy Cerebrity da
  `ERR_CONNECTION_REFUSED` contra `localhost:3001` si no se levanta a mano.

---

## Lo que la auditoría de código encontró

### 1. 🔴 Hay dos "Synthesis", y una es un decorado

La Synthesis real es la pestaña **`creativity`** de `src/views/CerebrityView.tsx`
— el rótulo `SYNTHESIS` se pinta en `:845`. Esa lee recetas e ingredientes
(`useRecipes` / `useIngredients`, `:102-103`) y llama al gateway de verdad
(`generateText`, `:208`, `:258`, `:451`).

Pero existe además `src/views/unleash/SynthesisView.tsx`, con:

- su propia interfaz de tres columnas,
- **`handleGenerate` con el resultado escrito a mano** (`:50-65`) —
  *"Mock generation logic - In production, this would call Gemini API"*—,
- y **ningún poder importado**: sus dos únicos imports son `React` y `Recipe`.

No está enrutado: `src/routes/FullRoutes.tsx:33` manda `/unleash` a `/cerebrity`,
así que `UnleashView` **se importa y no se renderiza jamás**.

> Es el octavo caso del patrón de este proyecto: *si algo parece una función y
> no responde, comprueba primero si está conectado.* Antes de tocar Synthesis,
> **asegúrate de en cuál estás**. Corregir la muerta es trabajo tirado, y peor:
> parecerá que el arreglo no ha hecho nada.

**Decisión pendiente:** retirar `UnleashView` + `views/unleash/` o fusionar lo
que valga de su interfaz. Mientras las dos existan, cualquiera se equivocará de
archivo.

### 2. 🔴 El árbol de poderes está escrito dos veces, y la buena es la lista literal

Los nueve poderes que ve el usuario están **codificados a mano** en
`src/views/CerebrityView.tsx:383-393`, como objetos con nombre, descripción,
tamaño, color e icono.

Y en paralelo existe `src/features/cerebrity/powers/` con **once módulos**:

| Módulo | ¿En el barril `powers.ts`? | ¿Lo importa alguien? |
|---|---|---|
| `creativeBooster` | sí | solo el barril y `engine.ts` |
| `flavorMapper` | sí | ídem |
| `harmonyOptimizer` | sí | ídem |
| `powerGarnishOptimizer` | sí | ídem |
| `powerStorytellingImprover` | sí | ídem |
| `rarenessIdentifier` | sí | ídem |
| `storytellingAnalyzer` | sí | ídem |
| `intensityCreative` | **no** | **nadie** |
| `techCoherence` | **no** | **nadie** |
| `engine`, `promptTemplates`, `index` | — | entre ellos |

**Fuera de esa carpeta no la importa nadie.** `CerebrityView` no toca el barril:
despacha dentro de `handlePowerClick` (`:395`) comparando **el nombre en
castellano** — `powerName === 'Mejora de Storytelling'` (`:406`).

Dos consecuencias:

- Renombrar un poder en la lista visual **rompe su ejecución en silencio**. El
  vínculo entre botón y comportamiento es una cadena de texto.
- `intensityCreative` y `techCoherence` existen como módulo **y** como entrada
  de la lista literal ("Intensidad Creativa", "Coherencia Técnica"). Habrá que
  averiguar cuál de las dos implementaciones se ejecuta hoy — y muy
  probablemente ninguna de las dos usa el módulo.

Esto es exactamente lo que `CONTEXT.md` describe en *"Una sola fuente de verdad
por propiedad"*: la misma cosa escrita en varios sitios que van divergiendo.

### 3. 🟠 Synthesis recibe recetas, pero no queda claro qué recibe de ingredientes

`CerebrityView` **sí** carga ambos (`:102-103`) y pasa `allIngredients` a
`LabView` (`:794`), mientras que a `CreativityTab` (`:792`) le pasa
`allRecipes`. En `handlePowerClick` (`:419-421`) los ingredientes que llegan al
prompt salen de `selectedRecipe.ingredientes` o de texto suelto tecleado por el
usuario — **no del catálogo de Grimorio**.

Es decir: el poder sabe *cómo se llama* el ingrediente, pero no conoce su ficha
—proveedor, precio, formato, rendimiento—. Para "analiza la creatividad" puede
bastar; para cualquier poder que quiera hablar de coste, sustituciones o
disponibilidad real, **no**.

**Esto es lo que el fundador señala como vital:** que Synthesis reciba de verdad
recetas **e ingredientes** de Grimorio. Antes de tocar prompts hay que decidir
**qué parte de la ficha entra en el contexto**: mandar el catálogo entero a la
IA es caro por tokens e innecesario.

---

## Orden de ejecución propuesto

Todo lo que sigue, salvo el último punto, **se hace sin gastar API**.

### C1 — Aclarar qué está vivo · sin coste

Decidir qué se hace con `UnleashView` / `views/unleash/`. Sin esto, cualquier
trabajo posterior corre el riesgo de caer en el archivo equivocado.

### C2 — Una sola fuente para los poderes · sin coste

Un único catálogo de poderes con **identificador estable** (no el nombre visible)
que alimente a la vez el árbol y el despacho. El nombre en castellano pasa a ser
solo etiqueta. Requisito previo de C3: sin un id estable no se puede ni tabular
qué poder hace qué.

### C3 — Auditoría poder por poder · sin coste

Para cada uno de los nueve, por lectura: **qué contexto recibe, qué prompt
construye, qué hace con la respuesta y dónde se pinta**. Salida esperada: una
tabla con una fila por poder y un veredicto — *funciona · no está conectado ·
duplicado · no aporta*.

Es el encargo textual del fundador: *"asegurarnos de que todos los poderes del
árbol cumplen una función y se ejecutan correctamente agregando valor"*. La
mitad de esa pregunta —¿está conectado?— se responde leyendo. La otra mitad
—¿aporta valor?— necesita ver una salida real, y por eso va en C5.

### C4 — Contrato de contexto Grimorio → Cerebrity · sin coste

Definir la carga que viaja a la IA: qué campos de la receta, qué campos del
ingrediente, y de dónde salen. Que sea **un solo constructor de contexto**
compartido por todos los poderes, no uno improvisado por poder dentro de
`handlePowerClick`.

Restricción heredada: los datos de coste salen de
`src/core/costing/costCalculator.ts`, fuente única. Cerebrity **no** recalcula
costes por su cuenta.

### C5 — Validación con IA real · **aquí empieza el gasto**

Solo cuando C1–C4 estén cerrados:

- Batería fija: 2–3 recetas patrón, elegidas de antemano.
- **Una pasada por poder.** Guardar cada respuesta como fixture.
- Juzgar con las salidas delante qué poderes aportan valor y cuáles sobran.

Estimación: unas **9–27 llamadas** para tener el mapa completo. Si en algún
momento se está generando más que eso para depurar, es que algo se está
depurando por ensayo y error y debería estarse leyendo.

---

## Fuera de este plan, pero necesario antes de C5

- **Desplegar el `ai-gateway`** con URL permanente y proteger sus rutas sin
  autenticar (`/api/text`, `/api/image`, `/vertex/*`) **antes** de exponerlo.
  Sin gateway no hay validación posible.
- **Rotar las claves de Gemini** — estuvieron en un repositorio público. Una
  clave expuesta la gasta otro, y la factura llega igual.

Ambos están en `CONTEXT.md` → *Pendientes fuera del trabajo de móvil*.
