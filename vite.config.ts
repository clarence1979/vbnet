import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    headers: {
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
});
