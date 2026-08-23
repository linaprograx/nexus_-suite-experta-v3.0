# Plan Maestro Nexus — la capa estratégica

> **Qué es esto y qué NO es.**
>
> `PLAN-INVENTARIO-MERCADO.md` sigue siendo la fuente de verdad sobre el
> **estado del código**: los 49 puntos, su estado real y las fases de
> implementación. Este documento no lo sustituye ni lo repite.
>
> Aquí vive lo que ese plan no puede contener: **hacia dónde va Nexus**, en qué
> orden se construye y qué decisiones hay que tomar antes de abrir cada frente.
>
> Recibido del fundador el **2026-08-23**.
>
> **Ningún punto se marca implementado sin evidencia en el código.** Regla suya
> y de la casa: en esta misma sesión la tabla del plan técnico daba por
> pendientes los puntos 3, 11 y 37, que estaban hechos, y por hechas cosas que
> no lo estaban. Un plan que miente sobre el presente no sirve para decidir el
> futuro.

---

## La frase que decide

> **La meta no es el mejor software de inventario. Es un sistema operativo para
> hostelería.**

Y el criterio que se aplica a cada función nueva, antes de escribirla:

> ¿**Acerca** esto a Nexus a ser ese sistema operativo, o **añade otra
> herramienta aislada**?
>
> Si es lo segundo, se replantea antes de desarrollarse.

---

## Los cuatro niveles

| | Nivel | Qué hace | Estado |
|---|---|---|---|
| **N1** | **Motor Operativo** | Gestionar bien la información — Inventario, Mercado, Grimorio, Ingredientes, Recetas, Proveedores, Compras | Casi consolidado: quedan 9 puntos, 3 bloqueados |
| **N2** | **Motor Inteligente** | **Interpretar**, no almacenar — recomendaciones, análisis económico, anomalías, ahorro | Parcialmente diseñado. Primeros ladrillos puestos (alertas, perfil de proveedor) |
| **N3** | **Sistema Operativo** | Un solo ecosistema: usuarios, permisos, auditoría, navegación, buscador, paneles, notificaciones e IA compartidos | Conceptual |
| **N4** | **Ecosistema** | El exterior: TPV, Sheets, Drive, correo, OCR, facturas, APIs, IA externas | Planificado |

---

## Principios de desarrollo

**Fuente única de verdad.** Nunca duplicar datos. Nunca dos sistemas
equivalentes. *Este es el principio que más veces se ha roto en la historia del
proyecto y el que más caro ha salido cada vez.*

**Consistencia.** Toda decisión nueva respeta la arquitectura existente.

**Explicabilidad.** Toda recomendación dice **por qué aparece**, **qué datos
usa** y **qué consecuencias tiene**. Corolario ya en vigor: **nada de
puntuaciones sintéticas.** Un «7,4 sobre 10» invita a ordenar por un número que
nadie sabe qué mueve.

**Escalabilidad.** Diseñar para cientos de locales, no solo para el caso actual.

**Modularidad.** Cada módulo evoluciona sin romper a los demás.

### La tensión que hay que resolver, no esconder

**«Escalabilidad para cientos de locales»** choca de frente con el **punto 49
del plan técnico: «no sobreingeniería»**. Las dos reglas son buenas y no pueden
cumplirse a la vez sin una resolución explícita:

> **El modelo de datos se diseña multi-local. La interfaz, no.**
>
> Meter el local en la ruta cuesta casi nada hoy y es una migración de todo el
> histórico mañana. Construir pantallas de gestión multi-local sin un segundo
> local es fabricar código que nadie ejecuta.

Y esto **corre**: hoy todo cuelga de `users/{uid}/…`. Cada módulo nuevo que se
escriba bajo esa ruta hace el agujero más hondo. Es la decisión de arquitectura
más grande que sigue sin tomarse.

---

## Las ocho preguntas antes de implementar

1. ¿Existe ya otra función equivalente?
2. ¿Duplica información?
3. ¿Respeta la fuente única de verdad?
4. ¿Encaja con la arquitectura general?
5. ¿Se le puede explicar al usuario?
6. ¿Escala?
7. ¿Tiene sentido sin datos externos?
8. ¿Requiere otra dependencia previa?

---

## Clasificación de estados

