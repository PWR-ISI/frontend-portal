import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      // Specific rules first (most specific path wins)
      '/api/v1/slots': {
        target: 'http://localhost:8008',
        changeOrigin: true,
      },
      '/api/v1/doctor-schedules': {
        target: 'http://localhost:8008',
        changeOrigin: true,
      },
      // Catch-all: appointments and everything else → appointment-service
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
  },
})
