import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'https://localhost:7000';

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      // LinkedIn callback redirect URLs are configured for 127.0.0.1:5173.
      // Keep dev origin stable so OAuth round-trips don't land on the wrong port.
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
