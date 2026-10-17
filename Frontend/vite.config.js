import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Requests to /api go to the Express server, so no CORS setup is needed in dev
    proxy: { '/api': 'http://localhost:5000' },
  },
});
