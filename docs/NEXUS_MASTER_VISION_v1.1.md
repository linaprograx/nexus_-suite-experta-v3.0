# NEXUS MASTER VISION v1.1

**Estado:** fuente canónica de la visión del fundador, consolidada con la auditoría técnica del 2026-08-06.  
**Propósito:** fijar la dirección de producto sin confundir la visión máxima con capacidades ya verificadas en el código.

## Convenciones de estado

- **Confirmada:** decisión explícita del fundador que orienta el producto.
- **Actual:** presente en el código; puede requerir validación real de uso, datos o despliegue.
- **En desarrollo:** hay base técnica o plan aprobado, pero no una capacidad completa y validada.
- **Futura:** dirección confirmada, sin implementación completa actual.
- **Por validar:** hipótesis estratégica o comercial que requiere investigación de mercado, piloto o decisión posterior.

## 1. Definición central

Nexus es un **sistema de operaciones creativas para hostelería**. Conecta el conocimiento y la creación profesional con la compra, el inventario, el coste, la venta, la formación, la colaboración y la inteligencia para convertir la creatividad en una operación rentable, trazable y evolutiva.

No es un recetario, una aplicación aislada de inventario ni un ERP tradicional con una capa visual.

## 2. Propósito, misión y visión

**Propósito.** Resolver la fragmentación que hoy separa creatividad, compras, proveedores, costes, producción, inventario, ventas, formación y dirección en un establecimiento.

**Misión.** Dar a profesionales y establecimientos un entorno único desde el que crear, operar, aprender, colaborar y decidir con información conectada.

**Visión.** Ser la infraestructura creativa y operacional de referencia para bares y equipos de coctelería, ampliable de forma progresiva al resto de la hostelería.

La transformación objetivo es:

`proveedor → compra → inventario → creación → receta → escandallo → venta → consumo → reposición → análisis → optimización`

La persona profesional conserva el criterio final; Nexus aporta memoria, estructura, precisión y capacidad de mejora.

## 3. Problemas que resuelve

- Costes, compras, recetas y consumo desconectados.
- Inventario y desperdicio sin trazabilidad operativa suficiente.
- Decisiones de compra y precio basadas en información incompleta.
- Conocimiento profesional que se pierde al cambiar el equipo.
- Formación separada de la práctica real.
- Dirección que recibe información tardía y poco accionable.

## 4. Usuarios y estructura organizativa

### Segmento inicial — confirmada

Profesionales de barra, equipos de coctelería y bares independientes, con Madrid como foco inicial de validación. Nexus también puede aportar valor al profesional individual.

### Evolución — futura confirmada

Restaurantes, cocinas, repostería, hoteles, grupos hosteleros y academias.

### Jerarquía objetivo — futura confirmada

`organización o grupo → establecimiento → departamento → equipo → usuario`

Roles previstos: propietario, director, administrador, responsable de departamento, profesional, colaborador y consulta. Los permisos deben depender de responsabilidad, ámbito y módulos autorizados.

## 5. Ecosistema funcional consolidado

