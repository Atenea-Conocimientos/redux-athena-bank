const { expect } = require('@playwright/test');

// A small Page Object only for repeated user interactions; assertions stay explicit.
class MarketPage {
  constructor(page) {
    this.page = page;
    this.rate = page.locator('#rate-value');
    this.status = page.locator('#rate-status');
    this.streamStatus = page.locator('#stream-status');
  }
  async open() {
    await this.page.goto('/mercado/');
    await expect(this.page.getByRole('heading', { level: 1 })).toContainText(
      'El mercado no espera.',
    );
  }
  async refresh() {
    await this.page
      .getByRole('button', { name: 'Actualizar tasas', exact: true })
      .click();
  }
  async selectCurrency(code) {
    await this.page.getByLabel('Moneda ficticia').selectOption(code);
  }
  async connect() {
    await this.page
      .getByRole('button', { name: /Conectar en vivo|Reconectar/ })
      .click();
  }
}
module.exports = { MarketPage };
