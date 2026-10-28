import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PORT || 3001;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      PORT: String(PORT),
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || '.next-test',
      CRMATE_TEST_MODE: 'true',
      AUTH_SECRET: 'crmate-e2e-test-secret-key-2026',
    },
  },
});