«Hecho» y «pendiente» no bastan y ya han engañado a este proyecto. A partir de
ahora cada funcionalidad se clasifica con **una de estas**:

| Estado | Significa |
|---|---|
| `backend` | Escribe y lee, sin pantalla |
| `frontend` | Pantalla que no está conectada a nada |
| `flujo` | De extremo a extremo, pero no probado con datos reales |
| `validado` | **Ejecutado sobre el catálogo real y comprobado** |
| `experimental` | Existe, no se garantiza |
| `bloqueado` | Le falta una dependencia interna |
| `requiere-histórico` | Le faltan datos que solo da el tiempo |
| `requiere-integración` | Le falta un tercero (TPV, Google, OCR) |

**El salto de `flujo` a `validado` es el que más veces se ha dado por hecho sin
serlo.** Ejemplos vivos hoy: la exportación a Sheets está en `flujo` —falta
habilitar la API—; las incidencias están en `flujo` —falta la primera escritura
real contra Firestore—.

---

## EL ORDEN

Seis bloques. El orden no es de gusto: cada uno abre lo que el siguiente
necesita, y **dos de ellos son puertas** que no conviene cruzar antes de tiempo.

### Bloque A · Cerrar Grimorio

Lo que queda del plan técnico, en este orden y por este motivo:

1. **Punto 9 · Unidades canónicas (I1).** El único agujero de Fase 0 y el que
   más pesa: todo el motor económico se apoya en él. Informe en seco primero;
   **la migración la ejecuta el fundador**.
2. **Punto 47 · Trazabilidad de las escrituras nuevas.** `audit_log` ya existe.
   Barato ahora, y es el primer ladrillo de la observabilidad transversal (§9).
3. **Punto 29 · Recomendaciones de compra.** Ya tiene todas sus entradas.
4. **Punto 39 · Presupuesto de compras.** Requiere la marca «compra sin gasto».
5. **Punto 11 · Salud del inventario**, la mitad que no está bloqueada, y
   **decir en pantalla qué falta y por qué**.

Bloqueados y fuera de A: **4, 10, 12** (necesitan consumo real) y **13, 24,
30-33** (Fase 6).

> **Por qué A va primero:** son cinco puntos definidos y pequeños, y hasta que
> no estén, N1 no es «consolidado» sino «casi». Auditar un objetivo en
> movimiento es auditar dos veces.

### Bloque B · La gran auditoría — **PUERTA**

Punto 13 del documento del fundador, y regla suya: **antes de abrir Brand Book,
módulos nuevos, IA avanzada o expansión funcional.**

Debe responder, con evidencia en código y no con recuerdos de conversación:

- estado real de cada módulo, con la clasificación de arriba;
- qué está conectado de extremo a extremo y qué es solo interfaz;
- qué depende de Firebase, de la IA, del TPV, de datos históricos;
- deuda técnica y diferencias entre ramas;
- **modelo de datos** — y aquí es donde se decide lo multi-local;
- zonas ambiguas y dependencias externas.

Absorbe los §4 y §5 del documento del fundador: la clasificación y la auditoría
permanente son **herramientas de esta auditoría**, no trabajo aparte.

### Bloque C · Los cimientos del Sistema Operativo (N3) — **PUERTA**

Tres cosas que **cuestan diez veces más si se hacen tarde**, porque hay que
volver a pasar por todos los módulos ya escritos:

1. **Usuarios, roles y permisos** (§7). Hoy **no existen**: la app es de un solo
   usuario. Administrador, propietario, director, compras, cocina, barra,
   auditor, lectura. Cada rol ve solo lo suyo.
2. **Auditoría transversal** (§9). Quién · cuándo · qué cambió · por qué · desde
   dónde, en toda operación importante. El punto 47 del bloque A es su primer
   tramo.
3. **Un solo sistema de alertas** (§11). El centro de alertas ya existe. La
   regla es que **no se construye un segundo**: cada situación tiene un único
   sitio donde aparece, y lo persistente se resuelve con tarjetas de estado, no
   con ventanas emergentes que se cierran sin leer.

> **Por qué C va antes que cualquier módulo nuevo:** un módulo escrito sin
> permisos hay que reescribirlo cuando lleguen. Horarios, en concreto, es
> inviable sin roles — el propio documento del fundador lo dice.