| Módulo | Papel en la visión | Estado técnico consolidado |
|---|---|---|
| Dashboard | Situación, alertas, acciones y lectura ejecutiva | **Actual**, con métricas y paneles; inteligencia ejecutiva avanzada por validar/desarrollar. |
| Grimorium | Núcleo creativo, financiero y operativo: recetas, ingredientes, compras, stock y Mercado | **Actual/en desarrollo**. Recetas, ingredientes, compras manuales, stock y coste existen; catálogo de proveedores, pedidos, facturas y colaboración requieren entregas específicas. |
| Mercado | Catálogo común, referencias, precio, comparación y compra | **En desarrollo**. La interfaz consume un catálogo maestro, pero hoy sus datos son por usuario, no un Mercado global de Nexus. |
| Escandallator | Coste, margen, rendimiento, merma, lotes y simulación | **Actual parcial**. Existen cálculos y vistas de escandallo, stock y lotes; la comparación real/teórica y las simulaciones completas necesitan validación funcional. |
| Pizarrón | Ideación visual, referencias, desarrollo y colaboración | **Actual**. Canvas persistido, plantillas e integración de coste; experiencia móvil mejorada. Colaboración de equipo a escala queda por desarrollar/validar. |
| CerebrIty | Inteligencia creativa, laboratorio, tendencias y asistencia | **Actual parcial**. Hay interfaz, motores y gateway de IA; la disponibilidad depende del gateway y algunas rutas heredadas siguen desactivadas. |
| Make Menu / The Critic | Construcción y crítica profesional de cartas | **Actual parcial/en desarrollo**. Existen superficies y servicios, pero parte de la IA heredada no opera sin sustitución por gateway. |
| Trend Locator | Interpretar tendencias por relevancia y aplicabilidad | **Actual parcial/en desarrollo**. Existe superficie de producto; requiere fuente y flujo de inteligencia validados. |
| Colegium | Formación, práctica, evaluación y progreso | **Actual parcial**. Hay quizzes, progreso y perfil; su unión operativa con trabajo real debe validarse y evolucionar. |
| Avatar / Champion Mode | Identidad, carrera, personalización y preparación competitiva | **Actual parcial**. Perfil y flujos de competición existen; la inteligencia personalizada integral es evolución futura. |

## 6. Flujos que deben gobernar el producto

1. **Creación a rentabilidad:** idea en Pizarrón o CerebrIty → receta en Grimorium → escandallo → decisión profesional → carta/operación.
2. **Compra a stock:** referencia de Mercado → pedido aprobado → recepción → compra y precio real → inventario → coste medio e historial.
3. **Venta a reposición:** venta identificada por TPV → receta → consumo de ingredientes → stock y margen actualizados → regla de reposición o señal.
4. **Trabajo a aprendizaje:** receta, error, proyecto u oportunidad → contenido/práctica en Colegium → progreso visible en Avatar.
5. **Operación a decisión:** compras, stock, coste, venta y actividad → Dashboard → alerta explicable → recomendación → decisión humana.

Los flujos 1 tienen base actual. Los flujos 2–5 están parcialmente presentes en datos internos, pero requieren completar contratos, integraciones y validación real antes de afirmarlos como automatizados de extremo a extremo.

## 7. Inteligencia artificial y agentes

### Principios confirmados

- La IA es una capa transversal, no un adorno aislado.
- Debe hablar el lenguaje de la hostelería y usar contexto profesional relevante.
- Recomienda, explica y registra; no sustituye el criterio profesional.
- Toda acción económica o externa requiere confirmación explícita.
- Recetas e inventario no se modifican autónomamente sin una operación verificable y trazable.

### Capacidades previstas

Orientación inicial, análisis creativo, recomendaciones de compra, alertas de desperdicio o desviación, sugerencias de precio, resúmenes, informes y mejoras de receta.

### Estado técnico

Existe un gateway de Vertex AI y clientes de texto, búsqueda, multimodal e imagen, pero no está desplegado como servicio permanente y sus rutas necesitan protección antes de exponerse. Por tanto, la IA es **actual parcial**, no una promesa operativa universal todavía.

## 8. Experiencia e identidad narrativa

Nexus combina dos fuerzas inseparables:

- **Magia creativa:** inspiración, descubrimiento, progresión, personalidad y un universo profesional vivo.
- **Precisión operativa:** datos fiables, trazabilidad, jerarquía, alertas comprensibles y acciones concretas.

El escritorio es el espacio de control, análisis y relaciones complejas. El móvil es la herramienta inmediata y contextual para la operación diaria. Son una sola experiencia y deben compartir los mismos datos y reglas.

## 9. Modelo de acceso y negocio conceptual

Cuatro niveles de acceso confirmados conceptualmente: **FREE**, **PRO**, **EXPERT** y **STUDIO**. La infraestructura creativa esencial no se bloquea por plan; la diferencia está en capacidad, escala, colaboración, automatización, profundidad analítica, integraciones, personalización y soporte.

