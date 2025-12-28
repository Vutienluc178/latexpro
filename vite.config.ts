import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Map process.env.API_KEY to Vite's environment variable
    'process.env.API_KEY': 'import.meta.env.VITE_API_KEY'
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  }
});