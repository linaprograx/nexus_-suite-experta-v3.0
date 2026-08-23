# Plan canónico — Inventario y Mercado

**Creado:** 2026-08-09 · **Origen:** documento de 35 puntos del fundador,
contrastado punto por punto contra el código y contra la app en producción.

Sustituye como plan de trabajo a la lista de fases de
`AUDIT-INVENTARIO-MERCADO.md`, que sigue siendo válida como **catálogo de
defectos**. Los hallazgos se citan aquí por su código (I1, M2…).

> **Este documento manda sobre el orden.** El documento del fundador está
> ordenado por temas; esto está ordenado por **dependencias**. Sus puntos 1-12
> no se ejecutan en ese orden: el 3 es de la Fase 1 y el 4 de la Fase 5.

---

## El principio, que no se toca

```
RECETAS      definen qué se consume
   ↓
INVENTARIO   sabe qué hay, qué se consume, qué falta y qué sobra
   ↓
MERCADO      sabe dónde comprarlo, a quién, en qué formato y a qué precio
   ↓
PEDIDO       consolida necesidades reales
   ↓
RECEPCIÓN    confirma qué llegó de verdad
   ↓
INVENTARIO   actualiza existencias
   ↓
MOTOR ECONÓMICO  actualiza costes
```

Y los cinco frenos, que son del fundador y se respetan: **no ERP, no
reconstruir lo que funciona, humano en el circuito antes de enviar nada, nada
de scoring opaco inventado, y primero datos fiables y después inteligencia.**

---

## Estado real de los 35 puntos

Verificado en código, no supuesto. **«Ya está»** significa que se leyó la
implementación; **«parcial»**, que existe la pieza pero no el flujo completo.

### Inventario

| # | Punto | Estado | Fase |
|---|---|---|---|
| 1 | Jerarquía visual plegable | falta | 2 |
| 2 | Regla de stock al primer ingreso real | **ya está** — `checkAndCreateRule` se llama en las **tres** rutas: compra directa (`GrimoriumView.tsx:1139`), compra múltiple (`:429`) y recepción de pedido (`:497`) | — |
| 3 | Stock **máximo** / sobrestock | falta — `useStockRules` es solo «min stock + reorder qty» | **1** |
| 4 | Motor de inteligencia de consumo | falta, y **bloqueado**: no hay consumo real | 5 |
| 5 | Centro de alertas inteligentes | parcial — existen alertas de stock y `computeGrimorioAlerts` con bandeja global | 4 |
| 6 | Priorización / score | falta | 4 |
| 7 | Inventario físico por zonas | parcial — el conteo existe y no sobrescribe (genera ajuste con signo); **las zonas, no** | 4 |
| 8 | Historial por producto | parcial — existen `purchases`, `stock_movements` y `audit_log`; falta la vista que los une | 4 |
| 9 | Unidades y conversiones | **roto** — ver **I1** | **0** |
| 10 | Clasificación ABC | falta, bloqueado por el 4 | 5 |
| 11 | Salud del inventario | parcial y con cifras falsas — ver **I3**, **I4** | 0 y 5 |
| 12 | Motor de causa raíz | falta, bloqueado | 5 |
| 13 | Integración TPV | falta — el gancho es `StockMovement` | 6 (preparar en **0**) |

### Mercado

| # | Punto | Estado | Fase |
|---|---|---|---|
| 14-15 | Mercado como fuente de verdad, sin ERP | parcial | transversal |
| 16 | Base de datos de proveedores | **hecho** (2026-08-16) — plazo, días de reparto y condiciones de pago se ven en el desplegable de opciones, donde se decide | ✅ |
| 17 | **Producto maestro ↔ Oferta** | **hecho** (2026-08-16) — `core/ofertas/oferta.ts`: una oferta es proveedor + formato + precio, clave `prov::700ml`, las antiguas se siguen leyendo | ✅ |
| 18 | Agrupación visual | falta | 2 |
| 19 | Proveedor preferente y alternativos | **hecho** (2026-08-16) — se elige con la estrella del desplegable «N opc.»; las cuatro lecturas del `ing.proveedor` obsoleto, unificadas | ✅ |
| 20 | Catálogos dentro de Mercado | **hecho** (2026-08-16) — el filtro por proveedor mira las tres vías (`supplierData`, `proveedores[]`, preferente) | ✅ |
| 21 | Flujo necesidad → pedido | **ya está** | — |
| 22 | Consolidación por proveedor | **ya está** — agrupa por `ing.proveedor` y crea una hoja por proveedor | — |
| 23 | Control humano antes del envío | **ya está** — borrador → enviar es explícito | — |
| 24 | Envío directo al proveedor | falta | 6 |
| 25 | Ciclo del pedido | **ya está** con menos estados: `draft → sent → completed/cancelled` | ampliar en 6 |
| 26 | Inteligencia de proveedores | falta — existe `evaluateMarketSignals` solo para precio | 5 |
| 27 | Incidencias | falta | 5 |
| 28 | Conocimiento operativo (cualitativo) | falta | 5 |
| 29 | Recomendaciones de compra | parcial — señales de mercado | 5 |

