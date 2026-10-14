# Clase 04 · Depósitos inválidos y pruebas parametrizadas

Lección: <http://127.0.0.1:4177/lecciones/depositos-invalidos/>.
Continuá desde la clase 03 resuelta. Banco y tests son proyectos distintos.
El banco debe estar encendido en 4177; Node.js 24+, Git y Chromium instalados.
Solo usamos cuentas, dinero y credenciales ficticios públicos.

## Preparar tu repositorio

Guardá los cambios de la clase 03 antes de crear la rama. No reinicialices Git.

```sh
git status
git switch -c clase/04-depositos-invalidos
```

Extraé el ZIP en otra carpeta y copiá únicamente `tests/invalid-deposit.spec.js`
a tu repo de automatización. No sobrescribas tus intentos. Si usás el ZIP completo
como proyecto independiente:

```sh
npm ci
npx playwright install chromium
npm test
```

Inicio: **7 passed / 3 skipped**. Los omitidos son los tres ejercicios nuevos.
Principal resuelto: **10 passed**. Solución con reto: **11 passed**.
La configuración solo permite localhost, nunca un banco o plataforma de producción.

## Reglas del caso

Cada test crea su propia práctica estable y entra por UI con `ana@demo.test` /
`Practica2026!`. La diaria comienza en `$ 2.500,00` y el ahorro en `$ 600,00`.
Elegí Depositar dentro de `Cuenta ana.diaria` y comprobá que el selector valga
`ana-main`. No selecciones otra opción para tapar un error de preselección.

| Dato | Restricción nativa | Resultado |
|---|---|---|
| `''` (vacío) | `required`, valueMissing | Diálogo abierto, ambos saldos intactos |
| `'0'` | `min="0.01"`, rangeUnderflow | Diálogo abierto, ambos saldos intactos |
| `'-1'` | `min="0.01"`, rangeUnderflow | Diálogo abierto, ambos saldos intactos |

La validación se hace en el navegador antes de enviar. No esperes un toast ni un
error de API. La redacción del aviso nativo depende del idioma y el navegador;
no la uses como texto literal. Comprobá la propiedad estándar del input:

```js
await expect(importe).not.toHaveJSProperty('validationMessage', '');
await expect(dialogo).toBeVisible();
await expect(importe).toBeFocused();
```

`validationMessage` es una propiedad JavaScript del campo, no un atributo ni un
mensaje dentro del DOM. Después comprobá los dos saldos dentro de sus regiones.
El saldo intacto solo no demuestra rechazo: podría aprobar antes de completarse
una operación. No uses pausas fijas. La UI no sustituye la validación del servidor;
las solicitudes manipuladas requieren pruebas de API separadas.

## Parametrizar sin compartir estado

Quitá `.skip`. La tabla guarda nombre e importe; `for...of` declara un `test(...)`
por fila. La creación de práctica y el acceso deben permanecer dentro del callback
de cada test. No pongas los tres intentos en un único test ni reutilices una sesión.

```sh
npx playwright test invalid-deposit.spec.js --headed
npm test
npm run report
```

El reporte del archivo muestra tres nombres diferentes y **3 passed**.
Los marcadores `@snippet` del material instructor no son una API de Playwright.

## Reto: el otro lado del límite

Creá un test independiente en `tests/invalid-deposit-challenge.spec.js`.
Desde otra práctica nueva, depositá `0.01` en diaria. Es **un centavo**, no un peso.
El diálogo debe cerrarse y la diaria mostrar `$ 2.500,01`; ahorro conserva `$ 600,00`.
Comprobá primero la cuenta que cambia y después la que no cambia.
El campo recibe punto decimal; el resultado visual usa coma decimal argentina.

Guardá tu intento antes de abrir la solución.

```sh
npm test
git status
git add tests
git commit -m "test: validar importes de depósitos"
```

## Si falla

- `ECONNREFUSED`: encendé el Lab en 4177.
- `strict mode violation`: buscá el botón dentro de la cuenta, no globalmente.
- Los tests siguen omitidos: quitá `.skip` cuando los implementes.
- El reto empieza con otro saldo: debe crear una práctica propia.
- El test busca un error inexistente: este rechazo es nativo del navegador.
- Validación bloqueada en el reto: escribí `0.01`, sin símbolo de moneda.

Fuentes: [parametrización](https://playwright.dev/docs/test-parameterize),
[toHaveJSProperty](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-js-property),
[validationMessage](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/validationMessage).
