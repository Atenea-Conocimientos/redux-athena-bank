const { test, expect } = require('./fixtures');

test.describe('Sesiones @advanced @auth', () => {
  test('una respuesta demorada no reabre un diálogo después del logout en otra pestaña', async ({
    page,
    context,
    lab,
  }) => {
    let allowResponse;
    let receivedResponse;
    const held = new Promise((resolve) => {
      allowResponse = resolve;
    });
    const received = new Promise((resolve) => {
      receivedResponse = resolve;
    });
    await page.route('**/api/quotes', async (route) => {
      const response = await route.fetch();
      receivedResponse();
      await held;
      await route.fulfill({ response });
    });
    const other = await context.newPage();
    try {
      await other.goto('/');
      await page.goto('/');
      await page
        .getByRole('button', { name: 'Transferir ↗', exact: true })
        .click();
      await page.getByLabel('Importe a transferir').fill('12');
      await page.getByRole('button', { name: 'Revisar transferencia' }).click();
      await received;
      await other.getByRole('button', { name: 'Salir', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Tu sesión de práctica' }),
      ).toBeVisible();
      allowResponse();
      await expect(page.getByRole('alert')).toContainText(
        'La sesión cambió durante la solicitud',
      );
      await expect(page.getByRole('dialog')).toBeHidden();
      await expect(page.getByTestId('available-total')).toHaveCount(0);
    } finally {
      allowResponse();
      await other.close();
    }
  });

  test('cerrar voluntariamente el wizard descarta su borrador', async ({
    page,
    lab,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Transferir ↗', exact: true })
      .click();
    await page.getByLabel('Importe a transferir').fill('12');
    await page.getByRole('button', { name: 'Revisar transferencia' }).click();
    await expect(
      page.getByRole('heading', { name: 'Confirmar transferencia' }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await lab.api.post('/api/lab/session/expire');
    await page
      .getByRole('region', { name: 'Cuenta ana.diaria', exact: true })
      .getByRole('button', { name: 'Congelar', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Tu sesión de práctica' }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Buen día, Ana.' }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await page
      .getByRole('button', { name: 'Transferir ↗', exact: true })
      .click();
    await expect(page.getByLabel('Importe a transferir')).toHaveValue('');
  });

  test('sesión vencida recupera borrador, nunca OTP ni envío automático', async ({
    page,
    lab,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Transferir ↗', exact: true })
      .click();
    await page.getByLabel('Importe a transferir').fill('123.45');
    await page.getByLabel('Concepto').fill('Mi borrador de práctica');
    await page.getByRole('button', { name: 'Revisar transferencia' }).click();
    await page.getByLabel('Código de confirmación ficticio').fill('246810');
    expect((await lab.api.post('/api/lab/session/expire')).ok()).toBeTruthy();
    await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
    await expect(
      page.getByRole('heading', { name: 'Tu sesión de práctica' }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.locator('input[name="otp"]')).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toContainText('Borrador recuperado');
    await expect(page.getByLabel('Importe a transferir')).toHaveValue('123.45');
    await expect(page.getByLabel('Concepto', { exact: true })).toHaveValue(
      'Mi borrador de práctica',
    );
    expect(
      (await (await lab.api.get('/api/overview')).json()).transfers,
    ).toHaveLength(0);
    await page.getByRole('button', { name: 'Revisar transferencia' }).click();
    await expect(
      page.getByLabel('Código de confirmación ficticio'),
    ).toHaveValue('');
    await page.getByLabel('Código de confirmación ficticio').fill('246810');
    await page.getByRole('button', { name: 'Confirmar y reservar' }).click();
    await expect(
      page.getByText('Transferencia pendiente: el saldo quedó reservado.'),
    ).toBeVisible();
    expect(
      (await (await lab.api.get('/api/overview')).json()).transfers,
    ).toHaveLength(1);
  });

  test('otro usuario no recibe el borrador después de expirar', async ({
    page,
    lab,
  }) => {
    await page.goto('/');
    await page
      .getByRole('button', { name: 'Transferir ↗', exact: true })
      .click();
    await page.getByLabel('Importe a transferir').fill('12');
    await lab.api.post('/api/lab/session/expire');
    await page.getByRole('button', { name: 'Revisar transferencia' }).click();
    await expect(
      page.getByRole('heading', { name: 'Tu sesión de práctica' }),
    ).toBeVisible();
    await page
      .getByLabel('Email ficticio', { exact: true })
      .fill('bruno@demo.test');
    await page
      .getByRole('button', { name: 'Iniciar sesión', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Buen día, Bruno.' }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toBeHidden();
    await page
      .getByRole('button', { name: 'Transferir ↗', exact: true })
      .click();
    await expect(page.getByLabel('Importe a transferir')).toHaveValue('');
  });

  test('logout entre pestañas cierra diálogos y oculta saldos', async ({
    page,
    context,
    lab,
  }) => {
    await page.goto('/');
    const other = await context.newPage();
    await other.goto('/');
    await other
      .getByRole('button', { name: 'Transferir ↗', exact: true })
      .click();
    await other.getByLabel('Importe a transferir').fill('25');
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(
      other.getByRole('heading', { name: 'Tu sesión de práctica' }),
    ).toBeVisible();
    await expect(other.getByRole('dialog')).toBeHidden();
    await expect(other.getByTestId('available-total')).toHaveCount(0);
    expect((await lab.api.get('/api/overview')).status()).toBe(401);
    await other.close();
  });

  test('control manual de sesión y geolocalización denegada', async ({
    page,
    lab,
  }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition: (_, failure) =>
            failure({ code: 1, message: 'Denied' }),
        },
      });
    });
    await page.goto('/laboratorio');
    await page
      .getByRole('button', { name: 'Buscar sucursal ficticia' })
      .click();
    await expect(page.locator('#location-status')).toContainText(
      'Permiso denegado',
    );
    await page.getByRole('button', { name: 'Vencer mi sesión' }).click();
    await expect(
      page.getByRole('heading', { name: 'Tu sesión de práctica' }),
    ).toBeVisible();
  });
});
