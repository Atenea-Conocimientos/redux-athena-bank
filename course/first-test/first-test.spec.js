const { test, expect } = require('@playwright/test');

// Quitá .skip cuando empieces. Todavía no hay una solución implementada.
test.skip('la bienvenida permite iniciar una práctica', async ({ page }) => {
  // 1. Abrir la raíz de la aplicación usando la baseURL configurada.
  // 2. Localizar el encabezado principal por rol y nivel.
  // 3. Comprobar: "Aprendé a probar lo que importa."
  // 4. Localizar "Crear mi práctica" por rol de botón y nombre accesible.
  // 5. Comprobar que esté visible y habilitado, sin hacer clic.
});
