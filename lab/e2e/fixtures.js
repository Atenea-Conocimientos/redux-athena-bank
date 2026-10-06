const base = require('@playwright/test');

const test = base.test.extend({
  lab: async ({ context }, use) => {
    const created = await context.request.post('/api/labs', {
      data: { profile: 'stable' },
    });
    base.expect(created.status()).toBe(201);
    const lab = await created.json();
    const login = await context.request.post('/api/auth/login', {
      data: { email: 'ana@demo.test', password: lab.password },
    });
    base.expect(login.ok()).toBeTruthy();
    await use({ ...lab, api: context.request });
    await context.request.delete('/api/lab');
  },
});

async function pending(api, amount = 10000) {
  const quote = await api.post('/api/quotes', {
    data: { from: 'ana-main', toAlias: 'bruno.diaria', amount },
  });
  base.expect(quote.status()).toBe(201);
  const q = await quote.json();
  const response = await api.post('/api/transfers', {
    headers: { 'Idempotency-Key': q.id },
    data: { quoteId: q.id, otp: '246810' },
  });
  base.expect(response.status()).toBe(201);
  return response.json();
}
module.exports = { test, expect: base.expect, pending };
