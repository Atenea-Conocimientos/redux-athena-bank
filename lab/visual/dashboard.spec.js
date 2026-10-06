const { test, expect } = require('../e2e/fixtures');

test('dashboard estable sin diferencias visuales', async ({ page, lab }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Buen día, Ana.' }),
  ).toBeVisible();
  await expect(page).toHaveScreenshot('dashboard.png', {
    fullPage: true,
    animations: 'disabled',
  });
});
