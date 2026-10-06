const { test, expect } = require('@playwright/test');
const fs = require('node:fs/promises');
const AxeBuilder = require('@axe-core/playwright').default;
const { MarketPage } = require('./pages/MarketPage');

test.describe('Integraciones @advanced @network', () => {
  test.use({ serviceWorkers: 'block' });

  test('HAR: graba solo proveedor público y reproduce sin llamadas reales', async ({
    browser,
    baseURL,
  }, testInfo) => {
    const har = testInfo.outputPath('public-rates.har');
    const recording = await browser.newContext({
      baseURL,
      serviceWorkers: 'block',
      recordHar: {
        path: har,
        urlFilter: '**/api/market/rates',
        content: 'embed',
        mode: 'minimal',
      },
    });
    try {
      const market = new MarketPage(await recording.newPage());
      await market.open();
      await expect(market.rate).toHaveText('1 USD = 1.000 ARS');
    } finally {
      await recording.close();
    } // Flush HAR before replay.
    const captured = JSON.parse(await fs.readFile(har, 'utf8'));
    expect(captured.log.entries).toHaveLength(1);
    expect(
      captured.log.entries[0].request.headers.some((h) =>
        /cookie|authorization/i.test(h.name),
      ),
    ).toBeFalsy();
    const replay = await browser.newContext({
      baseURL,
      serviceWorkers: 'block',
    });
    try {
      const page = await replay.newPage();
      let fallbacks = 0;
      await page.route('**/api/market/rates', (route) => {
        fallbacks++;
        return route.abort();
      });
      await page.routeFromHAR(har, {
        url: '**/api/market/rates',
        notFound: 'abort',
      });
      const market = new MarketPage(page);
      await market.open();
      await expect(market.rate).toHaveText('1 USD = 1.000 ARS');
      await market.selectCurrency('EUR');
      await expect(market.rate).toHaveText('1 EUR = 1.200 ARS');
      await market.refresh();
      await expect(market.status).toContainText('Tasa vigente');
      expect(fallbacks).toBe(0);
    } finally {
      await replay.close();
    }
    await testInfo.attach('HAR público sin cookies', {
      path: har,
      contentType: 'application/json',
    });
  });

  for (const scenario of [
    {
      name: 'tasa alterada válida',
      patch: (d) => ({ ...d, rates: { USD: 1500, EUR: 1800 } }),
      expected: 'Tasa vigente',
      value: '1 USD = 1.500 ARS',
    },
    {
      name: 'tasa vencida',
      patch: (d) => ({ ...d, asOf: 1, expiresAt: 90001 }),
      expected: 'Datos desactualizados',
      value: '1 USD = 1.000 ARS',
    },
    {
      name: 'tasa negativa',
      patch: (d) => ({ ...d, rates: { USD: -10, EUR: 1200 } }),
      expected: 'Respuesta inválida',
      value: '—',
    },
    {
      name: 'contrato incompleto',
      patch: () => ({ fictional: true }),
      expected: 'Respuesta inválida',
      value: '—',
    },
  ]) {
    test(`route.fetch + parametrización: ${scenario.name}`, async ({
      page,
    }) => {
      await page.route('**/api/market/rates', async (route) => {
        const response = await route.fetch();
        await route.fulfill({
          response,
          json: scenario.patch(await response.json()),
        });
      });
      const market = new MarketPage(page);
      await market.open();
      await expect(market.status).toContainText(scenario.expected);
      await expect(market.rate).toHaveText(scenario.value);
    });
  }

  test('clock vence HTTP y un error posterior no deja una tasa válida', async ({
    page,
  }) => {
    await page.clock.install();
    const market = new MarketPage(page);
    await market.open();
    await expect(market.status).toContainText('Tasa vigente');
    await page.clock.fastForward(91000);
    await expect(market.status).toContainText('Datos desactualizados');
    await page.route('**/api/market/rates', (route) =>
      route.fulfill({ status: 503, json: {} }),
    );
    await market.refresh();
    await expect(market.status).toContainText('Proveedor no disponible');
    await expect(market.rate).toHaveText('—');
    await expect(
      page.getByRole('button', { name: 'Copiar cotización' }),
    ).toBeDisabled();
  });

  test('WebSocket real: frames, corte y reconexión sin duplicar listeners', async ({
    page,
  }) => {
    const market = new MarketPage(page);
    await market.open();
    const connected = page.waitForEvent('websocket');
    await market.connect();
    const ws = await connected;
    await expect(page.locator('#stream-sequence')).toHaveText('Evento #0');
    const frame = ws.waitForEvent('framereceived', {
      predicate: (e) => JSON.parse(String(e.payload)).sequence === 1,
    });
    await page.getByRole('button', { name: 'Solicitar nueva tasa' }).click();
    expect(JSON.parse(String((await frame).payload)).rates.USD).toBe(1001);
    await expect(page.locator('#stream-value')).toHaveText('1 USD = 1.001 ARS');
    await page.getByRole('button', { name: 'Simular corte' }).click();
    await expect(market.streamStatus).toContainText('Desconectado');
    await expect(
      page.getByRole('button', { name: 'Solicitar nueva tasa' }),
    ).toBeDisabled();
    await market.connect();
    await expect(page.locator('#stream-sequence')).toHaveText('Evento #0');
    await page.getByRole('button', { name: 'Solicitar nueva tasa' }).click();
    await expect(page.locator('#stream-sequence')).toHaveText('Evento #1');
  });

  test('routeWebSocket: proveedor simulado, evento inválido y recuperación', async ({
    page,
  }) => {
    let incoming;
    await page.routeWebSocket('**/ws/market', (ws) => {
      incoming = ws;
      ws.onMessage((command) => {
        if (command === 'next')
          ws.send(
            JSON.stringify({
              type: 'rates',
              fictional: true,
              base: 'ARS',
              asOf: Date.now(),
              expiresAt: Date.now() + 90000,
              sequence: 7,
              rates: { USD: 1700, EUR: 2000 },
            }),
          );
      });
    });
    const market = new MarketPage(page);
    await market.open();
    await market.connect();
    await expect(market.streamStatus).toContainText('Conectado');
    incoming.send('not-json');
    await expect(market.streamStatus).toContainText('Evento inválido');
    await page.getByRole('button', { name: 'Solicitar nueva tasa' }).click();
    await expect(page.locator('#stream-value')).toHaveText('1 USD = 1.700 ARS');
    await expect(page.locator('#stream-sequence')).toHaveText('Evento #7');
    await incoming.close({ code: 1012, reason: 'Caída simulada' });
    await expect(market.streamStatus).toContainText('Desconectado');
  });

  test('WebSocket pass-through: intercepta el servidor real con connectToServer', async ({
    page,
  }) => {
    await page.routeWebSocket('**/ws/market', (ws) => {
      const upstream = ws.connectToServer();
      upstream.onMessage((message) => {
        const data = JSON.parse(String(message));
        if (data.type === 'rates') data.rates.USD = 2222;
        ws.send(JSON.stringify(data));
      });
    });
    const market = new MarketPage(page);
    await market.open();
    await market.connect();
    await expect(page.locator('#stream-value')).toHaveText('1 USD = 2.222 ARS');
    await page.getByRole('button', { name: 'Solicitar nueva tasa' }).click();
    await expect(page.locator('#stream-sequence')).toHaveText('Evento #1');
    await page.getByRole('button', { name: 'Simular corte' }).click();
    await expect(market.streamStatus).toContainText('Desconectado');
  });

  for (const denied of [false, true]) {
    test(`portapapeles: ${denied ? 'permiso denegado' : 'contenido copiado'} con addInitScript`, async ({
      page,
    }) => {
      const copied = [];
      await page.exposeFunction('recordClipboard', (text) => copied.push(text));
      await page.addInitScript(
        ({ denied }) => {
          Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: {
              writeText: async (text) => {
                if (denied) throw new DOMException('Denied', 'NotAllowedError');
                await window.recordClipboard(text);
              },
            },
          });
        },
        { denied },
      );
      const market = new MarketPage(page);
      await market.open();
      await expect(market.rate).toHaveText('1 USD = 1.000 ARS');
      await page.getByRole('button', { name: 'Copiar cotización' }).click();
      await expect(page.locator('#copy-status')).toContainText(
        denied ? 'No se pudo copiar' : 'Cotización copiada',
      );
      expect(copied).toEqual(denied ? [] : ['1 USD = 1.000 ARS (ficticia)']);
    });
  }

  test('mercado: accesibilidad y evidencia responsive', async ({
    page,
  }, testInfo) => {
    const market = new MarketPage(page);
    await market.open();
    await expect(market.status).toContainText('Tasa vigente');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.screenshot({
      path: testInfo.outputPath('market.png'),
      fullPage: true,
    });
  });
});
