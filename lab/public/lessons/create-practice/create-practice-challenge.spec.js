const { test, expect } = require('@playwright/test');

test('una contraseña incorrecta mantiene cerrada la cuenta de Ana', async ({ page }) => {
  // Este caso funciona solo: no depende de la práctica ni de la sesión de otro test.
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');

  // @snippet rechazo
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('ClaveIncorrecta!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('alert'))
    .toHaveText('Email o contraseña incorrectos.');
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');
  await expect(page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }))
    .toHaveCount(0);
  // @end
});
