import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    base: './', // Use relative paths for better portability
    define: {
      // Polyfill process.env for the browser so the Gemini SDK works
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // If you have other env vars, add them here or use JSON.stringify(env)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
    }
  };
});