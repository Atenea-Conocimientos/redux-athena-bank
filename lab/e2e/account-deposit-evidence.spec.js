const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.use(process.env.DEPOSIT_LESSON_CAPTURE_DIR
  ? { deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } } : {});

async function capture(page, name) {
  if (process.env.DEPOSIT_LESSON_CAPTURE_DIR) {
    await page.screenshot({
      path: path.join(process.env.DEPOSIT_LESSON_CAPTURE_DIR, name),
      animations: 'disabled',
    });
  }
}

async function abrirPractica(page) {
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Buen día, Ana.');
}

test('depósito: evidencia de dos botones y actualización de la cuenta elegida', async ({ page }) => {
  await abrirPractica(page);
  const diaria = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
  const ahorro = page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true });
  await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  // La ambigüedad se prueba, no se oculta con .first(), .nth() ni clics forzados.
  const botones = page.getByRole('button', { name: 'Depositar', exact: true });
  await expect(botones).toHaveCount(2);
  await expect(botones.click()).rejects.toThrow(/strict mode violation/);
  await expect(page.getByRole('dialog')).toBeHidden();
  await diaria.getByRole('button', { name: 'Depositar', exact: true }).scrollIntoViewIfNeeded();
  await capture(page, 'before.png');

  await diaria.getByRole('button', { name: 'Depositar', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Ingresar fondos ficticios' });
  await expect(dialogo.getByLabel('Cuenta para depósito')).toHaveValue('ana-main');
  await dialogo.getByLabel('Importe a depositar').fill('100');
  await capture(page, 'form.png');
  await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
  await expect(dialogo).toBeHidden();
  await expect(diaria.getByText('$ 2.600,00', { exact: true })).toBeVisible();
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await capture(page, 'after.png');
});

test('depósito: evidencia del reto de ahorro independiente', async ({ page }) => {
  await abrirPractica(page);
  const diaria = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
  const ahorro = page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true });
  await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await ahorro.getByRole('button', { name: 'Depositar', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Ingresar fondos ficticios' });
  await expect(dialogo.getByLabel('Cuenta para depósito')).toHaveValue('ana-save');
  await dialogo.getByLabel('Importe a depositar').fill('50');
  await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
  await expect(dialogo).toBeHidden();
  await expect(ahorro.getByText('$ 650,00', { exact: true })).toBeVisible();
  await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
  await capture(page, 'challenge.png');
});
