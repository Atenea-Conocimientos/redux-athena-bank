const { test, expect } = require('@playwright/test');

test('crear una práctica permite iniciar sesión como Ana', async ({ page }) => {
  // Cada test recibe un contexto aislado y crea su propia práctica por la UI.
  // @snippet preparar
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');
  // @end

  // @snippet acceder
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  // @end

  // @snippet comprobar
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Buen día, Ana.');
  await expect(page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }))
    .toBeVisible();
  // @end
});
