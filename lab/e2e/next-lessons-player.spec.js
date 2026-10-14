const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');

const lessons = [
  { number: '04', id: 'invalid-deposit', route: 'depositos-invalidos', previous: 'deposito-en-cuenta' },
  { number: '05', id: 'transfer-quote', route: 'cotizar-transferencia', previous: 'depositos-invalidos' },
  { number: '06', id: 'confirm-transfer', route: 'confirmar-transferencia', previous: 'cotizar-transferencia' },
];

for (const item of lessons) {
  const directory = path.join(__dirname, '../public/lessons', item.id);
  const read = name => fs.readFileSync(path.join(directory, name), 'utf8').replaceAll('\r\n', '\n');
  test(`clase ${item.number}: audio, escenas y código reales sin efectos bancarios`, async ({ page }) => {
    const errors = [], external = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (new URL(request.url()).hostname !== '127.0.0.1') external.push(request.url());
      if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.url());
    });
    const lesson = JSON.parse(read('lesson.json'));
    const snippets = JSON.parse(read('code.json'));
    await page.goto(`/lecciones/${item.route}/`);
    await expect(page.locator('body')).toHaveAttribute('data-lesson', item.id);
    await expect(page.locator('#experience')).toBeVisible();
    await expect(page.locator('#voice-label')).toHaveText(lesson.voiceDisclosure);
    await expect(page.locator('audio')).toHaveAttribute('src', `/lessons/${item.id}/narration.mp3`);
    await expect.poll(() => page.locator('audio').evaluate(a => a.duration)).toBeGreaterThan(120);
    expect(await page.locator('audio').evaluate(a => a.duration)).toBeLessThan(181);
    expect(await page.locator('audio').evaluate(a => a.paused)).toBe(true);
    await page.getByRole('button', { name: '▶ Reproducir', exact: true }).click();
    await expect.poll(() => page.locator('audio').evaluate(a => a.currentTime)).toBeGreaterThan(0.2);
    await page.getByRole('button', { name: 'Ⅱ Pausar', exact: true }).click();
    for (const [index, scene] of lesson.scenes.entries()) {
      const chapter = page.getByRole('button', { name: new RegExp(`^Capítulo ${index + 1}:`) });
      await chapter.click();
      await expect(chapter).toHaveAttribute('aria-current', 'step');
      await expect(page.locator('#chapters [aria-current="step"]')).toHaveCount(1);
      await expect(page.locator('#scene-title')).toHaveText(scene.title);
      await expect(page.locator('#caption')).toHaveText(lesson.subtitles.find(c => c.start === scene.start).text);
      await expect.poll(() => page.locator('audio').evaluate(a => a.currentTime)).toBeCloseTo(scene.start, 1);
      await page.getByRole('button', { name: 'Código Playwright', exact: true }).click();
      const codeView = page.locator('#code-view');
      await expect(codeView).toBeVisible();
      const lines = await page.locator('#code .code-line').evaluateAll(rows => rows.map(row =>
        [...row.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent).join('')));
      expect(lines.join('\n')).toBe(snippets[scene.code]);
      const layout = await codeView.evaluate(e => ({
        h: e.clientHeight, sh: e.scrollHeight, w: e.clientWidth, sw: e.scrollWidth,
        topVisible: e.querySelector('code').getBoundingClientRect().top >= e.getBoundingClientRect().top,
      }));
      expect(layout.topVisible, `${scene.id}: first code line`).toBe(true);
      expect(layout.sh, `${scene.id}: full code height`).toBeLessThanOrEqual(layout.h);
      expect(layout.sw, `${scene.id}: full code width`).toBeLessThanOrEqual(layout.w);
      await page.getByRole('button', { name: 'Pantalla', exact: true }).click();
      await expect(page.locator('#scene-image')).toHaveAttribute('src', `/lessons/${item.id}/${scene.image}`);
      await expect(page.locator('#scene-image')).toHaveAttribute('alt', scene.alt);
      await expect.poll(() => page.locator('#scene-image').evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
      if (page.viewportSize().width <= 760) {
        expect(await page.locator('#screen-view').evaluate(e => e.clientHeight)).toBeLessThanOrEqual(280);
      }
    }
    await page.getByText('Ver el test completo, paso a paso', { exact: true }).click();
    await expect(page.locator('#full-source')).toHaveText(read(`${item.id}.spec.js`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
    expect(writes).toEqual([]);
  });

  test(`clase ${item.number}: quiz, reto, descargas y accesibilidad`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`/lecciones/${item.route}/`);
    await expect(page.locator('#experience')).toBeVisible();
    const quiz = page.locator('#quiz');
    const correct = await quiz.getAttribute('data-correct');
    const success = await quiz.getAttribute('data-success');
    const retry = await quiz.getAttribute('data-retry');
    expect(correct).toBeTruthy();
    const options = await quiz.getByRole('radio').all();
    let right, wrong;
    for (const option of options) {
      if (await option.getAttribute('value') === correct) right = option;
      else wrong = option;
    }
    expect(right && wrong).toBeTruthy();
    await wrong.check();
    await quiz.getByRole('button').click();
    await expect(page.locator('#feedback')).toHaveText(retry);
    await right.check();
    await quiz.getByRole('button').click();
    await expect(page.locator('#feedback')).toHaveText(success);
    const solution = page.getByText('Ya hice mi intento: ver solución', { exact: true });
    await expect(solution.locator('..')).not.toHaveAttribute('open', '');
    await page.getByText('Necesito una pista', { exact: true }).click();
    await solution.click();
    await expect(solution.locator('..')).toHaveAttribute('open', '');
    for (const filename of [`clase-${item.number}-inicio.zip`, `clase-${item.number}-solucion.zip`,
      `${item.id}.spec.js`, `${item.id}-challenge.spec.js`]) {
      const downloading = page.waitForEvent('download');
      await page.locator(`a[download][href="/lessons/${item.id}/${filename}"]`).click();
      const download = await downloading;
      expect(download.suggestedFilename()).toBe(filename);
      expect(fs.readFileSync(await download.path())).toEqual(fs.readFileSync(path.join(directory, filename)));
    }
    await page.getByText('Leer la transcripción completa', { exact: true }).click();
    for (const cue of JSON.parse(read('lesson.json')).subtitles) {
      await expect(page.locator('#transcript')).toContainText(cue.text);
    }
    const chapter = page.getByRole('button', { name: /^Capítulo 3:/ });
    await chapter.focus();
    await page.keyboard.press('Enter');
    await expect(chapter).toHaveAttribute('aria-current', 'step');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });

  test(`clase ${item.number}: continuidad desde la anterior`, async ({ page }) => {
    await page.goto(`/lecciones/${item.previous}/`);
    await page.getByRole('link', { name: `Ir a la clase ${item.number} ↗`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/lecciones/${item.route}/$`));
    await expect(page.locator('#experience')).toBeVisible();
    await expect(page.locator('#chapters button')).toHaveCount(5);
  });
}
