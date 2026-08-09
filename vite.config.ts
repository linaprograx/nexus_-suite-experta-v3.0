import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // 🔑 CLAVE
    // El puerto lo manda quien arranca (variable PORT), para que cada sesión
    // reciba uno libre y no se pisen entre worktrees. 3100 es solo el respaldo.
    //
    // Ojo con el 3000: está PROHIBIDO en este proyecto (ver AGENTS.md). Se
    // depuró durante horas una vista que no tenía los cambios porque el 3000
    // lo servía otro worktree. Aquí estaba fijado a 3000 con strictPort, y solo
    // lo tapaba un --port en la línea de órdenes.
    port: Number(process.env.PORT) || 3100,
    strictPort: false
  },
  build: {
    sourcemap: false     // 🚫 Silencia errores .map en consola
  },
  css: {
    devSourcemap: false  // 🚫 Silencia errores .css.map
  }
})