Vías previstas: suscripciones individuales y de equipo, planes para establecimientos, soluciones adaptadas para grupos, formación, servicios e integraciones avanzadas.

La implementación de Stripe existe, pero faltan credenciales, despliegue seguro y validación real. No debe considerarse un sistema de monetización listo para producción.

## 10. Ambición temporal

### Horizonte de tres años — dirección confirmada

Validar el sistema con bares independientes y equipos de coctelería; conectar la operación real de recetas, coste, inventario y compras; consolidar equipos y establecimientos en España; preparar TPV, proveedores y una inteligencia transversal fiable.

### Horizonte de cinco años — dirección confirmada

Expandir a organizaciones multiestablecimiento, hoteles, restaurantes y academias; entrar progresivamente en mercados internacionales estratégicos; convertir Nexus en la plataforma profesional de referencia sin perder la especificidad de la hostelería.

Madrid, España, la península ibérica, Estados Unidos y Dubái son horizontes estratégicos, no compromisos de calendario o cuota.

## 11. Contradicciones reales entre visión y código

| Visión o afirmación previa | Evidencia técnica | Consolidación v1.1 |
|---|---|---|
| Mercado común y centralizado, administrado por Nexus y accesible a todos | `useIngredients` lee `artifacts/{appId}/users/{uid}/grimorio-ingredients`: el catálogo está aislado por usuario. | **Futura/en desarrollo.** No describirlo como capacidad actual global. |
| Compra desde Nexus y entrada automática al inventario | El plan técnico solo contempla pedidos, recepción y envío externo como E3 futura; hoy hay registros de compra, no un flujo probado de pedido a proveedor. | **Actual parcial.** La compra registrada alimenta stock; el pedido externo y la recepción conectada no están completados. |
| Organización → establecimiento → departamento → equipo → usuario con roles | Las rutas documentadas se centran en `users/{uid}` y no hay un modelo organizativo operativo descrito en la auditoría. | **Futura confirmada.** No declarar multiestablecimiento ni permisos jerárquicos como actuales. |
| IA y agentes integrados transversalmente | Hay gateway y componentes, pero el gateway no está desplegado de forma permanente; algunos flujos invocan utilidades Gemini heredadas desactivadas. | **Actual parcial/en desarrollo.** No prometer asistencia disponible en todos los módulos. |
| Stripe y suscripciones como funcionalidad operativa | Checkout, portal y webhooks existen, pero faltan credenciales y despliegue seguro; su activación es posterior a la rotación de claves. | **Implementación técnica pendiente de validación**, no monetización lista. |
| Consumo automático por venta | La visión declara lógica interna existente, pero no hay integración TPV externa; el flujo venta→consumo no está validado como operación completa. | **Futura confirmada con base interna parcial.** |

No se han identificado contradicciones entre la ambición creativa-operativa de Nexus y la arquitectura actual: la diferencia principal es de madurez, alcance y datos compartidos, no de dirección.

## 12. Capacidades por horizonte

### Actuales, observables en el repositorio

- Gestión de recetas, ingredientes y compras registradas por usuario.
- Cálculo de costes, escandallos, lotes, reglas y movimientos de stock.
- Mercado/interfaz de catálogo, aún no global.
- Dashboard y señales operativas basadas en datos disponibles.
- Pizarrón persistido, plantillas, integración de coste y experiencia móvil adaptada.
- CerebrIty, Colegium, Avatar, Champion Mode, Make Menu y Trend Locator como superficies y capacidades parciales.
- Gateway de IA y base de Stripe implementados, sin operación de producción confirmada.

### En desarrollo

- Fiabilidad móvil de Recetas, Inventario y Mercado con validación en sesión real.
- Contrato entre catálogo, compra y stock físico.
- Catálogos de proveedor, taxonomía, precios fechados y normalización auditable.
- Pedido por proveedor, recepción, facturas y conciliación.
- Recetas compartidas con permisos, origen, versiones e ingredientes faltantes.
- Guía interna de Grimorium y mejoras de ergonomía móvil.
- Despliegue seguro de gateway de IA y preparación segura de Stripe.

