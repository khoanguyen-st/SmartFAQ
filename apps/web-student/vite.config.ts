import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svrg from 'vite-plugin-svgr'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), svrg(), tailwindcss()],
  server: {
    port: 5173
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0')
  }
})
