import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // 🔑 CLAVE
    port: 3000,
    strictPort: true
  },
  build: {
    sourcemap: false     // 🚫 Silencia errores .map en consola
  },
  css: {
    devSourcemap: false  // 🚫 Silencia errores .css.map
  }
})
