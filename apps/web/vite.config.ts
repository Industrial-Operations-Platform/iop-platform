import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Local host bootstrap only. Future deployment routing belongs to IOP-015/018.
const proxy = { '^/health$': 'http://127.0.0.1:3000' };
export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true, proxy },
});
