# SMOKE TESTS - Nexus Suite

Este documento define los flujos mínimos de prueba (Smoke Tests) que deben ejecutarse manualmente tras cualquier cambio significativo en el código para asegurar la estabilidad básica de la aplicación.

## 1. Dashboard (`/`)
- [ ] **Carga Inicial**: Abrir la ruta raíz. Verificar que cargan el header, sidebar y panel principal.
- [ ] **KPIs**: Verificar que se muestran las tarjetas de métricas (ingresos, costos, etc.) sin valores NaN/Error.
- [ ] **Gráficos**: Confirmar que los gráficos de actividad reciente renderizan visualmente (aunque sean datos falsos).
- [ ] **Navegación**: Hacer clic en un KPI (ej. "Total Recetas") y verificar que redirige a la sección correspondiente (ej. Grimorium).

## 2. Grimorium (`/grimorium`)
- [ ] **Carga General**: Verificar que carga la vista principal con la lista de recetas.
- [ ] **Recetas**:
    - [ ] Buscar una receta en el buscador.
    - [ ] Abrir el detalle de una receta existente.
- [ ] **Pestañas**: Navegar por todas las pestañas superiores:
    - [ ] Ingedientes
    - [ ] Escandallo
    - [ ] Batcher
    - [ ] Stock
    - [ ] Zero Waste
- [ ] **Funcionalidad Batcher**:
    - [ ] Seleccionar una receta.
    - [ ] Ingresar una cantidad objetivo.
    - [ ] Pulsar "Calcular" y ver que aparecen filas de resultados.

## 3. Pizarrón (`/pizarron`)
- [ ] **Tablero**: Verificar que se ven las columnas (Kanban).
- [ ] **Tareas**: Confirmar que las tarjetas de tarea son visibles.
- [ ] **Interacción**: Intentar un drag & drop simple de una tarea a otra columna.
- [ ] **Creación**: Abrir modal de "Nueva Tarea" (si existe botón) y cerrarlo.

## 4. Avatar (`/avatar`)
- [ ] **Carga General**: Verificar que carga el layout específico del Avatar.
- [ ] **Sub-secciones**: Probar navegación interna:
    - [ ] **Avatar Insights**: Ver métricas/gráficos del usuario.
    - [ ] **Digital Bar**: Verificar que carga la escena o dashboard del bar digital.
    - [ ] **Champion Mode**: Verificar que carga las 3 columnas o la vista de competición sin error crítico.

## 5. Colegium (`/colegium`)
- [ ] **Renderizado**: Verificar que la vista carga y muestra contenido (cursos o lecciones).

---

## Checklist Rápido de Validación (Post-Build)
Antes de dar por buena una versión (`npm run build`), verificar:
1.  [ ] No hay errores en rojo en la consola del navegador al navegar por las 5 secciones.
2.  [ ] No hay pantallas en blanco (White Screen of Death).
3.  [ ] El layout principal (Sidebar + Topbar) no se rompe ni parpadea excesivamente.
4.  [ ] Los textos principales están en español y legibles.
5.  [ ] El build de producción termina con "Success".
