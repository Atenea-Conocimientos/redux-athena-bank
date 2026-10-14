# Clase 02 · Crear una práctica e iniciar sesión

Objetivo: pasar de la bienvenida a la cuenta de Ana con acciones y comprobar cada
resultado. Continúa **Mi primera prueba con Playwright**. Necesitás Node.js 24+,
Git y la versión **Lab** local. Usá únicamente los datos ficticios públicos:
`ana@demo.test` y `Practica2026!`.

## Preparar el proyecto de pruebas

El banco y tus pruebas son dos proyectos distintos. En la carpeta de la aplicación
Bank Lab, ejecutá `npm ci` y `npm run dev`; dejala en http://127.0.0.1:4177.
La lección está en http://127.0.0.1:4177/lecciones/crear-practica/.

Este ZIP es acumulativo: incluye el smoke y la clase 01 resuelta. Si ya tenés tu
repositorio de pruebas, guardá tu trabajo, extraé este ZIP en otra carpeta y copiá
solamente el nuevo `tests/create-practice.spec.js` de inicio. Conservá tus pruebas
anteriores y tu historial de Git. La solución se consulta después de tu intento.
Si recién empezás, extraé el ZIP como `athena-bank-automation`, al lado del Lab.

Desde la carpeta de pruebas:

```sh
npm ci
npx playwright install chromium
npm test
```

El ZIP de inicio da **3 passed + 1 skipped**: smoke, prueba y reto de clase 01
aprobados; clase 02 omitida a propósito. El ZIP solución da **5 passed**, incluido
el nuevo reto. Un test omitido no demuestra que la funcionalidad funcione.

En tu repositorio existente, después de guardar los cambios anteriores:

```sh
git status
git switch -c clase/02-crear-practica
```

La preparación inicial de Git y GitHub está en
http://127.0.0.1:4177/lecciones/preparar-repositorio/. No reinicialices Git ni
sobrescribas tu intento con el ZIP solución.

## Recorrer el caso manual

1. Abrí http://127.0.0.1:4177 en una ventana privada sin una práctica previa.
2. Elegí **Estable · comportamiento esperado** y pulsá **Crear mi práctica**.
3. Comprobá el título **Tu sesión de práctica**.
4. Completá **Email ficticio** con `ana@demo.test` y **Contraseña de práctica**
   con `Practica2026!`, aunque el formulario ya muestre esos datos de ejemplo.
5. Pulsá **Iniciar sesión**.
6. Comprobá **Buen día, Ana.** y la cuenta cuyo alias es **ana.diaria**.

La URL sigue siendo `/` durante todo este recorrido. El cambio de pantalla se
comprueba con el título y la cuenta visible: no esperes `/login` ni `/dashboard`.

## Implementar y ejecutar

Quitá `.skip` de `tests/create-practice.spec.js` y completá los pasos.
`selectOption('stable')`, `fill(...)` y `click()` son **acciones**. Los
localizadores `getByLabel` y `getByRole` identifican los controles.
`await expect(...).toHaveText(...)` y `toBeVisible()` son **aserciones**:
comprueban el resultado. Que `click()` termine no demuestra que se inició sesión.

```sh
npx playwright test create-practice.spec.js --headed
npm test
npm run report
```

Playwright espera automáticamente las condiciones necesarias para cada acción;
por ejemplo, que el botón sea visible, esté habilitado y pueda recibir el clic.
Las aserciones sobre localizadores vuelven a comprobar la condición hasta que se
cumple o se agota su tiempo de espera. Usá `await` en ambas; no agregues pausas
fijas, clics forzados ni recargas para ocultar un fallo.

Cada test recibe un contexto de navegador limpio. Creá una práctica desde la UI
al principio de **cada caso**, incluso en el reto. No uses la sesión de tu Chrome
personal ni dependas de que otro test haya iniciado sesión antes. El test puede
correr solo o junto con la clase 01; todavía no hace falta un Page Object ni
preparar datos por API.

## Reto: rechazar una contraseña incorrecta

Creá `tests/create-practice-challenge.spec.js` como un test independiente.
Desde una práctica nueva con perfil `stable`, completá `ana@demo.test` y
`ClaveIncorrecta!`, y pulsá **Iniciar sesión**. Comprobá tres resultados:

1. La alerta dice exactamente **Email o contraseña incorrectos.**
2. El h1 sigue siendo **Tu sesión de práctica**.
3. La región exacta **Cuenta ana.diaria** no aparece (`toHaveCount(0)`).

El rechazo es el resultado esperado: este test debe pasar. Primero esperá la
alerta; comprobar que la cuenta no está presente antes de recibir la respuesta
podría dar un falso positivo. Guardá tu intento antes de consultar la solución.

```sh
npx playwright test create-practice-challenge.spec.js --headed
npm test
git status
git add tests
git commit -m "test: crear práctica y comprobar inicio de sesión"
git push -u origin clase/02-crear-practica
```

El push requiere que hayas conectado tu propio repositorio de GitHub. Podés abrir
un PR hacia `main` dentro de ese repo y comparar las acciones con sus aserciones.

## Si falla

- `ECONNREFUSED`: iniciá el Lab y comprobá el puerto 4177.
- Navegador ausente: ejecutá `npx playwright install chromium` en tus pruebas.
- Test omitido: quitá `.skip` al empezar a implementar.
- No aparece el formulario: revisá que el caso cree su propia práctica estable.
- Falla el acceso: compará el email y la clave con los datos públicos de arriba.
- Nodo incompatible: usá Node.js 24+ y reabrí la terminal.

La configuración del curso solo acepta localhost. El material y las ramas del
curso se entregan localmente; no se publicaron ramas remotas.
Referencias: [acciones](https://playwright.dev/docs/input),
[espera automática](https://playwright.dev/docs/actionability) y
[aislamiento](https://playwright.dev/docs/browser-contexts).
