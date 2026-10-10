import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    // Туннель (cloudflared/ngrok) приходит с чужим Host — разрешаем любые.
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
