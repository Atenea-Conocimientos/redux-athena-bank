const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');

const url = '/lecciones/crear-practica/';
const directory = path.join(__dirname, '../public/lessons/create-practice');
const read = filename => fs.readFileSync(path.join(directory, filename), 'utf8').replaceAll('\r\n', '\n');
const observe = page => {
  const writes = [], external = [], errors = [];
  page.on('request', request => {
    if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
    if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
  });
  page.on('pageerror', error => errors.push(error.message));
  return () => {
    expect(writes).toEqual([]);
    expect(external).toEqual([]);
    expect(errors).toEqual([]);
  };
};

test('clase 02: voz local, capítulos, pantallas y código real sin modificar el banco', async ({ page }) => {
  const verifyRequests = observe(page);
  const lesson = JSON.parse(read('lesson.json'));
  const snippets = JSON.parse(read('code.json'));
  await page.goto(url);
  await expect(page.locator('body')).toHaveAttribute('data-lesson', 'create-practice');
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#voice-label')).toHaveText(lesson.voiceDisclosure);
  await expect(page.locator('#voice-label')).toContainText('Voz de Juan');
  await expect(page.locator('audio')).toHaveAttribute('src', '/lessons/create-practice/narration.mp3');
  await expect.poll(() => page.locator('audio').evaluate(audio => audio.duration)).toBeGreaterThan(120);
  expect(await page.locator('audio').evaluate(audio => audio.duration)).toBeLessThan(180);
  expect(await page.locator('audio').evaluate(audio => audio.paused)).toBe(true);
  await page.getByRole('button', { name: '▶ Reproducir', exact: true }).click();
  await expect.poll(() => page.locator('audio').evaluate(audio => audio.currentTime)).toBeGreaterThan(0.2);
  await page.getByRole('button', { name: 'Ⅱ Pausar', exact: true }).click();
  expect(await page.locator('audio').evaluate(audio => audio.paused)).toBe(true);

  for (const [index, scene] of lesson.scenes.entries()) {
    const chapter = page.getByRole('button', { name: new RegExp(`^Capítulo ${index + 1}:`) });
    await chapter.click();
    await expect(chapter).toHaveAttribute('aria-current', 'step');
    await expect(page.locator('#chapters [aria-current="step"]')).toHaveCount(1);
    await expect(page.locator('#scene-title')).toHaveText(scene.title);
    await expect(page.locator('#scene-image')).toHaveAttribute('src', `/lessons/create-practice/${scene.image}`);
    await expect(page.locator('#scene-image')).toHaveAttribute('alt', scene.alt);
    await expect(page.locator('#caption')).toHaveText(lesson.subtitles.find(cue => cue.start === scene.start).text);
    await expect.poll(() => page.locator('audio').evaluate(audio => audio.currentTime))
      .toBeCloseTo(scene.start, 1);
    await page.getByRole('button', { name: 'Código Playwright', exact: true }).click();
    await expect(page.locator('#code-view')).toBeVisible();
    const lines = await page.locator('#code .code-line').evaluateAll(rows => rows.map(row =>
      [...row.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('')));
    expect(lines.join('\n')).toBe(snippets[scene.code]);
    const pre = page.locator('#code-view');
    expect(await pre.evaluate(element => element.querySelector('code').getBoundingClientRect().top >= element.getBoundingClientRect().top)).toBe(true);
    await page.getByRole('button', { name: 'Pantalla', exact: true }).click();
    if (scene.output) {
      await expect(page.locator('#output-view')).toHaveText(snippets[scene.output]);
      await expect(page.locator('#output-view')).toBeVisible();
    } else {
      await expect(page.locator('#scene-image')).toBeVisible();
      await expect.poll(() => page.locator('#scene-image').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    }
  }
  await expect(page.locator('#scene-image')).toHaveAttribute('src', '/lessons/create-practice/denied.png');
  await page.getByText('Ver el test completo, paso a paso', { exact: true }).click();
  const source = fs.readFileSync(path.join(__dirname, 'create-practice.spec.js'), 'utf8').replaceAll('\r\n', '\n');
  await expect.poll(() => page.locator('#full-source').textContent()).toBe(source);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  verifyRequests();
});

test('clase 02: quiz, reto y descargas accesibles en escritorio y móvil', async ({ page }) => {
  const verifyRequests = observe(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(url);
  await expect(page.locator('#experience')).toBeVisible();
  await page.getByRole('radio', { name: 'Que el clic terminó sin error.', exact: true }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta ↗' }).click();
  await expect(page.locator('#feedback')).toContainText('Todavía falta evidencia.');
  await page.getByRole('radio', { name: 'Que aparece el saludo de Ana y su cuenta.', exact: true }).check();
  await page.getByRole('button', { name: 'Comprobar respuesta ↗' }).click();
  await expect(page.locator('#feedback')).toContainText('¡Exacto!');
  const hint = page.getByText('Necesito una pista', { exact: true });
  const solution = page.getByText('Ya hice mi intento: ver solución', { exact: true });
  await expect(solution.locator('..')).not.toHaveAttribute('open', '');
  await hint.click();
  await expect(hint.locator('..')).toHaveAttribute('open', '');
  await solution.click();
  await expect(solution.locator('..')).toHaveAttribute('open', '');
  for (const [name, filename] of [
    ['Descargar inicio de clase 02 ↓', 'clase-02-inicio.zip'],
    ['Descargar solución de clase 02 ↓', 'clase-02-solucion.zip'],
    ['Descargar prueba completa ↓', 'create-practice.spec.js'],
  ]) {
    const download = page.waitForEvent('download');
    await page.getByRole('link', { name, exact: true }).click();
    const downloaded = await download;
    expect(downloaded.suggestedFilename()).toBe(filename);
    expect(fs.readFileSync(await downloaded.path())).toEqual(fs.readFileSync(path.join(directory, filename)));
  }
  await page.getByText('Leer la transcripción completa', { exact: true }).click();
  const lesson = JSON.parse(read('lesson.json'));
  for (const scene of lesson.scenes) {
    await expect(page.locator('#transcript')).toContainText(scene.title);
  }
  for (const cue of lesson.subtitles) await expect(page.locator('#transcript')).toContainText(cue.text);
  const chapter = page.getByRole('button', { name: /^Capítulo 3:/ });
  await chapter.focus();
  await page.keyboard.press('Enter');
  await expect(chapter).toHaveAttribute('aria-current', 'step');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  verifyRequests();
});

test('clase 01 continúa hacia la clase 02 con el reproductor listo', async ({ page }) => {
  await page.goto('/lecciones/primera-prueba/');
  await page.getByRole('link', { name: 'Ir a la clase 02 ↗', exact: true }).click();
  await expect(page).toHaveURL(/\/lecciones\/crear-practica\/$/);
  await expect(page.locator('#experience')).toBeVisible();
  await expect(page.locator('#chapters button')).toHaveCount(5);
  await expect(page.getByRole('link', { name: 'Descargar inicio de clase 02 ↓', exact: true }))
    .toHaveAttribute('href', '/lessons/create-practice/clase-02-inicio.zip');
});
