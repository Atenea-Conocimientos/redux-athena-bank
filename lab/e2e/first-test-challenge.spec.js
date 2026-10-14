const { test, expect } = require('@playwright/test');

test('el perfil inicial es estable sin crear una práctica', async ({ page }) => {
  await page.goto('/');
  // @snippet reto
  const perfil = page.getByLabel('Perfil del ejercicio');
  await expect(perfil).toHaveValue('stable');
  await expect(perfil.locator('option:checked'))
    .toHaveText('Estable · comportamiento esperado');
  // @end
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Aprendé a probar lo que importa.');
});
