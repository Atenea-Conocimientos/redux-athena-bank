const { test, expect } = require('@playwright/test');

test('un código de confirmación incorrecto no crea transferencias ni reserva saldo', async ({ page }) => {
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
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Transferir ↗', exact: true }).click();
  const formulario = page.getByRole('dialog', { name: 'Nueva transferencia', exact: true });
  await formulario.getByLabel('Cuenta de origen').selectOption('ana-main');
  await formulario.getByLabel('Alias de destino').fill('bruno.diaria');
  await formulario.getByLabel('Importe a transferir').fill('100');
  await formulario.getByRole('button', { name: 'Revisar transferencia' }).click();
  const confirmacion = page.getByRole('dialog', { name: 'Confirmar transferencia', exact: true });
  await expect(confirmacion.getByText('$ 101,00', { exact: true })).toBeVisible();

  // @snippet reto
  await confirmacion.getByLabel('Código de confirmación ficticio').fill('000000');
  await confirmacion.getByRole('button', { name: 'Confirmar y reservar' }).click();
  await expect(confirmacion.getByRole('alert')).toContainText('incorrecto');
  await expect(confirmacion).toBeVisible();
  await confirmacion.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buen día, Ana.');
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await expect(page.getByText('Reservado $ 0,00', { exact: true })).toBeVisible();
  await expect(page.getByTestId('available-total')).toHaveText('$ 3.100,00');
  // @end
});
