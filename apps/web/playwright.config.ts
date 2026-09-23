import { fileURLToPath } from 'node:url';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' },
  webServer: [
    { command: 'npm start --workspace @iop/api', url: 'http://127.0.0.1:3000/health', reuseExistingServer: false, env: { PORT: '3000', HOST: '127.0.0.1', IOP_TRANSPORT: 'native', IOP_CONFIG_FILE: fileURLToPath(new URL('../../config/poc.example.json', import.meta.url)) } },
    { command: 'npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: false },
  ],
});
