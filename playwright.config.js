const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './lab/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  timeout: 30000,
  expect: { timeout: 7000 },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4178',
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /global\.setup\.js/ },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      dependencies: ['setup'],
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      dependencies: ['setup'],
      use: { ...devices['Desktop Safari'] },
    },
    { name: 'mobile', dependencies: ['setup'], use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node lab/server.cjs',
    url: 'http://127.0.0.1:4178/api/health',
    env: { LAB_PORT: '4178', LAB_DB: ':memory:' },
    reuseExistingServer: false,
  },
});
