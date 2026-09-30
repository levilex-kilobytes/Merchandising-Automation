import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/pos/',
  server: { port: 5178, host: '0.0.0.0' },
});
