import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // In dev: proxy all /api/* requests to the Node backend on port 3000
  // This lets `fetch('/api/session')` in the React app reach server.js
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // In production: build directly into the public/ folder that server.js serves
  // Run `npm run build` from my-app/, then start server.js — everything works
  build: {
    outDir: '../public',
    emptyOutDir: true,
  },
})
