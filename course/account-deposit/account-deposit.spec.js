const { test, expect } = require('@playwright/test');

// Quitá .skip cuando empieces. Este archivo todavía no implementa el ejercicio.
test.skip('depositar en la cuenta diaria no modifica el fondo de ahorro', async ({ page }) => {
  // 1. Crear una práctica estable e iniciar sesión como Ana (pasos de clase 02).
  // 2. Localizar las regiones exactas 'Cuenta ana.diaria' y 'Cuenta ana.ahorro'.
  // 3. Comprobar sus saldos iniciales: '$ 2.500,00' y '$ 600,00'.
  // 4. Hacer clic en 'Depositar', pero solo dentro de la cuenta diaria.
  // 5. En 'Ingresar fondos ficticios', comprobar 'Cuenta para depósito': 'ana-main'.
  // 6. Completar 'Importe a depositar' con '100' y pulsar 'Depositar fondos'.
  // 7. Esperar que el diálogo se oculte y comprobar '$ 2.600,00' en la diaria.
  // 8. Comprobar que el ahorro siga en '$ 600,00'.
});
