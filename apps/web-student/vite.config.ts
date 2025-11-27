import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const isWidgetBuild = mode === 'widget'

  return {
    plugins: [react(), tailwindcss(), svgr()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    define: {
      __APP_VERSION__: JSON.stringify('0.1.0'),
      'process.env': {}
    },

    build: {
      outDir: isWidgetBuild ? 'dist/widget' : 'dist',
      emptyOutDir: true,

      // Vẫn giữ false để gom css lại xử lý
      cssCodeSplit: isWidgetBuild ? false : true,

      lib: isWidgetBuild
        ? {
            entry: path.resolve(__dirname, 'src/widget/index.tsx'),
            name: 'ChatWidget',
            fileName: 'chat-widget',
            formats: ['iife']
          }
        : undefined,

      rollupOptions: {
        external: [],
        output: {
          entryFileNames: isWidgetBuild ? 'chat-widget.js' : '[name]-[hash].js'
        }
      }
    }
  }
})
