import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [svgr(), react(), tailwindcss()],
  server: {
    port: 5174
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    chunkSizeWarningLimit: 1024
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0')
  }
})
