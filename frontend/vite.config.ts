import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The SPA talks to the API through this proxy, so the browser only ever sees one
// origin: the HttpOnly session cookie stays first-party and no CORS setup is needed.
const apiProxy = { '/api': 'http://localhost:3000' };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, proxy: apiProxy },
  preview: { port: 4173, proxy: apiProxy },
});
