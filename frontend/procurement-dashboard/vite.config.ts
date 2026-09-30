import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/procurement/',
  server: { port: 5172, host: '0.0.0.0' },
});
