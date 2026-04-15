import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Keep in sync with `VITE_DEV_API_ORIGIN` / `googleOAuthLoginUrl` in `src/lib/apiBase.js` (OAuth cookies must match API origin).
  const proxyTarget =
    env.VITE_DEV_API_ORIGIN?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    'https://localhost:7000';

  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      // Keep a stable localhost origin for OAuth/session cookies.
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
