import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr'

export default defineConfig({
  plugins: [react(), tailwindcss(),svgr()],
  server: {
    port: 5174,
  },
  define: {
    __APP_VERSION__: JSON.stringify("0.1.0"),
  },
});
