const { test, expect } = require('@playwright/test');

// Quitá .skip cuando empieces. Este archivo todavía no implementa el ejercicio.
test.skip('crear una práctica permite iniciar sesión como Ana', async ({ page }) => {
  // 1. Abrir '/' y elegir 'stable' en 'Perfil del ejercicio'.
  // 2. Hacer clic en 'Crear mi práctica'.
  // 3. Comprobar el h1: 'Tu sesión de práctica'.
  // 4. Completar 'Email ficticio' con 'ana@demo.test'.
  // 5. Completar 'Contraseña de práctica' con la clave pública 'Practica2026!'.
  // 6. Hacer clic en 'Iniciar sesión'.
  // 7. Comprobar el h1: 'Buen día, Ana.'.
  // 8. Comprobar que la región exacta 'Cuenta ana.diaria' esté visible.
});
