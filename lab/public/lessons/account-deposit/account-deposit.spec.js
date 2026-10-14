const { test, expect } = require('@playwright/test');

test('depositar en la cuenta diaria no modifica el fondo de ahorro', async ({ page }) => {
  // Preparación de clase 02: cada caso crea su propia práctica por la interfaz.
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

  // @snippet localizar
  const cuentaDiaria = page.getByRole('region', {
    name: 'Cuenta ana.diaria', exact: true,
  });
  const cuentaAhorro = page.getByRole('region', {
    name: 'Cuenta ana.ahorro', exact: true,
  });
  await expect(cuentaDiaria.getByText('$ 2.500,00', { exact: true }))
    .toBeVisible();
  await expect(cuentaAhorro.getByText('$ 600,00', { exact: true }))
    .toBeVisible();
  // @end

  // @snippet depositar
  await cuentaDiaria.getByRole('button', { name: 'Depositar', exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Ingresar fondos ficticios' });
  await expect(dialogo.getByLabel('Cuenta para depósito')).toHaveValue('ana-main');
  await dialogo.getByLabel('Importe a depositar').fill('100');
  await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
  // @end

  // @snippet comprobar
  await expect(dialogo).toBeHidden();
  await expect(cuentaDiaria.getByText('$ 2.600,00', { exact: true }))
    .toBeVisible();
  await expect(cuentaAhorro.getByText('$ 600,00', { exact: true }))
    .toBeVisible();
  // @end
});
