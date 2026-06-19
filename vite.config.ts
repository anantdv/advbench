import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/erpnext': {
          target: 'https://erp.anantdv.com',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/erpnext/, ''),
        },
        '/api': {
          target: 'http://127.0.0.1:8787',
          changeOrigin: true,
        },
      },
    },
  };
});
