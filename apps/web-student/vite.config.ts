import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import svgr from 'vite-plugin-svgr'
import { fileURLToPath } from 'node:url'
import cssInjecrByJsPlugin from 'vite-plugin-css-injected-by-js'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss(), svgr(), cssInjecrByJsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0'),
    // Thêm dòng này để tránh lỗi "process is not defined" khi chạy trên trình duyệt khách
    'process.env': {} 
  },

  build: {
    lib: {
      // Đường dẫn tới file entry widget (bạn cần đảm bảo file này tồn tại như bước 1)
      entry: path.resolve(__dirname, 'src/widget/index.tsx'), 
      name: 'ChatWidget', // Tên biến global khi script load xong
      fileName: (format) => `chat-widget.${format}.js`, // Tên file output: chat-widget.es.js / chat-widget.umd.js
      formats: ['es', 'umd'] // Build ra cả 2 chuẩn (ES cho web hiện đại, UMD cho legacy)
    },
    rollupOptions: {
      // QUAN TRỌNG: Để trống mảng này để React được đóng gói CÙNG VỚI script.
      // Nếu bạn điền ['react', 'react-dom'] vào đây, widget sẽ lỗi trên web không có React.
      external: [], 
      output: {
        // Cấu hình tên file CSS xuất ra cho gọn
        assetFileNames: (assetInfo) => {
          // Kiểm tra nếu là file css
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'chat-widget.css';
          }
          return assetInfo.name as string;
        },
      },
    },
    // Tắt cssCodeSplit để gom CSS nếu cần (mặc định Vite sẽ tách CSS ra file riêng)
    cssCodeSplit: false, 
  }
})