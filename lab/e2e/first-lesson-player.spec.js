const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');
const url = '/lecciones/primera-prueba/';

test('clase inicial: voz, código completo y diagnóstico real sin modificar el banco', async ({ page }) => {
  const writes = [], external = [], errors = [];
  page.on('request', request => {
    if (request.method() !== 'GET') writes.push(request.url());
    if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#voice-label')).toContainText('Voz de Juan');
  await expect.poll(() => page.locator('audio').evaluate(a => a.duration)).toBeGreaterThan(120);
  expect(await page.locator('audio').evaluate(a => a.paused)).toBe(true);
  await page.getByRole('button', { name: '▶ Reproducir', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate(a => a.currentTime)).toBeGreaterThan(0.2);
  await page.getByRole('button', { name: 'Ⅱ Pausar', exact: true }).click();
  await page.getByRole('button', { name: /^Capítulo 2:/ }).click();
  await expect(page.locator('#code-view')).toBeVisible();
  await expect(page.locator('#code')).toContainText("require('@playwright/test')");
  await expect(page.locator('#code')).toContainText('await page.goto');
  await page.getByRole('button', { name: /^Capítulo 3:/ }).click();
  await expect(page.locator('#code .active').last()).toContainText('toBeEnabled');
  // All 18 lines must be reachable; no clipped top from vertically centered overflow.
  const pre = page.locator('#code-view');
  expect(await pre.evaluate(el => el.querySelector('code').getBoundingClientRect().top >= el.getBoundingClientRect().top)).toBe(true);
  await page.getByRole('button', { name: /^Capítulo 4:/ }).click();
  await expect(page.locator('#output-view')).toBeVisible();
  await expect(page.locator('#output-view')).toContainText('Expected: "Bienvenido al banco"');
  await expect(page.locator('#output-view')).toContainText('Received: "Aprendé a probar lo que importa."');
  await page.getByRole('button', { name: 'Código Playwright', exact: true }).click();
  await expect(page.locator('#code')).toContainText('timeout: 1000');
  await expect(page.locator('#output-view')).toBeHidden();
  await page.getByRole('button', { name: /^Capítulo 5:/ }).click();
  await expect(page.locator('#output-view')).toContainText('passed');
  await page.getByText('Ver el test completo, paso a paso', { exact: true }).click();
  const source = fs.readFileSync(path.join(__dirname, 'first-test.spec.js'), 'utf8').replaceAll('\r\n', '\n');
  await expect.poll(() => page.locator('#full-source').textContent()).toBe(source);
  expect(writes).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('clase inicial: reto, descargas, Paso 0 y accesibilidad', async ({ page }) => {
  await page.goto(url);
  await expect(page.locator('#experience')).toBeVisible();
  await page.getByRole('radio', { name: 'Que el botón está visible y habilitado.' }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta ↗' }).click();
  await expect(page.locator('#feedback')).toContainText('Todavía no.');
  await page.getByRole('radio', { name: 'Define cómo encontrarlo; todavía no comprobó su estado.' }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta ↗' }).click();
  await expect(page.locator('#feedback')).toContainText('¡Exacto!');
  await page.getByText('Necesito una pista', { exact: true }).click();
  await page.getByText('Ya hice mi intento: ver solución', { exact: true }).click();
  for (const [name, filename] of [
    ['Descargar inicio de clase 01 ↓', 'clase-01-inicio.zip'],
    ['Descargar solución de clase 01 ↓', 'clase-01-solucion.zip'],
    ['Descargar prueba completa ↓', 'first-test.spec.js'],
  ]) {
    const download = page.waitForEvent('download');
    await page.getByRole('link', { name, exact: true }).click();
    expect((await download).suggestedFilename()).toBe(filename);
  }
  await page.getByText('Leer la transcripción completa', { exact: true }).click();
  await expect(page.locator('#transcript')).toContainText('Expected');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Ir al Paso 0 ↗' }).click();
  await expect(page.getByRole('link', { name: 'Descargar proyecto inicial (.zip) ↓' })).toHaveAttribute('href', '/lessons/first-test/clase-01-inicio.zip');
  await page.getByRole('link', { name: 'Empezar la clase 01 ↗' }).click();
  await expect(page).toHaveURL(/\/lecciones\/primera-prueba\/$/);
});
