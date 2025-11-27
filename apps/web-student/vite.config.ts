import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath } from 'node:url'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 2. Chuyển export default thành function nhận tham số { mode }
export default defineConfig(({ mode }) => {
  // Kiểm tra xem có đang chạy lệnh "build-widget" không
  const isWidgetBuild = mode === 'widget'

  return {
    plugins: [
      react(),
      tailwindcss(),
      svgr(),
      // 3. Chỉ kích hoạt plugin nhúng CSS khi đang build widget
      isWidgetBuild && cssInjectedByJsPlugin()
    ],
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
      // 4. Nếu là widget thì build vào dist/widget, ngược lại vào dist/app (hoặc dist thường)
      outDir: isWidgetBuild ? 'dist/widget' : 'dist',
      emptyOutDir: true,

      // 5. Cấu hình CSS: Widget thì không tách file, App thì tách bình thường
      cssCodeSplit: isWidgetBuild ? false : true,

      // 6. Cấu hình Library Mode (Chỉ áp dụng cho Widget)
      lib: isWidgetBuild
        ? {
            entry: path.resolve(__dirname, 'src/widget/index.tsx'),
            name: 'ChatWidget',
            fileName: 'chat-widget',
            formats: ['iife'] // Build ra file chạy ngay lập tức
          }
        : undefined, // Nếu build App bình thường thì không dùng lib mode

      rollupOptions: {
        // Nếu là Widget -> Bundle hết vào trong (external: [])
        // Nếu là App -> Có thể external tùy nhu cầu (thường là không cần chỉnh gì)
        external: [],

        output: {
          // Nếu là Widget thì không hash tên file để link cố định
          entryFileNames: isWidgetBuild ? 'chat-widget.js' : '[name]-[hash].js'
        }
      }
    }
  }
})
