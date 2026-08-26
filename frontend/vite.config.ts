import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// A API ASP.NET Core roda em http://localhost:5021 durante o desenvolvimento.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5021',
        changeOrigin: true,
      },
    },
  },
});