### Facturas y negocio

| # | Punto | Estado | Fase |
|---|---|---|---|
| 30-33 | Facturas y conciliación | falta | 6 |
| 34 | Analítica de compras | **escalón barato hecho** (2026-08-16) — gasto por proveedor, por mes y concentración, en el panel de Precios. Falta el presupuesto (punto 39) | parcial |
### Configuración de Negocio y arquitectura (Partes IV y V, recibidas 2026-08-09)

| # | Punto | Estado | Fase |
|---|---|---|---|
| 35 | Qué vive en Negocio | parcial — `users/{uid}/settings/costes` ya guarda IVA, merma, coste laboral, estructura, comisiones y objetivo de coste | ampliar en 3-6 |
| 36 | Qué **no** vive en Negocio | correcto y hoy se cumple: no hay proveedor ni precio global en ajustes | — |
| 37 | Preferente por producto, no global | falta — parte del punto 17 | 3 |
| 38 | Regla global + override específico | **el patrón YA EXISTE y tiene nombre**: `AJUSTES_COSTE_POR_DEFECTO` → `recipe.costingOverrides`, resuelto en `profitabilityEngine.ts:84`. **Reutilizarlo, no inventar un segundo mecanismo** | — |
| 39 | Presupuesto de compras | falta | 4 |
| 40 | Configuración de facturas en Negocio, entidades en Mercado | falta | 6 |
| 41 | Las cuatro preguntas antes de añadir un campo | **regla adoptada** | — |
| 42 | Una fuente de verdad por dato | vigente | — |
| 43 | Recetas no se reabre | vigente — **ver el aviso de abajo** | — |
| 44 | Motor económico existente | vigente | — |
| 45 | Agrupación visual ≠ entidad nueva | vigente | — |
| 46 | Humano en el circuito | vigente; ya se cumple en el pedido | — |
| 47 | Trazabilidad | parcial — **`users/{uid}/audit_log` ya existe** con `logActionExecution` y su visor `AuditLogModal`. Reutilizar | 4 |
| 48 | Integraciones desacopladas | vigente | 6 |
| 49 | No sobreingeniería | vigente | — |

#### Aviso sobre el punto 43 — «Recetas no se reabre»

**I1 no reabre Recetas como código, pero mueve los números que Recetas
muestra.** Normalizar unidades cambia el coste de los ingredientes, y por tanto
el escandallo, el margen y el nivel de cada receta afectada.

No es una excepción a la regla: es exactamente el caso que la regla pide
explicar antes. Por eso el informe en seco de I1 incluye **recetas y
sub-recetas afectadas con su impacto económico**, y por eso lo aprueba el
fundador antes de que se escriba nada.

#### Dependencia nueva detectada — el presupuesto (39) y el pedido ficticio

El presupuesto necesita saber **qué es gasto de verdad**. Y en
`PLAN-GRIMORIO-MERCADO.md` está previsto el **pedido ficticio mensual**, que
crea inventario **sin gasto**.

Si el pedido ficticio no queda marcado como tal, el presupuesto miente desde el
primer mes: mostraría como consumido un dinero que nunca salió. **La marca de
«compra sin gasto» es requisito del punto 39**, no un detalle del pedido
ficticio.

Además, «gasto comprometido en pedidos abiertos» exige **M1** (que el pedido
tenga precio) y **M2** (que sepa de quién es). Sin las dos, el presupuesto solo
puede enseñar gasto pasado.

#### Idea del fundador — avisos de configuración incompleta en Mercado

Cuando lleguen presupuesto y envío por correo, alguien que abre la app por
primera vez no sabrá que hay que configurarlos ni dónde. Propuesta: un aviso en
Mercado que lleve directo a Personal → Negocio.