### Futuras confirmadas

- Mercado global administrado por Nexus y conexión directa con proveedores.
- Integraciones TPV que activen consumo, costes, márgenes y reposición.
- Organización jerárquica, permisos, equipos y multiestablecimiento.
- Agentes supervisados y automatizaciones con registro y aprobación.
- Expansión a otras disciplinas hosteleras e internacionalización progresiva.

## 13. Decisiones confirmadas

- El primer foco es bares y coctelería.
- Grimorium es el núcleo creativo, financiero y operativo.
- La creatividad y la operación deben permanecer conectadas.
- Las compras deben alimentar inventario y las recetas deben relacionarse con coste y consumo.
- Mercado debe evolucionar a catálogo centralizado.
- TPV y proveedores son integraciones estratégicas futuras.
- La IA propone y explica; la persona profesional decide.
- Las acciones externas o económicas requieren autorización y trazabilidad.
- Nexus tendrá estructura organizativa y permisos por rol.
- El núcleo creativo esencial no se bloquea por plan.
- Móvil y escritorio son el mismo producto con roles de uso distintos.

## 14. Decisiones que necesitan validación de mercado

- Disposición a pagar y estructura final de precios por segmento.
- Nombres comerciales y límites exactos de FREE, PRO, EXPERT y STUDIO.
- Valor real de un Mercado global frente a catálogos privados o híbridos.
- Prioridad de proveedores y viabilidad de sus formatos, permisos y acuerdos de datos.
- Prioridad y viabilidad de integraciones TPV por mercado.
- Qué automatizaciones generan confianza y cuáles se perciben como intrusivas.
- Valor económico demostrable de reducir pérdidas, desperdicio y desviaciones.
- Segmento de entrada más receptivo: profesional individual, equipo o establecimiento.
- Orden de expansión geográfica y vertical fuera de bares y coctelería.
- Qué capacidades de formación, colaboración e IA justifican uso recurrente y pago.

## 15. Preguntas abiertas de producto

- Política de propiedad, visibilidad y borrado de catálogo global y referencias de proveedor.
- Modelo de precios: observaciones históricas inmutables, vigente calculado y fuente de verdad.
- Taxonomía de ingredientes y atributos obligatorios.
- Permisos detallados, propiedad de recetas compartidas y trazabilidad entre organizaciones.
- Retención de facturas, OCR, privacidad y conciliación.
- Nivel de autonomía configurable por agente y rol.
- Métricas oficiales de ahorro, eficiencia y rentabilidad.

## 16. Elementos descartados o expresamente fuera del núcleo

- Convertir Nexus en un ERP genérico.
- Ser el sistema principal de turnos, RR. HH., reservas o marketing.
- Bloquear el núcleo creativo para forzar conversión de pago.
- Sustituir decisiones profesionales sensibles con IA.
- Ejecutar operaciones externas sin confirmación, explicación y rastro.

## 17. Diferencia entre estado actual y visión futura

El producto ya contiene los módulos que expresan la visión y varias conexiones internas entre creatividad, receta, coste, inventario y aprendizaje. La visión máxima requiere convertir esas piezas en un sistema compartido, fiable y operativo de extremo a extremo: datos globales cuando correspondan, organización y permisos, integraciones verificadas, automatizaciones gobernadas y una capa de inteligencia segura.

La regla de interpretación es: **la visión fija la dirección; la auditoría técnica fija el grado de madurez de cada afirmación.**

## Fuentes de consolidación

- Visión del fundador: `NEXUS MASTER VISION v1.0` (2026-08-06).
- Auditoría y estado técnico: `docs/agents/CONTEXT.md`, `docs/agents/ROADMAP.md`, `docs/agents/PLAN-GRIMORIO-MERCADO.md`, `docs/agents/AUDIT-PIZARRON.md` y código consultado el 2026-08-06.
