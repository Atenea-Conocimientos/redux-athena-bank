const { test, expect } = require('@playwright/test');

const casos = [
  { nombre: 'vacío', importe: '' },
  { nombre: 'cero', importe: '0' },
  { nombre: 'negativo', importe: '-1' },
];

for (const caso of casos) {
  // Quitá .skip al implementar. Cada iteración DECLARA un test independiente.
  test.skip(`depósito ${caso.nombre}: conserva ambos saldos`, async ({ page }) => {
    // Crear una práctica estable e iniciar sesión como Ana.
    // Localizar diaria/ahorro y comprobar $2.500,00/$600,00.
    // Abrir Depositar dentro de diaria; comprobar ana-main en el selector.
    // Completar Importe a depositar con caso.importe y enviar.
    // Comprobar validationMessage no vacío, sin depender de su texto/idioma.
    // Comprobar diálogo abierto, campo enfocado y ambos saldos intactos.
  });
}
