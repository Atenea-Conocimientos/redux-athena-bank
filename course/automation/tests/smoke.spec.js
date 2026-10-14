const { test, expect } = require('@playwright/test');

test('el laboratorio está disponible y usa dinero ficticio', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.ok()).toBeTruthy();
  expect(await response.json()).toMatchObject({
    status: 'ok', mode: 'local-lab', realMoney: false,
  });
});
