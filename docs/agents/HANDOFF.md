# Estado del relevo

> Este archivo se reescribe entero al cierre de cada sesión. El historial
> acumulado vive en `docs/agents/WORKLOG.md`.

---

**Última actualización:** 2026-08-10
**Estado:** rama de desarrollo limpia antes del cambio de identidad visual;
TypeScript y build correctos en el último cambio funcional; despliegues siempre
en `feat/mobile-v1-unified` y `deploy/mobile-v1`.

## Dónde se trabaja

| | |
|---|---|
| Worktree | `/Users/lianalviz/nexus-suite-mobile-v1` |
| Desarrollo | `feat/mobile-v1-unified` |
| Producción | `deploy/mobile-v1` |
| Producción URL | `https://nexus-suite-experta-v3-0.vercel.app` |

### Despliegue obligatorio

```bash
git push origin feat/mobile-v1-unified
git checkout deploy/mobile-v1
git merge --ff-only feat/mobile-v1-unified
git push origin deploy/mobile-v1
git checkout feat/mobile-v1-unified
```

Después, verificar el bundle servido. Volcarlo a fichero y usar marcadores
ASCII:

```bash
curl -s "https://nexus-suite-experta-v3-0.vercel.app/$(curl -s https://nexus-suite-experta-v3-0.vercel.app/ | grep -o 'assets/index-[^\"]*\.js' | head -1)" -o /tmp/prod.js
grep -c -F 'MARCADOR_ASCII' /tmp/prod.js
```

## Reglas de seguridad activas

- Los datos son reales (~1.327 ítems y ~1.367 referencias). No borrar ni
  ajustar stock para verificar nada.
- `core/costing/` y Grimorio Recetas están cerrados. No tocar
  `buildStockFromPurchases`.
- En identidad, la similitud de nombres solo propone: el fundador decide cada
  grupo. Un único grupo por operación.
- Para una fusión: trasladar primero la oferta del alias a `supplierData` del
  maestro; después escribir `masterProductId`. Nunca borrar el alias.

## Estado funcional

| Bloque | Estado |
|---|---|
| Identidad A-C | Hecho y desplegado: informe, alias en lectura y consolidación visual sin históricos reescritos. |
| Identidad D | Pendiente: fundador eligió el grupo 3 (dos fichas de mezcal Aguerrido). No se ha escrito todavía. |
| Mercado móvil | Hecho y desplegado: buscador, filtros y menús responsivos. Pendiente confirmar visualmente el ancho del menú de proveedores en todos los breakpoints. |
| Depuración de categorías | Herramienta reversible desplegada en `2c17986`; previsualiza 724 fichas. Solo cambia `categoria` y guarda `categoriaAntesDeNormalizar`. Grupos ambiguos excluidos. La confirmación nativa quedó pendiente de aceptación del fundador. |
| Identidad visual | Validado y pendiente del despliegue de esta sesión: `public/nexus-logo.png` alimenta login, barra lateral, favicon, Apple touch icon e iconos PWA. |

## Categorías: alcance aprobado

La herramienta solo normaliza coincidencias exactas: ortografía, plural,
mayúsculas y etiquetas redundantes, por ejemplo `FRUTOS SECOS FRUTOS SECOS` →
`Frutos secos` y `PATATAS, RAICES Y TUBERCULOS FRESCOS` → `Tubérculos frescos`.
No toca `SEC`, `ESPECIALES KOPPER`, `ESPECIALES MINIS`, `Importado` ni posibles
solapamientos semánticos. Su rollback se puede construir desde
`categoriaAntesDeNormalizar`; no afecta a costes, stock, proveedores o recetas.

## Identidad visual: contratos de archivos

Mantener estos nombres, porque ya son referencias públicas y de PWA:

| Archivo | Consumidor |
|---|---|
| `public/nexus-logo.png` | Logo interno: acceso y barra lateral (`NexusOrb`). |
| `public/favicon-32.png` | Pestaña del navegador. |
| `public/apple-touch-icon.png` | Inicio de iOS/iPadOS. |
| `public/icon-192.png` | Instalación PWA estándar. |
| `public/icon-512.png` | Instalación PWA, máscara y app de escritorio instalada desde PWA. |

No hay configuración Electron, Tauri ni Capacitor en el repositorio: la versión
de escritorio actual usa el manifiesto PWA y por eso `icon-512.png` es el
activo de escritorio relevante.

## Pendiente inmediato

1. Verificar en producción el bundle, el manifiesto y los cinco activos de la
   nueva identidad visual después del despliegue en curso.
2. Si el fundador acepta la alerta de Mercado, verificar que el resultado
   informe 724 fichas depuradas y que la lista muestre las categorías nuevas.
3. Volver a Fase D de identidad solo con el grupo Aguerrido elegido; preparar
   las dos escrituras y su verificación antes de ejecutarlas.
