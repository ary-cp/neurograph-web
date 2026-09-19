import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Dev: the browser talks to /api on the Vite origin → Vite forwards to Express. Zero CORS.
    // Prod: set VITE_API_URL to the deployed backend (CORS is configured there via CLIENT_ORIGIN).
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