### Bloque D · Ecosistema, empezando por el TPV (N4)

El **TPV (punto 13)** va primero de todas las integraciones porque **desbloquea
los puntos 4, 10 y 12** de golpe: es lo único que convierte «lo comprado» en
«lo gastado». Todo el Motor Inteligente cuelga de ahí.

Detrás: envío al proveedor (24), facturas y conciliación (30-33), OCR, y cerrar
lo de Google que quedó a medias.

### Bloque E · Motor Inteligente (N2)

Con datos que ya significan algo. Recomendaciones, análisis económico,
interpretación del inventario, explicación de anomalías, optimización de
compras, rentabilidad, sugerencias de carta, oportunidades de ahorro.

La IA como **capa transversal** (§6), no como un chat aparte: mismo contexto de
usuario y misma fuente de datos para todos los asistentes.

**Paneles inteligentes** (§10): qué necesita atención hoy, qué cambió desde
ayer, dónde hay dinero parado, qué proveedor está empeorando, qué decidir
primero.

**Sistema de conocimiento** (§8): lo que se aprende dentro de Nexus se queda en
Nexus — decisiones, incidencias, motivos, histórico, explicaciones.
**Ya tiene sus dos primeros ladrillos**, puestos el 2026-08-23: las incidencias
(punto 27) y las notas operativas (punto 28).

### Bloque F · Horarios y planificación operativa

Módulo completo, con su propio anexo (abajo). Va el último **por dependencia,
no por importancia**: necesita roles y permisos (C), auditoría (C) y
notificaciones (C), y su ubicación dentro de Nexus **no se decide hasta que la
auditoría (B) haya fijado la arquitectura**.

---

## Anexo · Sistema Inteligente de Horarios

**Estado: `planificado`.** Sin una línea de código. No es una funcionalidad del
producto hasta que se desarrolle y valide.

**El objetivo no es un calendario.** Es gestionar la operación diaria de
personas con la misma profundidad con la que Grimorio gestiona productos y
Mercado gestiona proveedores.

### Capacidades previstas

- **Cuadrantes** con asignación rápida de empleados, áreas, puestos, turnos,
  descansos, vacaciones, bajas e incidencias. Debe ser **claramente más rápido
  que una hoja de cálculo**, o no tiene sentido construirlo.
- **Plantillas reutilizables**: semanas tipo, turnos, aperturas, cierres,
  temporadas, locales.
- **Borrador → publicado.** Hasta que el responsable valida, **el empleado no
  recibe nada**. Un cuadrante a medias que llega al equipo es peor que ninguno.
- **Publicación automática** por el mecanismo que decida el diseño técnico
  —Google Calendar, calendario propio, notificaciones internas, correo—.
  *Primero el flujo, después la herramienta.*
- **Vista individual**: próximos turnos, calendario personal, cambios
  recientes, incidencias, histórico.
- **Histórico completo**: cuadrantes anteriores, modificaciones, publicaciones,
  cambios de turno, sustituciones, quién y cuándo.
- **Auditoría**: usuario, momento, valor anterior, valor nuevo, motivo.
- **Notificaciones** ante publicación, modificación, sustitución, cancelación.
- **Escalabilidad**: de un equipo pequeño a varios locales sin rediseñar.

### Las ocho cosas que se definen ANTES de escribir código

1. modelo de datos · 2. flujo completo de publicación · 3. integración con
usuarios y permisos · 4. sincronización con calendarios externos, si procede ·
5. auditoría · 6. política de notificaciones · 7. conservación del histórico ·
8. impacto sobre el resto de módulos.

### Dónde vive

**Abierto a propósito.** No se decide hasta terminar la auditoría (Bloque B).
Alternativas: módulo independiente · dentro de un módulo de operación
existente · una futura capa de gestión operativa del Sistema Operativo.

**La decisión es de arquitectura, no de navegación ni de estética.**

---

## Auditoría permanente

Preguntas a rehacer periódicamente, no una sola vez:

¿Qué módulos están **realmente** cerrados? · ¿Cuáles son solo interfaz? ·
¿Cuáles están conectados de extremo a extremo? · ¿Qué depende de Firebase, de
la IA, del TPV, de datos históricos? · ¿Qué deuda técnica hay? · ¿Qué
diferencias hay entre ramas?
