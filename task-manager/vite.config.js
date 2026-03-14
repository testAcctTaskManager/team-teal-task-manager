/* global process */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy API requests to Wrangler dev server during integration tests
      '/api': {
        target: process.env.WRANGLER_DEV_URL || 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
})
