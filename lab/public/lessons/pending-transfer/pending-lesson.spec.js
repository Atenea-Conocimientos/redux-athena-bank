const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.use(process.env.LESSON_CAPTURE_DIR ? { deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } } : {});

// Complete, runnable reference for the micro-lesson. All credentials are fictional.
// Optional captures come from these same verified steps, never a live user practice.
test('microlección: pendiente reserva fondos sin acreditar al receptor', async ({ page, context, browser, baseURL }) => {
  let bruno;
  let lab;
  const capture = async (name, locator) => {
    if (process.env.LESSON_CAPTURE_DIR) {
      await locator.screenshot({ path: path.join(process.env.LESSON_CAPTURE_DIR, name), animations: 'disabled' });
    }
  };
  try {
    const created = await context.request.post('/api/labs', { data: { profile: 'stable' } });
    expect(created.status()).toBe(201);
    lab = await created.json();
    const login = await context.request.post('/api/auth/login', {
      data: { email: 'ana@demo.test', password: lab.password },
    });
    expect(login.ok()).toBeTruthy();
    // Same practice, independent authenticated session. Never copy Ana's session cookie.
    bruno = await browser.newContext({ baseURL, locale: 'es-AR', viewport: { width: 1280, height: 800 }, deviceScaleFactor: process.env.LESSON_CAPTURE_DIR ? 2 : 1 });
    await bruno.addCookies([{
      name: 'athena_lab', value: lab.id, url: baseURL, httpOnly: true, sameSite: 'Strict',
    }]);
    expect((await bruno.request.post('/api/auth/login', {
      data: { email: 'bruno@demo.test', password: lab.password },
    })).ok()).toBeTruthy();

    // @snippet inicio
    const before = await (await context.request.get('/api/overview')).json();
    expect(before.accounts.find(a => a.id === 'ana-main'))
      .toMatchObject({ balance: 250000, reserved: 0, available: 250000 });
    // @end
    const receiverBefore = await (await bruno.request.get('/api/overview')).json();
    expect(receiverBefore.accounts.find(a => a.id === 'bruno-main').balance).toBe(120000);
    await page.goto('/');
    const anaCard = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
    await expect(anaCard).toContainText('2.500,00');
    await capture('before.png', anaCard);

    // @snippet cotizacion
    await page.getByRole('button', { name: 'Transferir ↗' }).click();
    await page.getByLabel('Importe a transferir').fill('100');
    await page.getByRole('button', { name: 'Revisar transferencia' }).click();
    await expect(page.getByRole('dialog')).toContainText('101,00');
    // @end
    await capture('quote.png', page.getByRole('dialog'));
    // @snippet estado
    await page.getByLabel('Código de confirmación ficticio').fill('246810');
    await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
    await expect(page.getByRole('article')).toContainText('Pendiente');
    // @end
    await capture('pending.png', page.getByRole('article'));

    // @snippet reserva
    const response = await context.request.get('/api/overview');
    expect(response.ok()).toBeTruthy();
    const { accounts, transfers } = await response.json();
    expect(accounts.find(a => a.id === 'ana-main')).toMatchObject({
      balance: 250000,    // $2.500: sin débito todavía
      reserved: 10100,   // $101: importe + comisión
      available: 239900, // $2.399: saldo - reserva
    });
    // @end
    expect(transfers).toHaveLength(1);
    expect(transfers[0]).toMatchObject({ status: 'pending', amount: 10000, fee: 100 });
    await page.goto('/');
    await expect(anaCard).toContainText('2.399,00');
    await expect(anaCard).toContainText('101,00');
    await capture('ana.png', anaCard);

    // @snippet receptor
    // bruno es otro BrowserContext, autenticado en la misma práctica.
    const receiverResponse = await bruno.request.get('/api/overview');
    expect(receiverResponse.ok()).toBeTruthy();
    const receiver = await receiverResponse.json();
    expect(receiver.accounts.find(a => a.id === 'bruno-main'))
      .toMatchObject({ balance: 120000, reserved: 0, available: 120000 });
    // @end
    const brunoPage = await bruno.newPage();
    await brunoPage.goto('/');
    const brunoCard = brunoPage.getByRole('region', { name: 'Cuenta bruno.diaria', exact: true });
    await expect(brunoCard).toContainText('1.200,00');
    await capture('bruno.png', brunoCard);
  } finally {
    await bruno?.close();
    if (lab) await context.request.delete('/api/lab');
  }
});
