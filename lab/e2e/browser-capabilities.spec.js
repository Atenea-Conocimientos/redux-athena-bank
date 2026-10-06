const { test, expect } = require('./fixtures');
const AxeBuilder = require('@axe-core/playwright').default;

test('respuesta demorada mantiene el formulario bloqueado sin sleeps arbitrarios', async ({
  page,
  lab,
}) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  let intercepted;
  const started = new Promise((resolve) => {
    intercepted = resolve;
  });
  await page.route('**/api/accounts/ana-main/deposit', async (route) => {
    intercepted();
    await gate;
    await route.continue();
  });
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Cuenta ana.diaria', exact: true })
    .getByRole('button', { name: 'Depositar', exact: true })
    .click();
  await page.getByLabel('Importe a depositar').fill('10');
  await page.getByRole('button', { name: 'Depositar fondos' }).click();
  await started;
  try {
    await expect(
      page.getByRole('button', { name: 'Depositar fondos' }),
    ).toBeDisabled();
  } finally {
    release();
  }
  await expect(
    page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }),
  ).toContainText('2.510,00');
  expect(
    (await (await lab.api.get('/api/overview')).json()).movements.filter(
      (m) => m.type === 'deposit',
    ),
  ).toHaveLength(1);
});

test('upload, iframe, postMessage y Shadow DOM con locators accesibles', async ({
  page,
  lab,
}) => {
  await page.goto('/documentos');
  await page
    .getByLabel('Archivo CSV ficticio')
    .setInputFiles({
      name: 'beneficiarios.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(
        'nombre,alias\nBruno,bruno.diaria\nAhorro,ana.ahorro',
      ),
    });
  await page.getByRole('button', { name: 'Importar CSV', exact: true }).click();
  await expect(
    page.getByText('beneficiarios.csv · 2 filas importadas'),
  ).toBeVisible();
  const provider = page.frameLocator(
    'iframe[title="Proveedor de verificación ficticio"]',
  );
  await provider.getByLabel('Código del proveedor').fill('135790');
  await provider.getByRole('button', { name: 'Validar código' }).click();
  await expect(
    page.getByText('Proveedor validado: integración simulada correcta.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ayuda de práctica' }).click();
  await expect(
    page.getByText('Localizá este botón por su rol:', { exact: false }),
  ).toBeVisible();
});

test('filechooser e importación inválida: cero altas parciales', async ({
  page,
  lab,
}) => {
  await page.goto('/documentos');
  const chooserEvent = page.waitForEvent('filechooser');
  await page.getByLabel('Archivo CSV ficticio').click();
  const chooser = await chooserEvent;
  await chooser.setFiles({
    name: 'invalido.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('nombre,alias\nBruno,bruno.diaria\nError,no.existe'),
  });
  await page.getByRole('button', { name: 'Importar CSV', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Alias no encontrado');
  expect(
    (await (await lab.api.get('/api/overview')).json()).beneficiaries,
  ).toHaveLength(0);
});

test('reordenamiento accesible y persistente con teclado', async ({
  page,
  lab,
}) => {
  await lab.api.post('/api/documents/import', {
    data: {
      filename: 'demo.csv',
      content: 'nombre,alias\nBruno,bruno.diaria\nAhorro,ana.ahorro',
    },
  });
  await page.goto('/beneficiarios');
  const up = page.getByRole('button', { name: 'Subir Ahorro' });
  await up.focus();
  await up.press('Enter');
  await expect(page.getByRole('listitem').first()).toContainText('Ahorro');
  await page.reload();
  await expect(page.getByRole('listitem').first()).toContainText('Ahorro');
});

test('drag and drop cambia el orden de favoritos', async ({
  page,
  lab,
  isMobile,
}) => {
  test.skip(
    isMobile,
    'El recorrido táctil usa controles accesibles; HTML5 drag es práctica de escritorio.',
  );
  await lab.api.post('/api/documents/import', {
    data: {
      filename: 'demo.csv',
      content: 'nombre,alias\nBruno,bruno.diaria\nAhorro,ana.ahorro',
    },
  });
  await page.goto('/beneficiarios');
  await page
    .getByRole('listitem', { name: 'Beneficiario Ahorro' })
    .dragTo(page.getByRole('listitem', { name: 'Beneficiario Bruno' }));
  await expect(page.getByRole('listitem').first()).toContainText('Ahorro');
});

test('red: respuesta 503 y petición abortada no registran depósitos; luego recupera', async ({
  page,
  lab,
}) => {
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Cuenta ana.diaria', exact: true })
    .getByRole('button', { name: 'Depositar', exact: true })
    .click();
  await page.getByLabel('Importe a depositar').fill('10');
  await page.route(
    '**/api/accounts/ana-main/deposit',
    (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Proveedor temporalmente caído.' }),
      }),
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Depositar fondos' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'Proveedor temporalmente caído.',
  );
  await page.route(
    '**/api/accounts/ana-main/deposit',
    (route) => route.abort(),
    { times: 1 },
  );
  await page.getByRole('button', { name: 'Depositar fondos' }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  expect(
    (await (await lab.api.get('/api/overview')).json()).accounts[0].balance,
  ).toBe(250000);
  const responseEvent = page.waitForResponse(
    (r) => r.url().endsWith('/deposit') && r.status() === 200,
  );
  await page.getByRole('button', { name: 'Depositar fondos' }).click();
  await responseEvent;
  await expect(
    page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }),
  ).toContainText('2.510,00');
});

