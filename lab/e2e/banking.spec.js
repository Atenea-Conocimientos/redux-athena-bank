const { test, expect, pending } = require('./fixtures');

test('OTP inválido muestra error dentro del diálogo y permite corregir sin crear otra operación', async ({ page, lab }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Transferir ↗' }).click();
  await page.getByLabel('Importe a transferir').fill('10');
  await page.getByRole('button', { name: 'Revisar transferencia' }).click();
  await page.getByLabel('Código de confirmación ficticio').fill('000000');
  await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('incorrecto');
  expect((await (await lab.api.get('/api/overview')).json()).transfers).toHaveLength(0);
  await page.getByLabel('Código de confirmación ficticio').fill('246810');
  await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
  await expect(page.getByRole('article')).toContainText('Pendiente');
});

test('registro y login UI, cierre de sesión y navegación protegida', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await page
    .getByRole('button', { name: 'Crear otro usuario ficticio' })
    .click();
  await page.getByLabel('Nombre ficticio', { exact: true }).fill('Clara QA');
  await page.getByLabel('Email ficticio nuevo').fill('clara@demo.test');
  await page
    .getByLabel('Contraseña nueva de práctica')
    .fill('SoloFicticia2026!');
  await page
    .getByRole('button', { name: 'Crear usuario', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Buen día, Clara.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '+ Crear cuenta' }).click();
  await page.getByLabel('Nombre de la cuenta').fill('Primera cuenta');
  await page.getByLabel('Alias de la cuenta').fill('clara.test');
  await page.getByLabel('Tipo de cuenta').selectOption('savings');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await expect(
    page.getByRole('region', { name: 'Cuenta clara.test', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Salir' }).click();
  await page.goto('/transferencias');
  await expect(
    page.getByRole('heading', { name: 'Tu sesión de práctica' }),
  ).toBeVisible();
  await page
    .getByLabel('Email ficticio', { exact: true })
    .fill('clara@demo.test');
  await page
    .getByLabel('Contraseña de práctica', { exact: true })
    .fill('SoloFicticia2026!');
  await page
    .getByRole('button', { name: 'Iniciar sesión', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Cuenta clara.test', exact: true }),
  ).toBeVisible();
  await page.request.delete('/api/lab');
});

test('scoping: deposita y congela únicamente la cuenta elegida', async ({
  page,
  lab,
}) => {
  await page.goto('/');
  const saving = page.getByRole('region', {
    name: 'Cuenta ana.ahorro',
    exact: true,
  });
  const daily = page.getByRole('region', {
    name: 'Cuenta ana.diaria',
    exact: true,
  });
  await saving.getByRole('button', { name: 'Depositar', exact: true }).click();
  await expect(page.getByLabel('Cuenta para depósito')).toHaveValue('ana-save');
  await page.getByLabel('Importe a depositar').fill('0.01');
  await page.getByRole('button', { name: 'Depositar fondos' }).click();
  await expect(saving).toContainText('600,01');
  await saving.getByRole('button', { name: 'Congelar', exact: true }).click();
  await expect(saving).toContainText('Congelada');
  await expect(daily).toContainText('Activa');
  expect(
    (await (await lab.api.get('/api/overview')).json()).accounts.find(
      (a) => a.id === 'ana-save',
    ).balance,
  ).toBe(60001);
});

test('recorrido completo: cotización → reserva → procesamiento → comprobante en popup', async ({
  page,
  lab,
}) => {
  await page.goto('/');
  await test.step('Cotizar y confirmar con OTP de práctica', async () => {
    await page.getByRole('button', { name: 'Transferir ↗' }).click();
    await page.getByLabel('Importe a transferir').fill('100');
    await page.getByLabel('Concepto', { exact: true }).fill('Curso de testing');
    await page.getByRole('button', { name: 'Revisar transferencia' }).click();
    await expect(page.getByRole('dialog')).toContainText('101,00');
    await page.getByLabel('Código de confirmación ficticio').fill('246810');
    await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
    await expect(page.getByRole('article')).toContainText('Pendiente');
  });
  await test.step('Verificar efecto real en API antes de procesar', async () => {
    const { accounts } = await (await lab.api.get('/api/overview')).json();
    expect(accounts.find((a) => a.id === 'ana-main')).toMatchObject({
      balance: 250000,
      reserved: 10100,
      available: 239900,
    });
    await page.getByRole('button', { name: 'Procesar', exact: true }).click();
    await expect(page.getByRole('article')).toContainText('Completada');
  });
  const popupEvent = page.waitForEvent('popup');
  await page.getByRole('link', { name: 'Comprobante ↗' }).click();
  const popup = await popupEvent;
  await expect(popup.getByRole('main')).toContainText('Curso de testing');
  await expect(popup.getByRole('main')).toContainText('Completada');
  await popup.close();
});

test('diálogo nativo: cancelar libera reserva y rechaza una segunda cancelación', async ({
  page,
  lab,
}) => {
  const tx = await pending(lab.api);
  await page.goto('/transferencias');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('article')).toContainText('Pendiente');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('article')).toContainText('Cancelada');
  expect((await lab.api.post(`/api/transfers/${tx.id}/cancel`)).status()).toBe(
    409,
  );
  const data = await (await lab.api.get('/api/overview')).json();
  expect(data.accounts[0].reserved).toBe(0);
});

test('dos sesiones: Bruno recibe el dinero sin poder procesar la operación de Ana', async ({
  page,
  browser,
  baseURL,
  lab,
}) => {
  const bruno = await browser.newContext({ baseURL });
  try {
    await bruno.addCookies([
      {
        name: 'athena_lab',
        value: lab.id,
        url: baseURL,
        httpOnly: true,
        sameSite: 'Strict',
      },
    ]);
    await bruno.request.post('/api/auth/login', {
      data: { email: 'bruno@demo.test', password: lab.password },
    });
    const tx = await pending(lab.api);
    expect(
      (
        await bruno.request.post(`/api/transfers/${tx.id}/settle`, { data: {} })
      ).status(),
    ).toBe(404);
    await page.goto('/transferencias');
    await page.getByRole('button', { name: 'Procesar', exact: true }).click();
    await expect(page.getByRole('article')).toContainText('Completada');
    const otherPage = await bruno.newPage();
    await otherPage.goto('/');
    await expect(
      otherPage.getByRole('region', {
        name: 'Cuenta bruno.diaria',
        exact: true,
      }),
    ).toContainText('1.300,00');
    expect(
      (await (await bruno.request.get('/api/overview')).json()).accounts,
    ).toHaveLength(1);
  } finally {
    await bruno.close();
  }
});

test('storageState reutiliza sesión en otro contexto, sin grabar credenciales en el repo', async ({
  context,
  browser,
  baseURL,
  lab,
}) => {
  const copy = await browser.newContext({
    baseURL,
    storageState: await context.storageState(),
  });
  try {
    const page = await copy.newPage();
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Buen día, Ana.' }),
    ).toBeVisible();
  } finally {
    await copy.close();
  }
});

