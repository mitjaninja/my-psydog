import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Туннель (cloudflared/ngrok) приходит с чужим Host — разрешаем любые.
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
