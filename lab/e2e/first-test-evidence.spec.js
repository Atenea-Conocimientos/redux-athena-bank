const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('primera prueba: captura de bienvenida y diagnóstico real de una expectativa incorrecta', async ({ page }) => {
  const writes = [];
  page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
  await page.goto('/');
  const titulo = page.getByRole('heading', { level: 1 });
  await expect(titulo).toHaveText('Aprendé a probar lo que importa.');
  if (process.env.FIRST_LESSON_CAPTURE_DIR) {
    await page.locator('.welcome-grid').screenshot({
      path: path.join(process.env.FIRST_LESSON_CAPTURE_DIR, 'welcome.png'), animations: 'disabled',
    });
  }
  let diagnostic;
  try {
    // @snippet incorrecto
    await expect(titulo).toHaveText('Bienvenido al banco', { timeout: 1000 });
    // @end
  } catch (error) {
    diagnostic = error.message.replace(/\u001b\[[0-9;]*m/g, '');
  }
  // Fail the evidence test if the intentional mismatch stops failing for the expected reason.
  expect(diagnostic).toContain('Expected: "Bienvenido al banco"');
  expect(diagnostic).toContain('Received: "Aprendé a probar lo que importa."');
  if (process.env.FIRST_LESSON_CAPTURE_DIR) {
    // Keep the actual assertion diagnostic, without absolute machine paths or stack traces.
    fs.writeFileSync(path.join(process.env.FIRST_LESSON_CAPTURE_DIR, 'failure.txt'), diagnostic + '\n');
  }
  expect(writes).toEqual([]);
});
