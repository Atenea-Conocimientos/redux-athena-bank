# Clase 05 · Cotizar antes de confirmar

Continuá desde clase 04 con el banco local encendido en `http://127.0.0.1:4177`.
Lección: <http://127.0.0.1:4177/lecciones/cotizar-transferencia/>.

## Objetivo

Cotizar $100 desde `ana.diaria` hacia `bruno.diaria`, comprobar importe $100,
comisión $1 y total a reservar $101. Cerrar **sin confirmar**, recargar y comprobar:
diaria $2.500, ahorro $600 y ninguna transferencia. Cotizar no reserva dinero.

Cada caso crea una práctica estable nueva por la UI e inicia sesión como Ana con
las credenciales públicas ficticias `ana@demo.test` / `Practica2026!`.
No reutilices datos de otro test ni credenciales reales.

## Continuar en tu repositorio

1. Revisá `git status` en la rama donde completaste clase 04. Guardá sus cambios
   si los hay (`git add tests`, `git commit -m "test: completar la clase 04"`).
2. Creá `git switch -c clase/05-cotizar-transferencia` desde esa rama.
3. Copiá el ejercicio a `tests/transfer-quote.spec.js`, quitá `.skip` y completalo.
4. Agrupá preparación, cotización, desglose y cierre con `await test.step(...)`.
5. Ejecutá `npx playwright test transfer-quote.spec.js --headed` y `npm run report`.

Si usás el ZIP completo en otra carpeta: `npm ci` y
`npx playwright install chromium`. El banco es una aplicación aparte y debe seguir
encendido. No copies `node_modules`, `.git`, sesiones o `.env` entre repositorios.

## Qué aprender

- Localizar el formulario y la cotización por el nombre de su diálogo.
- Usar `getByLabel` y `selectOption` para elegir un origen conocido.
- Agrupar acciones con `test.step` y leer los pasos del reporte; cada step sigue
  dentro del mismo test, no tiene una sesión nueva.
- Comprobar listas ordenadas de conceptos (`term`) y valores (`definition`) con
  `toHaveText([...])`: detecta también elementos faltantes o extra.
- Cerrar y recargar antes de comprobar el estado persistido. No usar pausas fijas.

## Reto independiente

En `tests/transfer-quote-challenge.spec.js`, cotizá $100 hacia `ana.ahorro` desde
`ana.diaria`. Debe mostrar **comisión $0 y total $100**. Cerrá sin confirmar,
recargá y comprobá diaria $2.500, ahorro $600 y ninguna transferencia.

No completes el código de confirmación ni pulses `Confirmar y reservar`.
Cerrar esta cotización no equivale a cancelar una transferencia pendiente.

## Conteos esperados

- Inicio sin editar: **11 passed / 1 skipped** (omisión didáctica intencional).
- Caso principal completo: **12 passed**.
- Principal y reto: **13 passed**.

Los once previos incluyen las clases anteriores y sus retos resueltos.
Consultá la solución después del intento y extraela en otra carpeta.

Referencias: [test.step](https://playwright.dev/docs/api/class-test#test-step),
[toHaveText](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-text).
