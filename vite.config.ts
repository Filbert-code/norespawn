import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { imagetools } from 'vite-imagetools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Build-time responsive image pipeline. Lets us import an art asset with a
    // query string (e.g. `?w=480;960&format=avif;webp&as=picture`) and get back
    // optimized AVIF/WebP/fallback variants + srcsets, no manual exporting.
    imagetools(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
