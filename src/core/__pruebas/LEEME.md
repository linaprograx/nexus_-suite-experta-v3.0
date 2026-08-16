# Pruebas del núcleo

Comprobaciones de comportamiento de los módulos puros de `src/core`. Sin
framework a propósito: son ficheros que se ejecutan y dicen qué falla.

```bash
for f in src/core/__pruebas/t*.ts; do npx tsx "$f"; done
```

Cada una comprueba **lo que debe pasar y lo que NO debe pasar**. Esa segunda
mitad es la que ha encontrado los fallos de verdad: que un catálogo sin alias dé
exactamente el mismo resultado que antes, que MEZCAL no se junte con TEQUILA, o
que 125 productos estables no expulsen del ranking a la única bajada.

| Fichero | Qué cubre |
|---|---|
| `tcoste.ts` | El motor de coste resuelve el producto maestro |
| `tstockutils.ts` | Consolidación de existencias y movimientos que no se pierden |
| `treglas.ts` | Reglas de stock cruzadas por maestro |
| `tstock.ts` | Techo de stock, sobrestock y recorte de la cantidad sugerida |
| `ttax2.ts` | Familia, subfamilia y etiquetas |
| `tprecios.ts` · `tprecios2.ts` | Series de precio y el ranking |
| `timport.ts` | Lectura en seco de catálogos de proveedor |
