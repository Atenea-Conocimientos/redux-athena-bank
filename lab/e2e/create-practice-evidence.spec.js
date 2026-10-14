const { test, expect } = require('@playwright/test');
const path = require('node:path');

test.use(process.env.PRACTICE_LESSON_CAPTURE_DIR
  ? { deviceScaleFactor: 2, viewport: { width: 1280, height: 800 } } : {});

// Capture helpers belong to the evidence harness; the student's reference stays small.
async function capture(page, name) {
  if (process.env.PRACTICE_LESSON_CAPTURE_DIR) {
    await page.screenshot({
      path: path.join(process.env.PRACTICE_LESSON_CAPTURE_DIR, name),
      animations: 'disabled',
    });
  }
}

test('crear práctica: evidencia de bienvenida, acceso y cuenta visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Aprendé a probar lo que importa.');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await capture(page, 'welcome.png');

  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');
  await capture(page, 'login.png');

  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Buen día, Ana.');
  await expect(page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }))
    .toBeVisible();
  await capture(page, 'dashboard.png');
});

test('crear práctica: evidencia de acceso rechazado en una práctica independiente', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Perfil del ejercicio').selectOption('stable');
  await page.getByRole('button', { name: 'Crear mi práctica' }).click();
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');
  await page.getByLabel('Email ficticio').fill('ana@demo.test');
  await page.getByLabel('Contraseña de práctica').fill('ClaveIncorrecta!');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('alert'))
    .toHaveText('Email o contraseña incorrectos.');
  await expect(page.getByRole('heading', { level: 1 }))
    .toHaveText('Tu sesión de práctica');
  await expect(page.getByRole('region', { name: 'Cuenta ana.diaria', exact: true }))
    .toHaveCount(0);
  // Capture the viewport, including the actual alert outside the login <main>.
  await capture(page, 'denied.png');
});
