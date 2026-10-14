# Mi repositorio de automatización

Este proyecto contiene **tus pruebas**, no la aplicación bancaria. Es JavaScript
con Playwright 1.63.0. Necesitás Node.js 24 o superior, Git y la versión local
Athena Bank Lab preparada por el instructor. No usa cuentas, claves ni dinero real.

## 1. Iniciar la aplicación (otra carpeta, otra terminal)

En la copia local de **Athena Bank Lab** que te entregue el instructor:

```sh
npm ci
npm run dev
```

Mantené esa terminal abierta. Abrí http://127.0.0.1:4177/api/health y comprobá
`status: "ok"`, `mode: "local-lab"`, `realMoney: false`.
No clones la antigua versión Redux de la aplicación: estos ejercicios requieren
la versión Lab. La distribución pública del Lab se anunciará aparte.

## 2. Instalar las pruebas (esta carpeta)

Extraé el ZIP en una carpeta nueva llamada `athena-bank-automation`, al lado de la
aplicación, **no dentro** de ella. Abrí esa carpeta en tu editor y una terminal:

```sh
node --version
git --version
npm ci
npx playwright install chromium
npm test
```

En **inicio** verás 1 prueba aprobada y 1 omitida (`skipped`): esa última es tu
ejercicio pendiente, no una solución. En **solución** deben aprobarse ambas pruebas (smoke y transferencia).
Si `npm ci` falla porque falta el lockfile, descargá de nuevo el ZIP completo.

## 3. Crear tu repositorio GitHub

Primero guardá un punto de partida local:

```sh
git init -b main
git add .
git commit -m "chore: preparar laboratorio de automatizacion"
```

Si Git pide tu identidad, configurá `user.name` y `user.email` en este repositorio
con tu nombre y tu email (podés usar el noreply de GitHub). No copies los datos
del instructor.

En GitHub, creá un repositorio **vacío** llamado `athena-bank-automation` en tu
cuenta. No agregues README, licencia ni .gitignore desde GitHub porque ya están
en tu carpeta. Elegí público o privado según prefieras. Reemplazá `TU_USUARIO`:

```sh
git remote add origin https://github.com/TU_USUARIO/athena-bank-automation.git
git push -u origin main
git switch -c caso/transferencia-pendiente
```

Usá el inicio de sesión de GitHub/Git Credential Manager; nunca pegues una clave
en archivos, commits, capturas o URLs. Revisá `git status` antes de cada commit.

## 4. Implementar el caso avanzado

Abrí `tests/pending-lesson.spec.js`, quitá `.skip` cuando empieces y escribí las
comprobaciones. El dinero en la API está en **centavos**: $101 = `10100`.
La práctica debe ser nueva, estable y aislada. El código ficticio es `246810`.
No compartas la cookie de sesión de Ana con Bruno; solo el identificador de práctica.

```sh
npm run test:headed
npm run test:ui
npm run report
```

Guardá tu intento antes de consultar la respuesta:

```sh
git add tests/pending-lesson.spec.js
git commit -m "test: comprobar transferencia pendiente"
git push -u origin caso/transferencia-pendiente
```

Podés abrir un PR en **tu propio repo**, desde esa rama hacia `main`, para comparar
lo aprendido. No necesitás enviar PR al repositorio de la aplicación.

## 5. Comparar con la solución sin perder tu trabajo

La página de la lección permite descargar el test completo y el ZIP solución.
Extraé la solución en **otra carpeta** y compará `tests/pending-lesson.spec.js`
con tu intento. No reemplaces tu carpeta de trabajo ni uses `git reset --hard`.

El test de referencia es exactamente el ejecutado para generar la lección;
incluye preparación por API, sesiones, pasos UI, aserciones y limpieza. La
captura opcional `LESSON_CAPTURE_DIR` es para el instructor: no hace falta
configurarla para completar el curso.

Este ZIP corresponde al caso avanzado de transferencia pendiente, separado de las seis clases iniciales. Las clases 01–06 tienen ZIPs acumulativos de inicio y solución en sus propias páginas. Los checkpoints se entregan como ZIP; no se requieren ramas remotas por clase.

## Si algo no funciona

- `ECONNREFUSED`: iniciá primero la aplicación en la otra terminal; verificá el puerto 4177.
- Falta Chromium: ejecutá `npx playwright install chromium` en esta carpeta.
- Error de Node: usá Node.js 24 o superior y reabrí la terminal.
- Solo 1 prueba y 1 skipped: es el inicio; el ejercicio aún no está implementado.
- Un test falla: mirá el reporte y su trace antes de agregar esperas fijas.
- No hay variables secretas que pedir: la configuración por defecto es local.
  Solo si el instructor cambia el puerto, `LAB_BASE_URL` puede apuntar a otro
  puerto de localhost. No se aceptan direcciones de QA, producción ni otros hosts.

Documentación oficial: [instalación](https://playwright.dev/docs/intro),
[aserciones](https://playwright.dev/docs/test-assertions) y
[pruebas por API](https://playwright.dev/docs/api-testing).
