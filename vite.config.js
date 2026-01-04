import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    sourcemap: false,
  },
  server: {
    port: 3000,
    open: true,
    host: '0.0.0.0'
  }
});