**Reserva importante:** esto es la misma familia que la **guía de primer uso**
(E5 de `PLAN-GRIMORIO-MERCADO.md`). **No se construyen dos sistemas de avisos.**

Recomendación a validar:

- La **guía de primer uso** se ocupa del primer contacto, una sola vez.
- La **configuración incompleta** no es un evento de primer uso: es un **estado**
  que puede durar meses. Por eso conviene mejor una **tarjeta discreta y
  descartable** dentro de Mercado —«Sin presupuesto configurado», «Sin correo
  de proveedor»— que una ventana emergente que interrumpe. Una emergente se
  cierra sin leer la primera vez y ya no vuelve; un estado visible se resuelve
  cuando el usuario tiene tiempo.
- En ambos casos, **enlace profundo** a la sección exacta de ajustes, no a
  «Personal» a secas.
- La lista de qué falta se **deriva** de lo que las funciones necesitan; nada de
  una lista escrita a mano que se quede vieja.

---

## Las tres cosas que pueden hundir esto

### 1. Media docena de puntos no tienen datos con los que existir

Los puntos **4, 10, 11, 12 y 26** se alimentan todos de lo mismo: **consumo
real a lo largo del tiempo**. Hoy no existe. El único consumo registrado sale
de movimientos manuales y del «he producido N» de la ficha; no hay TPV.

Sin eso, «rotación alta / baja / nula» no se puede calcular: solo se sabría lo
comprado, nunca lo gastado. El propio documento lo dice en el punto 12 —aquí
solo se hace explícita la consecuencia: **son consecuencia, no fase inicial.**

**El movimiento barato que los desbloquea todos:** añadir **`origen`** a cada
movimiento de stock (venta · merma · invitación · ajuste · conteo · recepción ·
producción). `StockMovement` ya tiene `type`; ampliarlo hoy cuesta casi nada y
es el cimiento del 13 (TPV) y del 12 (causa raíz). **Hacerlo en la Fase 0**,
aunque nada lo use todavía: retrofitarlo sobre miles de movimientos ya escritos
es otro trabajo entero.

### 2. El punto 17 es el que puede romper la app

El modelo **Producto maestro ↔ Oferta** es la mejor decisión del documento, y a
la vez la más peligrosa que se ha propuesto en este proyecto.

Hoy las **1.367 referencias son 1.367 documentos de ingrediente distintos**, que
solo colapsan **en la vista** a 279 productos, agrupados por nombre. Separar
maestro de oferta significa **fusionar documentos**. Y de esos `ingredientId`
cuelgan:

- las líneas de las recetas,
- todo el historial de `purchases`,
- los `stock_movements`,
- las reglas de stock,
- los snapshots de la carta activa.

Fusionar mal es recetas que pierden ingredientes y escandallos a cero.

**Condiciones innegociables:**

1. Después de **I1** (unidades canónicas). Nunca antes.
2. **Informe en seco** completo antes de escribir un solo documento.
3. **Tabla de correspondencia de ids que se conserva para siempre.**
4. **No se borra** el documento absorbido: se marca como alias del maestro.
5. La migración **la ejecuta el fundador**, nunca el agente.

### 3. Una contradicción resuelta

El punto 18 pide **Inventario por familias** y **Mercado por proveedores**. El
2026-08-08 se había pedido agrupación **por proveedor en ambas**, y así se
escribió en `PLAN-GRIMORIO-MERCADO.md`.

**Manda el punto 18**, porque el criterio es de uso: Inventario se consulta con
«¿tengo ginebra?» y Mercado con «¿a quién se lo pido?».

**Resolución:** Inventario agrupa **por familia** por defecto, con conmutador a
proveedor; Mercado, **por proveedor**. Mismo componente de secciones plegables
en los dos sitios. La sección «Sin asignar» siempre visible: es la lista de
limpieza.

Y la regla del propio documento, que es correcta y hay que respetar: **la
jerarquía es presentación**. La búsqueda debe seguir encontrando cualquier
ingrediente con su grupo cerrado — al buscar, se abren solas las secciones con
resultados.

---

## Fases

### Fase 0 — Cimientos · *nada nuevo, todo reparación*

Sin esto, cada función nueva hereda el error.

