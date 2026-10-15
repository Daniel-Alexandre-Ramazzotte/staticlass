import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.STATICLASS_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Acesso pela LAN e pela URL pública do Tailscale Funnel
    // (scripts/lan-dev.sh) chega com um Host header != localhost.
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', 'src/__tests__/'],
    },
  },
});
