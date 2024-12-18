import { defineConfig } from 'vite';
// import { actoPlugin } from '../vite-plugin';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // actoPlugin(__dirname)
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
