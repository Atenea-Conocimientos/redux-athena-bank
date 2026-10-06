const { test: setup, expect } = require('@playwright/test');

setup('servidor aislado y saludable @setup', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toEqual({
    status: 'ok',
    mode: 'local-lab',
    realMoney: false,
  });
  // No shared authenticated storageState: every mutable scenario owns its practice.
});
