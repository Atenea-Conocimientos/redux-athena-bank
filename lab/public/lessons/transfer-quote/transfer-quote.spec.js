const { test, expect } = require('@playwright/test');

test('cotizar hacia Bruno muestra los costos sin reservar ni transferir', async ({ page }) => {
  // Preparación aprendida en clase 02: práctica estable independiente por test.
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu sesión de práctica');
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buen día, Ana.');

  // @snippet preparar
  const diaria = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
  const ahorro = page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true });
  await test.step('Comprobar los saldos iniciales', async () => {
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Todavía no hay transferencias' }))
      .toBeVisible();
  });
  // @end

  // @snippet formulario
  await test.step('Solicitar la cotización a Bruno', async () => {
    await page.getByRole('button', { name: 'Transferir ↗', exact: true }).click();
    const formulario = page.getByRole('dialog', { name: 'Nueva transferencia' });
    await formulario.getByLabel('Cuenta de origen').selectOption('ana-main');
    await formulario.getByLabel('Alias de destino').fill('bruno.diaria');
    await formulario.getByLabel('Importe a transferir').fill('100');
    await formulario.getByRole('button', { name: 'Revisar transferencia' }).click();
  });
  // @end

  const cotizacion = page.getByRole('dialog', { name: 'Confirmar transferencia' });
  // @snippet desglose
  await test.step('Comprobar destino y desglose', async () => {
    await expect(cotizacion.getByText('bruno.diaria', { exact: true })).toBeVisible();
    await expect(cotizacion.getByRole('term')).toHaveText([
      'Importe', 'Comisión', 'Total a reservar',
    ]);
    await expect(cotizacion.getByRole('definition')).toHaveText([
      '$ 100,00', '$ 1,00', '$ 101,00',
    ]);
  });
  // @end

  // @snippet cancelar
  await test.step('Cerrar sin confirmar conserva el estado', async () => {
    await cotizacion.getByRole('button', { name: 'Cerrar diálogo' }).click();
    await expect(cotizacion).toBeHidden();
    await page.reload();
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Todavía no hay transferencias' }))
      .toBeVisible();
  });
  // @end
});
