import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'http://web:8000';
  
  console.log('--- Vite Config ---');
  console.log('Proxy Target:', target);
  
  return {
    plugins: [
      react(),
      cssInjectedByJsPlugin(),
    ],
    server: {
      proxy: {
        '/api': {
          target: target,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
          entryFileNames: 'widget.js',
          chunkFileNames: 'widget.js',
          assetFileNames: 'widget.[ext]',
        },
      },
    },
  };
});
