const { test, expect } = require('@playwright/test');

test('la bienvenida permite iniciar una práctica', async ({ page }) => {
  // @snippet navegar
  await page.goto('/');
  // @end

  // @snippet titulo
  const titulo = page.getByRole('heading', { level: 1 });
  await expect(titulo).toHaveText('Aprendé a probar lo que importa.');
  // @end

  // @snippet boton
  const crearPractica = page.getByRole('button', { name: 'Crear mi práctica' });
  await expect(crearPractica).toBeVisible();
  await expect(crearPractica).toBeEnabled();
  // @end
});
