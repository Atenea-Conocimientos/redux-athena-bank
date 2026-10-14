const { defineConfig, devices } = require('@playwright/test');

const baseURL = process.env.LAB_BASE_URL || 'http://127.0.0.1:4177';
const target = new URL(baseURL);
// The practice creates and removes fictitious data. Never point it at real banking.
if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(target.hostname) ||
    target.username || target.password || target.pathname !== '/' || target.search || target.hash) {
  throw new Error('LAB_BASE_URL debe ser el laboratorio local: http://127.0.0.1:4177');
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 7000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
