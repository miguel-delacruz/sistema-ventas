import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    coverage: {
      include: ['js/sales-domain.js', 'js/complaints-domain.js'],
      reporter: ['text', 'html']
    }
  },
  build: {
    rollupOptions: {
      input: {
        login: resolve(import.meta.dirname, 'index.html'),
        dashboard: resolve(import.meta.dirname, 'dashboard.html'),
        venta: resolve(import.meta.dirname, 'nueva-venta.html'),
        reportes: resolve(import.meta.dirname, 'reportes.html'),
        reclamaciones: resolve(import.meta.dirname, 'reclamaciones.html')
      }
    }
  }
});
