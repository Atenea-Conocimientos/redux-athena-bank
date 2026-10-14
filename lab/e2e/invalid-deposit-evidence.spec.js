const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.use(process.env.INVALID_DEPOSIT_CAPTURE_DIR
  ? { deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } } : {});

async function capture(page, name) {
  if (process.env.INVALID_DEPOSIT_CAPTURE_DIR) {
    await page.screenshot({ path: path.join(process.env.INVALID_DEPOSIT_CAPTURE_DIR, name), animations: 'disabled' });
  }
}

async function preparar(page) {
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu sesión de práctica');
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buen día, Ana.');
  const diaria = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
  const ahorro = page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true });
  await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await diaria.getByRole('button', { name: 'Depositar', exact: true }).scrollIntoViewIfNeeded();
  return { diaria, ahorro };
}

test('depósitos inválidos: evidencia de validación nativa sin solicitudes', async ({ page }) => {
  const { diaria, ahorro } = await preparar(page);
  await capture(page, 'before.png');
  const solicitudes = [];
  page.on('request', request => {
    if (request.method() === 'POST' && /\/api\/accounts\/[^/]+\/deposit$/.test(request.url())) solicitudes.push(request.url());
  });
  await diaria.getByRole('button', { name: 'Depositar', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Ingresar fondos ficticios' });
  const importe = dialogo.getByLabel('Importe a depositar');
  await expect(importe).toHaveAttribute('required', '');
  await expect(importe).toHaveAttribute('min', '0.01');
  await expect(importe).toHaveAttribute('step', '0.01');
  for (const valor of ['', '0', '-1']) {
    await importe.fill(valor);
    await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
    await expect(importe).not.toHaveJSProperty('validationMessage', '');
    await expect(importe).toBeFocused();
    expect(await importe.evaluate((input) => ({
      valueMissing: input.validity.valueMissing,
      rangeUnderflow: input.validity.rangeUnderflow,
    }))).toEqual({ valueMissing: valor === '', rangeUnderflow: valor !== '' });
    await expect(dialogo).toBeVisible();
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
    if (valor === '') await capture(page, 'empty.png');
    if (valor === '-1') await capture(page, 'error.png');
  }
  expect(solicitudes).toEqual([]);
});

test('depósitos inválidos: evidencia del límite válido de un centavo', async ({ page }) => {
  const { diaria, ahorro } = await preparar(page);
  await diaria.getByRole('button', { name: 'Depositar', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Ingresar fondos ficticios' });
  await expect(dialogo.getByLabel('Cuenta para depósito')).toHaveValue('ana-main');
  await dialogo.getByLabel('Importe a depositar').fill('0.01');
  await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
  await expect(dialogo).toBeHidden();
  await expect(diaria.getByText('$ 2.500,01', { exact: true })).toBeVisible();
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await capture(page, 'challenge.png');
});
