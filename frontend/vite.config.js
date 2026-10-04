import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
    // In development the React app runs on :5173 and FastAPI on :8000.
    // This proxy makes /api/* calls look same-origin, so there is no CORS
    // and no environment variable holding an API base URL.
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },

  // `npm run build` emits into ../static_react, which FastAPI serves in
  // production — one server, one origin, same as before.
  build: {
    outDir: '../static_react',
    emptyOutDir: true,
  },
})
