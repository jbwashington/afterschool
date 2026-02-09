import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 7676,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:6768',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../dist',
  },
})
