import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
// base must match Django STATIC_URL so built assets and dev server paths align
export default defineConfig({
  plugins: [react()],
  base: '/static/',
  build: {
    outDir: 'dist',
    manifest: true,
    rollupOptions: {
      input: {
        'src/main.jsx': path.resolve(__dirname, 'src/main.jsx'),
      },
    },
  },
  server: {
    port: 5173,
    origin: 'http://localhost:5173',
  },
})
