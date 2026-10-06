const { defineConfig } = require('@playwright/test');
const base = require('./playwright.config');

module.exports = defineConfig({
  ...base,
  testDir: './lab/visual',
  projects: [base.projects.find((p) => p.name === 'chromium')],
  use: {
    ...base.use,
    viewport: { width: 1440, height: 1100 },
    reducedMotion: 'reduce',
  },
});
