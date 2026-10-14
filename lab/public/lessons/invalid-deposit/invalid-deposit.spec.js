const { test, expect } = require('@playwright/test');

// @snippet datos
const casos = [
  { nombre: 'vacío', importe: '' },
  { nombre: 'cero', importe: '0' },
  { nombre: 'negativo', importe: '-1' },
];

for (const caso of casos) {
  test(`depósito ${caso.nombre}: conserva ambos saldos`, async ({ page }) => {
    // @end
    // Cada test tiene su propia práctica; no comparte saldo ni sesión.
    await page.goto('/');
    await page.getByLabel('Perfil del ejercicio').selectOption('stable');
    await page.getByRole('button', { name: 'Crear mi práctica' }).click();
    await expect(page.getByRole('heading', { level: 1 }))
      .toHaveText('Tu sesión de práctica');
    await page.getByLabel('Email ficticio').fill('ana@demo.test');
    await page.getByLabel('Contraseña de práctica').fill('Practica2026!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByRole('heading', { level: 1 }))
      .toHaveText('Buen día, Ana.');
    const cuentaDiaria = page.getByRole('region', {
      name: 'Cuenta ana.diaria', exact: true,
    });
    const cuentaAhorro = page.getByRole('region', {
      name: 'Cuenta ana.ahorro', exact: true,
    });
    await expect(cuentaDiaria.getByText('$ 2.500,00', { exact: true }))
      .toBeVisible();
    await expect(cuentaAhorro.getByText('$ 600,00', { exact: true }))
      .toBeVisible();
    await cuentaDiaria.getByRole('button', {
      name: 'Depositar', exact: true,
    }).click();
    const dialogo = page.getByRole('dialog', {
      name: 'Ingresar fondos ficticios',
    });
    await expect(dialogo.getByLabel('Cuenta para depósito'))
      .toHaveValue('ana-main');

    // @snippet validacion
    const importe = dialogo.getByLabel('Importe a depositar');
    await expect(importe).toHaveAttribute('min', '0.01');
    await importe.fill(caso.importe);
    await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
    await expect(importe).not.toHaveJSProperty('validationMessage', '');
    // @end

    // @snippet comprobar
    await expect(dialogo).toBeVisible();
    await expect(importe).toBeFocused();
    await expect(cuentaDiaria.getByText('$ 2.500,00', { exact: true }))
      .toBeVisible();
    await expect(cuentaAhorro.getByText('$ 600,00', { exact: true }))
      .toBeVisible();
    // @end
  });
}