1. **I1 · Unidades canónicas** (punto 9). Normalizar en la entrada con
   `packNormalization`; cantidad canónica + unidad de presentación.

   **Nada se escribe hasta que el fundador apruebe el informe en seco**, que
   debe traer, por ítem: unidad actual · unidad propuesta · factor · stock
   afectado · coste actual · coste resultante · recetas afectadas ·
   sub-recetas afectadas · impacto económico · ambigüedades.

   Los ingredientes cuya conversión no pueda determinarse **con certeza** se
   marcan `BLOQUEADO PARA REVISIÓN`. **No se infiere ningún valor.** Un
   `10813.000 L` no se «interpreta»: se bloquea.

2. **`origen` en `StockMovement`** ✅ **HECHO 2026-08-09**. Campo opcional
   `StockMovementOrigin` (manual · produccion · conteo · recepcion · venta ·
   invitacion · importacion), ortogonal a `type`. Escrito ya por las tres rutas
   vivas: mini-diálogo manual, producción de receta y conteo físico. Los
   documentos anteriores no lo llevan y se tratan como desconocido. Prepara los
   puntos 12 y 13.
3. **I4 · Un solo valor de almacén.**
4. **I3 · Arreglar o retirar la variación mensual.**
5. **I2 · Semáforo desde `useStockRules`.**

### Fase 1 — Que el pedido sirva para pedir

6. **M2 · `providerId` persistido** en el pedido, y leído al recibir en vez de
   volver a deducirlo. **Bloquea la agrupación de Inventario por proveedor.**
7. **M1 · Precio en el pedido** (comprobación de un producto primero).
8. **M3 · Cantidad sugerida** desde regla de stock y formato de compra.
9. **Punto 3 · Stock máximo y sobrestock.** Barato, no depende de nada, y
   alimenta las alertas. Con override manual: nada de bloqueos absurdos.

### Fase 2 — Navegación

10. **Secciones plegables** (puntos 1 y 18) con la resolución de arriba. Cierra
    **I5** y buena parte de **A4** de `AUDIT-MOVIL.md`.
11. **M5, M6, T1** y el repaso de la hoja de pedido.

### Fase 3 — Modelo canónico · *aquí se juega el proyecto*

12. **Punto 17**, con las cinco condiciones. Detrás vienen el 16, el 19 y el 20,
    que sin el modelo no se sostienen.

### Fase 4 — Alertas, ya con datos que significan algo

13. Puntos **5** y **6**: centro de alertas con qué pasa, por qué importa, qué
    impacto tiene y qué se puede hacer — con acciones **dependientes de la
    causa**, no un menú genérico.
14. Puntos **7** (zonas) y **8** (historial unificado).
15. Escalón barato del **34**: gasto por proveedor y por mes desde las compras.

### Fase 5 — Inteligencia · *cuando haya histórico*

16. Puntos **4, 10, 11, 12, 26, 27, 28, 29**.

### Fase 6 — El mundo exterior

17. Punto **24** (envío; empezar por correo), **30-33** (facturas y
    conciliación), **13** (TPV), ampliación del ciclo del **25**.

---

## Riesgos de regresión

| Riesgo | Dónde | Mitigación |
|---|---|---|
| **Fusionar ingredientes rompe recetas** | Punto 17 | Las cinco condiciones. Es el riesgo mayor del proyecto |
| **Migrar unidades cambia costes de todas las recetas** | I1 | Informe en seco con el antes/después por ítem, revisado antes de escribir |
| **Agrupar Inventario por un proveedor mal deducido** | Puntos 1/18 | M2 va antes |
| **Plegar mata la búsqueda** | Punto 1 | La búsqueda atraviesa secciones y las abre |
| **Sobrestock bloquea compras legítimas** | Punto 3 | Solo frena la *recomendación automática*, nunca la acción manual |
| **Una factura reescribe costes maestros** | Punto 33 | La factura enriquece `purchases`; el coste sigue saliendo de `costCalculator` |
| **El TPV mal configurado destruye el inventario** | Punto 13 | `origen` en cada movimiento + el conteo físico como contraste. Las diferencias son información, no se ajustan en silencio |

---

## Reglas que no se rompen

- **`src/core/costing/costCalculator.ts`** es la única fuente de coste y
  **`profitabilityEngine.ts`** la única de rentabilidad. Nada de fórmulas
  paralelas — el bloque de Recetas acaba de cerrarse precisamente por eso:
  Escandallo = Ficha = Análisis = Lista.
- **`packNormalization.ts`** es la única fuente de unidades y formatos.
- **Datos reales.** Ninguna acción destructiva para verificar. Migraciones con
  informe previo y ejecutadas por el fundador.
- **Despliegue a las dos ramas** y verificación leyendo el bundle servido.
