const path = require('node:path');
const { defineConfig, devices } = require('@playwright/test');

const port = Number(process.env.QUOTE_LESSON_PORT || 4185);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535) {
  throw new Error('QUOTE_LESSON_PORT must be a valid unprivileged local port.');
}

module.exports = defineConfig({
  testDir: path.join(__dirname, '../lab/e2e'),
  outputDir: path.join(__dirname, '../test-results/class05/artifacts'),
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  timeout: 30000,
  expect: { timeout: 7000 },
  reporter: [
    ['list'],
    ['json', { outputFile: path.join(__dirname, '../test-results/class05/results.json') }],
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.js/ },
    { name: 'chromium', dependencies: ['setup'], use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node lab/server.cjs',
    cwd: path.join(__dirname, '..'),
    url: `http://127.0.0.1:${port}/api/health`,
    env: { LAB_PORT: String(port), LAB_DB: ':memory:' },
    reuseExistingServer: false,
  },
});
