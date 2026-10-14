const { test, expect } = require('@playwright/test');

// Quitá .skip al empezar. Cada test debe crear su propia práctica estable.
test.skip('cotizar hacia Bruno muestra los costos sin reservar ni transferir', async ({ page }) => {
  // 1. Crear práctica estable e iniciar sesión como Ana (clase 02).
  // 2. Verificar diaria '$ 2.500,00', ahorro '$ 600,00' y que no haya transferencias.
  // 3. En un test.step, abrir Transferir y el diálogo Nueva transferencia.
  // 4. Elegir origen 'ana-main', alias 'bruno.diaria' e importe '100'.
  // 5. Pulsar Revisar transferencia y localizar el diálogo Confirmar transferencia.
  // 6. Verificar destino, conceptos y valores: importe100 / comisión1 / total101.
  // 7. Cerrar sin completar código ni confirmar. Recargar la página.
  // 8. Verificar los saldos originales y que todavía no haya transferencias.
});
