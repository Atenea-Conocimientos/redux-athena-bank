const { test, expect } = require('@playwright/test');

test('confirmar una transferencia reserva fondos y mantiene el estado pendiente', async ({ page }) => {
  // Cada test empieza con su propia práctica. No se usan API ni otra sesión.
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
  await expect(page.getByText('Reservado $ 0,00', { exact: true })).toBeVisible();

  // Cotización aprendida en clase 05: todavía no crea la operación.
  await page.getByRole('button', { name: 'Transferir ↗', exact: true }).click();
  const formulario = page.getByRole('dialog', { name: 'Nueva transferencia', exact: true });
  await formulario.getByLabel('Cuenta de origen').selectOption('ana-main');
  await formulario.getByLabel('Alias de destino').fill('bruno.diaria');
  await formulario.getByLabel('Importe a transferir').fill('100');
  await formulario.getByRole('button', { name: 'Revisar transferencia' }).click();
  const confirmacion = page.getByRole('dialog', { name: 'Confirmar transferencia', exact: true });
  await expect(confirmacion.getByText('bruno.diaria', { exact: true })).toBeVisible();
  await expect(confirmacion.getByText('$ 100,00', { exact: true })).toBeVisible();
  await expect(confirmacion.getByText('$ 1,00', { exact: true })).toBeVisible();
  await expect(confirmacion.getByText('$ 101,00', { exact: true })).toBeVisible();

  // @snippet confirmar
  await confirmacion.getByLabel('Código de confirmación ficticio')
    .fill('246810');
  await confirmacion.getByRole('button', {
    name: 'Confirmar y reservar',
  }).click();
  await expect(confirmacion).toBeHidden();
  // @end

  // @snippet operacion
  await expect(page.getByRole('article')).toHaveCount(1);
  const operacion = page.getByRole('article', {
    name: /^Transferencia bruno\.diaria /,
  });
  await expect(operacion.getByRole('heading'))
    .toHaveText('$ 100,00 Pendiente');
  await expect(operacion.getByText('Comisión $ 1,00 · Total $ 101,00', {
    exact: true,
  })).toBeVisible();
  // @end

  // @snippet saldos
  await page.goto('/');
  await expect(diaria.getByText('$ 2.399,00', { exact: true })).toBeVisible();
  await expect(diaria).toContainText('disponibles · $ 101,00 reservados');
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await expect(page.getByTestId('available-total')).toHaveText('$ 2.999,00');
  await expect(page.getByText('Saldo contable $ 3.100,00', { exact: true }))
    .toBeVisible();
  await expect(page.getByText('Reservado $ 101,00', { exact: true }))
    .toBeVisible();
  // @end

  // Sigue pendiente también después de recargar el resumen. No pulsamos Procesar.
  await expect(operacion.getByRole('heading')).toHaveText('$ 100,00 Pendiente');
  // No afirmamos haber comprobado el saldo del receptor: este caso solo observa Ana.
});
