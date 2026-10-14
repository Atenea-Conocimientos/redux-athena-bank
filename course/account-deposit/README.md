# Clase 03 · Localizadores dentro de una cuenta y comprobación de un depósito

Objetivo: elegir **qué cuenta** se opera y comprobar el resultado y la ausencia
de cambios en la otra. Continúa la clase 02. Necesitás Node.js 24+, Git y el Lab
local. Usá solo los datos ficticios públicos `ana@demo.test` / `Practica2026!`.
No uses cuentas bancarias, credenciales ni dinero reales.

## Preparar y conservar tu progreso

El banco y las pruebas son dos proyectos distintos. En el proyecto Bank Lab,
ejecutá `npm ci` y `npm run dev`; dejalo en http://127.0.0.1:4177.
La clase está en http://127.0.0.1:4177/lecciones/deposito-en-cuenta/.

El ZIP es acumulativo: conserva smoke, clase 01 y clase 02 con sus retos resueltos.
Si ya tenés tu repositorio de pruebas, guardá tus cambios, extraé el ZIP en otra
carpeta y copiá únicamente el nuevo `tests/account-deposit.spec.js` de inicio.
No sobrescribas tus intentos ni borres tu historial. Si empezás desde cero, extraé
el ZIP como `athena-bank-automation`, al lado del Lab.

Desde tu carpeta de pruebas:

```sh
npm ci
npx playwright install chromium
npm test
git status
git switch -c clase/03-deposito-en-cuenta
```

El ZIP de inicio da **5 passed + 1 skipped**. El omitido es el ejercicio nuevo:
todavía no demuestra nada. El ZIP solución da **7 passed**, incluido el reto.
La preparación de Git/GitHub está en
http://127.0.0.1:4177/lecciones/preparar-repositorio/. Continuá en tu propio repo,
no reinicialices Git ni abras esta rama en el repositorio de la aplicación.

## El caso manual y sus reglas

1. Desde una práctica nueva estable, iniciá sesión como Ana.
2. Identificá **ana.diaria**, saldo **$ 2.500,00**, y **ana.ahorro**, **$ 600,00**.
3. Ambos paneles tienen un botón **Depositar**. Elegí el de **ana.diaria**.
4. En **Ingresar fondos ficticios**, la cuenta ya debe ser **Cuenta diaria · ana.diaria**.
5. Ingresá **100** y pulsá **Depositar fondos**.
6. Comprobá que el diálogo se cierre y la diaria muestre **$ 2.600,00**.
7. Comprobá que ahorro conserve **$ 600,00**.

Son pesos argentinos ficticios; el campo recibe `100`, no centavos ni el símbolo
`$`. La UI usa formato argentino: punto para miles y coma para decimales.
Un clic exitoso o un aviso de éxito por sí solos no prueban el saldo.

## Localizadores con intención

Quitá `.skip` y completá `tests/account-deposit.spec.js`.

```js
const cuentaDiaria = page.getByRole('region', {
  name: 'Cuenta ana.diaria', exact: true,
});
await cuentaDiaria.getByRole('button', { name: 'Depositar', exact: true }).click();
```

`exact: true` exige el nombre accesible completo: no selecciona un elemento por
posición. El segundo localizador se busca **dentro** de la región de la cuenta.
Un `page.getByRole('button', { name: 'Depositar', exact: true }).click()` global
encuentra dos botones y Playwright lo rechaza por ambigüedad (*strict mode*).
No lo soluciones con `.first()`, `.nth(0)` ni `force: true`: el orden visual
puede cambiar y terminarías operando otra cuenta.

Las regiones provienen de las secciones etiquetadas de la aplicación. El alias
de la cuenta es una identidad; el saldo es un resultado variable. Por eso elegimos
la región por alias y luego buscamos el importe exacto **dentro de esa región**.

El diálogo permite delimitar también sus controles:

```js
const dialogo = page.getByRole('dialog', { name: 'Ingresar fondos ficticios' });
await expect(dialogo.getByLabel('Cuenta para depósito')).toHaveValue('ana-main');
await dialogo.getByLabel('Importe a depositar').fill('100');
await dialogo.getByRole('button', { name: 'Depositar fondos' }).click();
await expect(dialogo).toBeHidden();
await expect(cuentaDiaria.getByText('$ 2.600,00', { exact: true })).toBeVisible();
```

`ana-main` es el valor de la opción visible **Cuenta diaria · ana.diaria**.
No vuelvas a seleccionar la cuenta para tapar un error de preselección: comprobá
la que abrió el botón elegido. Para el reto, `ana-save` identifica el ahorro.
`getByText` normaliza los espacios, incluido el espacio no separable entre `$`
y el importe. `exact: true` evita aceptar un texto que solo contenga esa cifra.

Comprobá ambos saldos iniciales, realizá la acción, esperá el cierre del diálogo
y después verificá el saldo actualizado y el saldo que debe seguir igual.
Los localizadores vuelven a resolver el elemento cuando la aplicación repinta
las tarjetas. Las aserciones reintentan hasta cumplir la condición o agotar el
timeout; no hacen falta `waitForTimeout`, recargas, selectores CSS de estilo,
pausas fijas ni reutilizar la sesión personal de tu navegador.

```sh
npx playwright test account-deposit.spec.js --headed
npm test
npm run report
```

## Reto independiente: ahorrar sin tocar la diaria

Creá `tests/account-deposit-challenge.spec.js`. Cada test debe crear su propia
práctica estable e iniciar sesión por UI; no depende de que el ejemplo haya corrido.
Desde **$ 600,00** de ahorro y **$ 2.500,00** de diaria:

1. Elegí **Depositar** dentro de **Cuenta ana.ahorro**.
2. Comprobá el valor **ana-save** en **Cuenta para depósito**.
3. Depositá **50** y esperá el cierre del diálogo.
4. Comprobá **$ 650,00** en ahorro y **$ 2.500,00** en diaria.

La diaria no empieza en $ 2.600,00: cada caso usa una práctica nueva. Guardá tu
intento antes de descargar o consultar la solución.

```sh
npx playwright test account-deposit-challenge.spec.js --headed
npm test
git status
git add tests
git commit -m "test: comprobar depósitos en la cuenta elegida"
git push -u origin clase/03-deposito-en-cuenta
```

El push requiere tu repo remoto ya configurado. Podés abrir un PR hacia `main`
en ese mismo repo y revisar: cuenta correcta, resultado correcto, otra cuenta intacta.

## Si falla

- `ECONNREFUSED`: iniciá el Lab en 4177.
- Navegador ausente: ejecutá `npx playwright install chromium`.
- `strict mode violation`: falta acotar el botón a la región exacta.
- Saldo inicial distinto: creá una práctica nueva dentro de cada test.
- Cuenta preseleccionada incorrecta: revisá el botón y la región antes de depositar.
- Error de importe: escribí `100` o `50`; la pantalla usa formato argentino.
- Test omitido: quitá `.skip` al empezar a implementar.

La configuración del curso solo admite localhost. Los materiales se entregan
localmente; estas instrucciones no crean ramas remotas por sí mismas.
Referencias: [localizadores y encadenamiento](https://playwright.dev/docs/locators),
[strictness](https://playwright.dev/docs/locators#strictness) y
[aserciones con reintento](https://playwright.dev/docs/test-assertions).
