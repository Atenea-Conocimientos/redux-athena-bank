const { test, expect } = require('@playwright/test');

// Quitá .skip para empezar: omitido no significa aprobado.
test.skip('confirmar una transferencia reserva fondos y mantiene el estado pendiente', async ({ page }) => {
  // 1. Crear una práctica estable nueva e iniciar sesión como Ana, por UI.
  // 2. Comprobar diaria $2.500, ahorro $600, ninguna transferencia ni reserva.
  // 3. Cotizar 100 desde ana-main hacia bruno.diaria; comisión 1 y total 101.
  // 4. Dentro de Confirmar transferencia, completar código ficticio 246810.
  // 5. Pulsar Confirmar y reservar; esperar el cierre con toBeHidden().
  // 6. Comprobar un solo article, acotarlo por alias y verificar sus valores.
  // 7. Volver a /: diaria disponible 2.399 y reservado 101; ahorro 600.
  // 8. Resumen: contable 3.100, reservado 101 y disponible 2.999.
  // 9. No pulsar Procesar ni afirmar que se comprobó la sesión de Bruno.
});