test('reloj del navegador vence UI; reloj de servidor rechaza cotización por separado', async ({
  page,
  lab,
}) => {
  await page.clock.install();
  await page.goto('/');
  await page.getByRole('button', { name: 'Transferir ↗' }).click();
  await page.getByLabel('Importe a transferir').fill('10');
  await page.getByRole('button', { name: 'Revisar transferencia' }).click();
  await expect(page.getByText(/La cotización vence en/)).toBeVisible();
  await page.clock.fastForward(91000);
  await expect(
    page.getByRole('button', { name: 'Confirmar y reservar' }),
  ).toBeDisabled();
  await expect(page.getByText(/Cotización vencida/)).toBeVisible();
  const q = await (
    await lab.api.post('/api/quotes', {
      data: { from: 'ana-main', toAlias: 'bruno.diaria', amount: 1000 },
    })
  ).json();
  await lab.api.post('/api/lab/clock', { data: { minutes: 2 } });
  const response = await lab.api.post('/api/transfers', {
    headers: { 'Idempotency-Key': q.id },
    data: { quoteId: q.id, otp: '246810' },
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).code).toBe('EXPIRED');
});

test('geolocalización ficticia, permisos y offline/online', async ({
  page,
  context,
  lab,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -34.6037, longitude: -58.3816 });
  await page.goto('/laboratorio');
  await page.getByRole('button', { name: 'Buscar sucursal ficticia' }).click();
  await expect(page.getByText(/Ubicación recibida/)).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByRole('alert')).toContainText('Sin conexión');
  await context.setOffline(false);
  await expect(page.getByText(/Sin conexión/)).toBeHidden();
});

test('reset pide confirmación y vuelve al inicio sin tocar otras prácticas', async ({
  page,
  lab,
}) => {
  await page.goto('/laboratorio');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reiniciar mi práctica' }).click();
  await expect(
    page.getByRole('heading', { name: 'Iniciar laboratorio' }),
  ).toBeVisible();
  expect((await lab.api.get('/api/lab')).status()).toBe(404);
});

test('accesibilidad automatizada, ARIA, foco en diálogo y layout sin desborde', async ({
  page,
  lab,
}, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Buen día, Ana.' }),
  ).toBeVisible();
  const report = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  await testInfo.attach('axe-results', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  expect(report.violations).toEqual([]);
  await expect(page.getByRole('heading', { level: 1 })).toMatchAriaSnapshot(
    '- heading "Buen día, Ana." [level=1]',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole('button', { name: '+ Crear cuenta' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  expect(
    await page
      .getByRole('dialog')
      .evaluate((d) => d.contains(document.activeElement)),
  ).toBeTruthy();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(
    page.getByRole('button', { name: '+ Crear cuenta' }),
  ).toBeFocused();
  await page.screenshot({
    path: testInfo.outputPath('dashboard.png'),
    fullPage: true,
  });
});