test('fallo después del débito: UI permite reintentar y backend hace rollback completo', async ({
  page,
  lab,
}) => {
  await pending(lab.api);
  const before = await (await lab.api.get('/api/overview')).json();
  await page.goto('/laboratorio');
  await page.getByRole('button', { name: 'Simular fallo al procesar' }).click();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Transferencias' })
    .click();
  await page.getByRole('button', { name: 'Procesar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('operación revertida');
  const after = await (await lab.api.get('/api/overview')).json();
  expect(after.accounts).toEqual(before.accounts);
  expect(after.movements).toEqual(before.movements);
  await page.getByRole('button', { name: 'Procesar', exact: true }).click();
  await expect(page.getByRole('article')).toContainText('Completada');
});

test('filtrado, paginado y descarga de movimientos son consistentes', async ({
  page,
  lab,
}, testInfo) => {
  for (let i = 0; i < 6; i++)
    await lab.api.post('/api/accounts/ana-save/deposit', {
      data: { amount: 100 },
    });
  await page.goto('/movimientos');
  await expect(page.getByRole('row')).toHaveCount(6); // header + five rows
  await page.getByRole('button', { name: 'Cargar más movimientos' }).click();
  await expect(page.getByRole('row')).toHaveCount(9);
  await page.getByLabel('Tipo de movimiento').selectOption('deposit');
  await page.getByLabel('Buscar movimientos').fill('ana.ahorro');
  await page.getByRole('button', { name: 'Aplicar filtros' }).click();
  await expect(page.getByText('6 movimientos encontrados')).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar CSV', exact: true }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('athena-movimientos.csv');
  const path = testInfo.outputPath('movimientos.csv');
  await download.saveAs(path);
  const content = require('node:fs').readFileSync(path, 'utf8');
  expect(content).toContain('ana.ahorro');
  expect(content).not.toContain('bruno.diaria');
  await testInfo.attach('extracto', { path, contentType: 'text/csv' });
});
