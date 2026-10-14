# Clase 01 · Mi primera prueba con Playwright

Objetivo: comprobar la bienvenida de Athena Bank Lab sin crear prácticas ni iniciar
sesión. Necesitás Node.js 24+, Git y la versión **Lab** local entregada por el instructor.
No se necesitan variables secretas, dinero real ni una cuenta de ElevenLabs.

## Preparación

En otra terminal, dentro de la aplicación Bank Lab, ejecutá `npm ci` y `npm run dev`.
Dejá el banco abierto en http://127.0.0.1:4177. Esta carpeta es **otro proyecto**:
tus pruebas, no la aplicación. Extraela como `athena-bank-automation`, al lado del Lab.

```sh
npm ci
npx playwright install chromium
npm test
```

Inicio: **1 passed + 1 skipped**. El smoke comprueba el servidor y el ejercicio
está omitido a propósito, no aprobado. Solución: **3 passed**, incluido el reto.
La guía completa de Git está en http://127.0.0.1:4177/lecciones/preparar-repositorio/.

Si este es un repo nuevo:

```sh
git init -b main
git add .
git commit -m "chore: preparar entorno Playwright"
git switch -c clase/01-primera-prueba
```

Creá un repositorio vacío en tu GitHub; luego, desde `main`, agregá como origin
la URL de **tu** repo y hacé `git push -u origin main`. No pegues claves en URLs.
Si ya tenías tu repo del Paso 0, **no reinicialices Git**: guardá tus cambios y creá
la rama de esta clase. No sobrescribas tu intento con el ZIP solución.

## Caso manual antes de programar

1. En una ventana privada, abrí http://127.0.0.1:4177 (sin una sesión previa).
2. Observá el encabezado principal: **Aprendé a probar lo que importa.**
3. Identificá **Crear mi práctica**: debe estar visible y habilitado. No lo pulses.

Playwright abre un contexto limpio automáticamente: no usa tu Chrome personal.
El test no demuestra todavía que crear una práctica funcione; solo comprueba que
la bienvenida presenta el contenido esperado y el botón está disponible.

## Construir y ejecutar

Archivo: `tests/first-test.spec.js`. Quitá `.skip` y completá sus pasos.
`test` define el caso, `page` es la pestaña que entrega Playwright, `async/await`
permite esperar operaciones asíncronas y `expect` comprueba resultados.

```sh
npx playwright test first-test.spec.js --headed
npm run test:ui
npm run report
```

`getByRole` crea un localizador; **no es una aserción**. Usá `await expect(...)`
con `toHaveText`, `toBeVisible` y `toBeEnabled`, sin `waitForTimeout`.
El encabezado contiene un salto de línea visual: `toHaveText` con string normaliza
espacios. El nombre accesible del botón omite la flecha decorativa `aria-hidden`.

## Provocar, investigar y corregir un fallo

Después de que pase, cambiá SOLO la expectativa del título a `Bienvenido al banco`.
Ejecutá el mismo comando. Debe fallar: `Expected` es lo pedido, `Received` lo observado.
La app no cambió: en este ejercicio la expectativa es incorrecta. Restaurá el texto
del requisito y volvé a ejecutar. **No guardes el fallo intencional como solución.**
En un caso real, investigá contra el requisito antes de cambiar el test para hacerlo pasar.

## Reto

Sin hacer clic, comprobá que el perfil seleccionado inicialmente sea **Estable**.
Usá `getByLabel('Perfil del ejercicio')`. Distinguí el valor técnico `stable` de
la etiqueta visible `Estable · comportamiento esperado`.
Guardá tu intento antes de mirar `tests/first-test-challenge.spec.js` en el ZIP solución.

```sh
git status
git add tests
git commit -m "test: comprobar bienvenida del banco"
git push -u origin clase/01-primera-prueba
```

El último comando requiere que ya hayas creado y conectado tu repositorio GitHub.
Podés comparar el cambio con un PR hacia `main` dentro de tu propio repo.

## Si no arranca

- `ECONNREFUSED`: falta iniciar el banco o el puerto no es 4177.
- Falta navegador: `npx playwright install chromium` desde esta carpeta.
- Test omitido: quitá `.skip` al implementar; todavía no comprueba el ejercicio.
- Nodo incompatible: actualizá a Node.js 24+ y reabrí la terminal.
- No corras esto contra QA/prod: la configuración solo acepta localhost.

Por ahora se entrega material local. No se publicaron ramas remotas del curso.
Referencias: [primer test](https://playwright.dev/docs/writing-tests) y
[aserciones](https://playwright.dev/docs/test-assertions).
