const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.use(process.env.CONFIRM_LESSON_CAPTURE_DIR
  ? { deviceScaleFactor: 2, viewport: { width: 1280, height: 920 } } : {});

async function capturar(page, name) {
  if (process.env.CONFIRM_LESSON_CAPTURE_DIR) {
    await page.screenshot({
      path: path.join(process.env.CONFIRM_LESSON_CAPTURE_DIR, name),
      animations: 'disabled',
    });
  }
}

async function cotizar(page) {
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu sesión de práctica');
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buen día, Ana.');
  await expect(page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }))
    .toContainText('$ 2.500,00');
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.getByRole('button', { name: 'Transferir ↗', exact: true }).click();
  const formulario = page.getByRole('dialog', { name: 'Nueva transferencia', exact: true });
  await formulario.getByLabel('Cuenta de origen').selectOption('ana-main');
  await formulario.getByLabel('Alias de destino').fill('bruno.diaria');
  await formulario.getByLabel('Importe a transferir').fill('100');
  await formulario.getByRole('button', { name: 'Revisar transferencia' }).click();
  const confirmacion = page.getByRole('dialog', { name: 'Confirmar transferencia', exact: true });
  for (const texto of ['bruno.diaria', '$ 100,00', '$ 1,00', '$ 101,00']) {
    await expect(confirmacion.getByText(texto, { exact: true })).toBeVisible();
  }
  return confirmacion;
}

test('confirmación: evidencia visual de cotización, pendiente y reserva', async ({ page }) => {
  const confirmacion = await cotizar(page);
  await confirmacion.getByLabel('Código de confirmación ficticio').fill('246810');
  await capturar(page, 'quote.png');
  await confirmacion.getByRole('button', { name: 'Confirmar y reservar' }).click();
  await expect(confirmacion).toBeHidden();
  await expect(page.getByRole('article')).toHaveCount(1);
  const operacion = page.getByRole('article', { name: /^Transferencia bruno\.diaria / });
  await expect(operacion.getByRole('heading')).toHaveText('$ 100,00 Pendiente');
  await expect(operacion).toContainText('Comisión $ 1,00 · Total $ 101,00');
  await capturar(page, 'pending.png');
  await page.goto('/');
  const diaria = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
  const ahorro = page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true });
  await expect(diaria.getByText('$ 2.399,00', { exact: true })).toBeVisible();
  await expect(diaria).toContainText('disponibles · $ 101,00 reservados');
  await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
  await expect(page.getByTestId('available-total')).toHaveText('$ 2.999,00');
  await expect(page.getByText('Saldo contable $ 3.100,00', { exact: true })).toBeVisible();
  await expect(page.getByText('Reservado $ 101,00', { exact: true })).toBeVisible();
  await capturar(page, 'balances.png');
});

test('confirmación: evidencia visual de código incorrecto sin efectos', async ({ page }) => {
  const confirmacion = await cotizar(page);
  await confirmacion.getByLabel('Código de confirmación ficticio').fill('000000');
  await confirmacion.getByRole('button', { name: 'Confirmar y reservar' }).click();
  await expect(confirmacion.getByRole('alert')).toContainText('incorrecto');
  await expect(confirmacion).toBeVisible();
  await capturar(page, 'rejected.png');
  await confirmacion.getByRole('button', { name: 'Cerrar diálogo' }).click();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buen día, Ana.');
  await expect(page.getByRole('article')).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }))
    .toContainText('$ 2.500,00');
  await expect(page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true }))
    .toContainText('$ 600,00');
  await expect(page.getByText('Reservado $ 0,00', { exact: true })).toBeVisible();
  await expect(page.getByTestId('available-total')).toHaveText('$ 3.100,00');
});
