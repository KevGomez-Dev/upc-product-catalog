import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results',
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:3001',
    channel: process.env.E2E_BROWSER_CHANNEL,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
});
