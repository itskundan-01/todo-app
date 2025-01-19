import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    // proxy: {
    //   '/api': 'http://localhost:5000'
    // }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    },
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
  },
  publicDir: 'public'  // Place sitemap.xml and robots.txt in a public folder
})

