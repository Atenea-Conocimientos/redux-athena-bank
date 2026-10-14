const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const lesson = require('../public/lessons/pending-transfer/lesson.json');
const fs = require('node:fs');
const path = require('node:path');

const url = '/lecciones/transferencia-pendiente/';

test('microlección: voz local, pausa, capítulos, código, velocidad y repetición', async ({
  page,
}) => {
  const writes = [];
  const external = [];
  const errors = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url());
    if (new URL(request.url()).hostname !== '127.0.0.1')
      external.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'transferencia pendiente',
  );
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#voice-label')).toHaveText(lesson.voiceDisclosure);
  expect(await page.locator('audio').evaluate((a) => a.paused)).toBe(true);
  await expect
    .poll(() => page.locator('audio').evaluate((a) => a.duration))
    .toBeGreaterThan(120);
  expect(await page.locator('audio').evaluate((a) => a.duration)).toBeLessThan(
    180,
  );
  await page
    .getByRole('button', { name: '▶ Reproducir', exact: true })
    .click();
  await expect
    .poll(() => page.locator('audio').evaluate((a) => a.currentTime))
    .toBeGreaterThan(0.2);
  await page.getByRole('button', { name: 'Ⅱ Pausar', exact: true }).click();
  expect(await page.locator('audio').evaluate((a) => a.paused)).toBe(true);
  await page.getByRole('button', { name: /^Capítulo 5:/ }).click();
  await expect(page.locator('#scene-title')).toHaveText(
    'Comprobá la cuenta de Ana',
  );
  await expect(page.locator('#code')).toContainText('reserved: 10100');
  await expect(page.locator('#code-view')).toBeVisible();
  await page.getByRole('button', { name: 'Pantalla', exact: true }).click();
  await expect(page.locator('#scene-image')).toBeVisible();
  await page
    .getByRole('button', { name: 'Código Playwright', exact: true })
    .click();
  await expect(page.locator('#caption')).toContainText(
    'consultamos la cuenta de Ana',
  );
  await expect(page.locator('#scene-image')).toHaveAttribute(
    'src',
    /ana\.png$/,
  );
  await page.getByLabel('Velocidad de reproducción').selectOption('1.25');
  expect(await page.locator('audio').evaluate((a) => a.playbackRate)).toBe(
    1.25,
  );
  await page.getByRole('button', { name: 'Silenciar narración' }).click();
  expect(await page.locator('audio').evaluate((a) => a.muted)).toBe(true);
  await page.getByRole('button', { name: 'Mostrar subtítulos' }).click();
  await expect(page.locator('#caption')).not.toBeVisible();
  await page.getByRole('button', { name: 'Mostrar subtítulos' }).click();
  await page
    .getByRole('slider', { name: 'Posición de la lección' })
    .fill(String(Math.floor(lesson.duration - 0.3)));
  await page
    .getByRole('button', { name: '▶ Reproducir', exact: true })
    .click();
  await expect(page.getByRole('button', { name: '↻ Repetir' })).toBeVisible();
  await page.getByRole('button', { name: '↻ Repetir' }).click();
  await expect(page.locator('#scene-title')).toHaveText(
    'Pendiente no es completada',
  );
  await page.getByRole('button', { name: 'Ⅱ Pausar', exact: true }).click();
  expect(writes).toEqual([]);
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('microlección: teclado, transcripción, quiz y accesibilidad responsive', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await expect(page.locator('#experience')).toBeVisible();
  const chapter = page.getByRole('button', { name: /^Capítulo 6:/ });
  await chapter.focus();
  await page.keyboard.press('Enter');
  await expect(chapter).toHaveAttribute('aria-current', 'step');
  await expect(page.locator('#scene-title')).toHaveText(
    'Bruno todavía no cobró',
  );
  await page.getByRole('radio', { name: /Esperar cinco segundos/ }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta ↗' }).click();
  await expect(page.locator('#feedback')).toContainText(
    'Todavía falta evidencia',
  );
  await page.getByRole('radio', { name: /Que Bruno siga teniendo/ }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta ↗' }).click();
  await expect(page.locator('#feedback')).toContainText('¡Exacto!');
  await page
    .getByText('Leer la transcripción completa', { exact: true })
    .click();
  await expect(page.locator('#transcript')).toContainText('contexto separado');
  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar prueba completa ↓' }).click();
  expect((await download).suggestedFilename()).toBe('pending-lesson.spec.js');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('microlección: repo inicial, solución separada y código real completo', async ({ page }) => {
  await page.goto(url);
  await page.getByText('Ver el test completo, paso a paso', { exact: true }).click();
  const source = fs.readFileSync(path.join(__dirname, 'pending-lesson.spec.js'), 'utf8').replaceAll('\r\n', '\n');
  await expect.poll(() => page.locator('#full-source').textContent()).toBe(source);
  await page.getByText('Ya hice mi intento: comparar con la solución', { exact: true }).click();
  const solved = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar proyecto solución (.zip) ↓' }).click();
  expect((await solved).suggestedFilename()).toBe('athena-automation-solucion.zip');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Prepará tu repo y descargá el proyecto inicial ↗' }).click();
  await expect(page).toHaveURL(/\/lecciones\/preparar-repositorio\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tu repo.');
  await expect(page.getByText('1 prueba aprobada y 1 omitida.', { exact: false })).toBeVisible();
  const starter = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Descargar proyecto inicial (.zip) ↓' }).click();
  expect((await starter).suggestedFilename()).toBe('clase-01-inicio.zip');
  await page.getByRole('link', { name: '04 · Clases', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Intentá. Comprobá. Compará.' })).toBeInViewport();
  await page.getByText('Si algo no arranca', { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('microlección: sin audio conserva capítulos, subtítulos y lectura', async ({
  page,
}) => {
  // A real HTTP 404 also reaches WebKit's native media loader (route.abort may not).
  await page.route('**/lesson.json', (route) =>
    route.fulfill({ json: { ...lesson, audio: 'missing.mp3' } }),
  );
  await page.goto(url);
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#load-status')).toContainText(
    'No se pudo cargar la voz',
  );
  await expect(page.locator('#play')).toBeDisabled();
  await page.getByRole('button', { name: /^Capítulo 5:/ }).click();
  await expect(page.locator('#caption')).toContainText(
    'consultamos la cuenta de Ana',
  );
  await expect(page.locator('#code')).toContainText('reserved: 10100');
});
