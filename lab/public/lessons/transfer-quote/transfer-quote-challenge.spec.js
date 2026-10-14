const { test, expect } = require('@playwright/test');

test('cotizar entre cuentas propias no cobra comisión ni modifica saldos', async ({ page }) => {
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
  await test.step('Comprobar la práctica independiente', async () => {
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  });

  // @snippet reto
  await test.step('Cotizar hacia el ahorro propio', async () => {
    await page.getByRole('button', { name: 'Transferir ↗', exact: true }).click();
    const formulario = page.getByRole('dialog', { name: 'Nueva transferencia' });
    await formulario.getByLabel('Cuenta de origen').selectOption('ana-main');
    await formulario.getByLabel('Alias de destino').fill('ana.ahorro');
    await formulario.getByLabel('Importe a transferir').fill('100');
    await formulario.getByRole('button', { name: 'Revisar transferencia' }).click();
    const cotizacion = page.getByRole('dialog', { name: 'Confirmar transferencia' });
    await expect(cotizacion.getByText('ana.ahorro', { exact: true })).toBeVisible();
    await expect(cotizacion.getByRole('term')).toHaveText([
      'Importe', 'Comisión', 'Total a reservar',
    ]);
    await expect(cotizacion.getByRole('definition')).toHaveText([
      '$ 100,00', '$ 0,00', '$ 100,00',
    ]);
    await cotizacion.getByRole('button', { name: 'Cerrar diálogo' }).click();
    await expect(cotizacion).toBeHidden();
  });
  // @end

  await test.step('Verificar que no se envió ni reservó dinero', async () => {
    await page.reload();
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Todavía no hay transferencias' }))
      .toBeVisible();
  });
});
