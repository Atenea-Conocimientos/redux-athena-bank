const { test, expect } = require('@playwright/test');
const { MarketPage } = require('./pages/MarketPage');

test('Service Worker: recarga offline, datos viejos, recuperación y limpieza @advanced @offline', async ({
  page,
  context,
  browserName,
}, testInfo) => {
  test.skip(
    browserName !== 'chromium',
    'Las APIs Service Worker de Playwright solo están soportadas en Chromium.',
  );
  testInfo.annotations.push({
    type: 'scope',
    description: 'Solo datos públicos; no es banca offline.',
  });
  const market = new MarketPage(page);
  await market.open();
  await expect(market.status).toContainText('Tasa vigente');
  const worker = context.waitForEvent('serviceworker');
  await page
    .getByRole('button', { name: 'Habilitar consulta offline' })
    .click();
  expect((await worker).url()).toContain('/mercado/sw.js');
  await expect(page.locator('#cache-status')).toContainText(
    'Consulta offline preparada',
  );
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#network')).toContainText('Sin conexión');
  await expect(market.rate).toHaveText('1 USD = 1.000 ARS');
  await expect(market.status).toContainText('Datos desactualizados');
  await context.setOffline(false);
  const response = page.waitForResponse('**/api/market/rates');
  await market.refresh();
  expect((await response).fromServiceWorker()).toBe(true);
  await expect(market.status).toContainText('Tasa vigente');
  // An authenticated endpoint must NEVER be intercepted/cached by this worker.
  await page.evaluate(() => fetch('/api/overview').then((r) => r.text()));
  const cached = await page.evaluate(async () =>
    (await (await caches.open('athena-market-v1')).keys()).map(
      (r) => new URL(r.url).pathname,
    ),
  );
  expect(cached.sort()).toEqual(
    ['/api/market/rates', '/mercado/', '/mercado/app.js', '/style.css'].sort(),
  );
  await page.getByRole('button', { name: 'Borrar caché de mercado' }).click();
  await expect(page.locator('#cache-status')).toHaveText('Caché no activada.');
  expect(await page.evaluate(() => caches.keys())).not.toContain(
    'athena-market-v1',
  );
});
