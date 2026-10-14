const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.use(process.env.QUOTE_LESSON_CAPTURE_DIR
  ? { deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } } : {});

async function capture(page, name) {
  if (process.env.QUOTE_LESSON_CAPTURE_DIR) {
    await page.screenshot({
      path: path.join(process.env.QUOTE_LESSON_CAPTURE_DIR, name),
      animations: 'disabled',
    });
  }
}

async function abrirPractica(page) {
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu sesión de práctica');
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Buen día, Ana.');
}

for (const scenario of [
  { title: 'externa', alias: 'bruno.diaria', fee: '$ 1,00', total: '$ 101,00', image: 'quote.png' },
  { title: 'propia', alias: 'ana.ahorro', fee: '$ 0,00', total: '$ 100,00', image: 'challenge.png' },
]) {
  test(`cotización: evidencia ${scenario.title} sin transferencia`, async ({ page }) => {
    await abrirPractica(page);
    const diaria = page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true });
    const ahorro = page.getByRole('region', { name: 'Cuenta ana.ahorro', exact: true });
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
    if (scenario.title === 'externa') {
      await page.getByRole('heading', { name: 'Todavía no hay transferencias' }).scrollIntoViewIfNeeded();
      await capture(page, 'before.png');
    }
    await page.getByRole('button', { name: 'Transferir ↗', exact: true }).click();
    const formulario = page.getByRole('dialog', { name: 'Nueva transferencia' });
    await formulario.getByLabel('Cuenta de origen').selectOption('ana-main');
    await formulario.getByLabel('Alias de destino').fill(scenario.alias);
    await formulario.getByLabel('Importe a transferir').fill('100');
    if (scenario.title === 'externa') await capture(page, 'form.png');
    await formulario.getByRole('button', { name: 'Revisar transferencia' }).click();
    const cotizacion = page.getByRole('dialog', { name: 'Confirmar transferencia' });
    await expect(cotizacion.getByText(scenario.alias, { exact: true })).toBeVisible();
    await expect(cotizacion.getByRole('term')).toHaveText(['Importe', 'Comisión', 'Total a reservar']);
    await expect(cotizacion.getByRole('definition'))
      .toHaveText(['$ 100,00', scenario.fee, scenario.total]);
    await capture(page, scenario.image);
    await cotizacion.getByRole('button', { name: 'Cerrar diálogo' }).click();
    await expect(cotizacion).toBeHidden();
    await page.reload();
    await expect(diaria.getByText('$ 2.500,00', { exact: true })).toBeVisible();
    await expect(ahorro.getByText('$ 600,00', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Todavía no hay transferencias' })).toBeVisible();
    if (scenario.title === 'externa') {
      await page.getByRole('heading', { name: 'Todavía no hay transferencias' }).scrollIntoViewIfNeeded();
      await capture(page, 'after.png');
    }
  });
}
