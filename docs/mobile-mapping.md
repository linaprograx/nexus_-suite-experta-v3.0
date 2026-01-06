# Nexus Mobile Mapping — Product UI

## 1. Reglas Generales
- **No perder funcionalidades**: Todo lo que se hace en Desktop debe poder hacerse en Mobile, aunque el flujo sea diferente.
- **Jerarquía por intención**: En mobile, las acciones principales deben estar a mano (thumb zone).
- **Lectura fácil**: Textos más grandes, menos densidad de información por pantalla.

## 2. Inventario Funcional & Mapping

| Módulo | Función | Criticidad | Equivalente Mobile | Estado |
| :--- | :--- | :--- | :--- | :--- |
| **Shell** | Sidebar de Navegación | Alta | Bottom Tab Bar + Drawer para secundarios | ⏳ Pendiente |
| **Grimorium** | Lista de Recetas | Alta | Lista vertical con filtros colapsables | ⏳ Pendiente |
| **Grimorium** | Editor de Receta (Canvas) | Alta | Vista detallada por pasos (Wizard) o Stack vertical | ⏳ Pendiente |
| **Pizarrón** | Canvas Infinito | Media | Ver modo lista o Canvas pan/zoom simplificado | ⏳ Pendiente |
| **Stock** | Tabla de Ingredientes | Alta | Lista de tarjetas con acciones swipe o modal | ⏳ Pendiente |
| **Compras** | Generar Pedido | Alta | Flow de checkout simplificado (Carrito) | ⏳ Pendiente |

## 3. Checklist de Validación Mobile
- [ ] Navegación fluida entre secciones principales
- [ ] Textos legibles sin zoom (min 16px para body)
- [ ] Áreas táctiles de al menos 44x44pt
- [ ] Feedback visual inmediato al tocar (Active states)
- [ ] Carga rápida de vistas (Lazy loading)
