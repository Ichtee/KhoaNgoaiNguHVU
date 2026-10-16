import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// the backend's port; set PORT in the shell to run a second copy next to the first
const API = `http://localhost:${process.env.PORT || 5000}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API,
        changeOrigin: true,
        secure: false,
      },
      // uploaded covers and attachments are served by the backend
      '/uploads': {
        target: API,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
