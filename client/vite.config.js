import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    port: 7676,
    open: true,
  },
  build: {
    outDir: '../dist',
  },
})
