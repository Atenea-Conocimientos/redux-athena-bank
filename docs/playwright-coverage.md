# Playwright → escenarios de Athena Bank Lab

Revisión de documentación oficial: 6 de octubre de 2026. Implementación fijada a `@playwright/test` 1.63.0. El mapa cubre las principales familias de aprendizaje de Playwright Test para web, no todos sus métodos, lenguajes, integraciones o entornos experimentales.

**Criterio:** una función del banco debe tener una regla observable. No agregamos controles arbitrarios para “usar una API”. Un resultado exitoso en pantalla no sustituye comprobar saldos, permisos e historial.

## Implementado con ejemplos ejecutables

| Capacidad / documentación oficial | Escenario y aprendizaje | Evidencia en el repositorio |
| --- | --- | --- |
| [Locators](https://playwright.dev/docs/locators) | Elegir la cuenta correcta entre tarjetas con botones idénticos; roles, labels, exactitud y scoping. | `banking.spec.js`: scoping y registro |
| [Actions](https://playwright.dev/docs/input) | Inputs, select, subir CSV, arrastrar favoritos y alternativa por teclado. | Ambas suites E2E |
| [Auto-waiting](https://playwright.dev/docs/actionability) | Formulario deshabilitado durante la petición; sincronizar por estado y eventos, no sleeps. | `browser-capabilities.spec.js`: respuesta demorada |
| [Assertions](https://playwright.dev/docs/test-assertions) | Estado visible + respuesta API + cambios en saldos. | `banking.spec.js`: recorrido completo |
| [API testing](https://playwright.dev/docs/api-testing) | Preparar datos, verificar ownership, estados y límites. | Fixture, pruebas HTTP y comprobaciones E2E |
| [Authentication](https://playwright.dev/docs/auth) | Login UI, setup por API y reutilización de `storageState` en memoria. | `fixtures.js` y `banking.spec.js` |
| [Isolation](https://playwright.dev/docs/browser-contexts) | Ana y Bruno con sesiones diferentes dentro del mismo laboratorio. | `banking.spec.js`: dos sesiones |
| [Network](https://playwright.dev/docs/network) | Observar respuesta antes de afirmar efectos; controlar petición demorada. | `waitForResponse`, `route.continue` |
| [Mock APIs](https://playwright.dev/docs/mock) | 503 y aborto de red: el depósito no existe; luego recuperar sin perder formulario. | `route.fulfill`, `route.abort` |
| [Clock](https://playwright.dev/docs/clock) | Avanzar 91 s de UI; por separado avanzar el reloj del banco y comprobar rechazo real. | `browser-capabilities.spec.js`: reloj |
| [Frames](https://playwright.dev/docs/frames) | Formulario de proveedor ficticio dentro de iframe y confirmación por postMessage. | `frameLocator` |
| [Shadow DOM](https://playwright.dev/docs/locators#locate-in-shadow-dom) | Botón de ayuda dentro de raíz abierta, sin XPath ni acceso al estado privado. | Prueba upload/iframe/Shadow DOM |
| [Downloads](https://playwright.dev/docs/downloads) | Capturar evento, nombre y contenido de CSV; adjuntar evidencia. | `banking.spec.js`: movimientos |
| [Pages](https://playwright.dev/docs/pages) | Comprobante abierto en otra pestaña, con sesión y datos correctos. | `waitForEvent('popup')` |
| [Dialogs](https://playwright.dev/docs/dialogs) | Aceptar/dismiss de cancelación; comprobar reserva y estado después. | `banking.spec.js`: cancelar |
| [Emulation](https://playwright.dev/docs/emulation) | Móvil, locale/zona, geolocalización ficticia, permisos y offline. | Config + prueba de geolocalización |
| [Accessibility testing](https://playwright.dev/docs/accessibility-testing) | axe sobre dashboard, nombres accesibles, foco de diálogo y escape. No demuestra accesibilidad total. | `browser-capabilities.spec.js`: accesibilidad |
| [ARIA snapshots](https://playwright.dev/docs/aria-snapshots) | Aserción pequeña sobre heading estable; no congelar todo el DOM dinámico. | `toMatchAriaSnapshot` |
| [Visual comparisons](https://playwright.dev/docs/test-snapshots) | Dashboard semillado y baseline por motor/SO. | `lab/visual`, configuración visual separada |
| [Fixtures](https://playwright.dev/docs/test-fixtures) | Crear/login/limpiar datos por test, no compartir un usuario mutable global. | `fixtures.js` |
| [Projects](https://playwright.dev/docs/test-projects) | Chromium, Firefox, WebKit y Pixel 7 emulado. | `playwright.config.js` |
| [Parallelism](https://playwright.dev/docs/test-parallel) | Datos aislados y cuatro workers locales. | `fullyParallel` + cookie por contexto |
| [Web server](https://playwright.dev/docs/test-webserver) | Arranque y apagado de servidor de pruebas, distinto del manual. | Puerto 4178 / SQLite en memoria |
| [Trace viewer](https://playwright.dev/docs/trace-viewer) | Investigar fallo con snapshots, red y acciones; adjuntos de axe y CSV. | `trace: retain-on-failure`, reporte HTML |
| [CI](https://playwright.dev/docs/ci) | Quality gate y artifacts, sin despliegue ni secretos. | Workflow preparado; ejecución remota pendiente |

Los nombres de suites remiten a `lab/e2e/`. `lab/tests/` agrega pruebas de negocio e integración HTTP: centavos, límite diario, rollback, idempotencia concurrente, importación atómica, aislamiento y rate limit. Esas pruebas usan `node:test`, no Playwright.

## Herramientas disponibles para ejercicios de ingeniería de tests

No todo necesita una pantalla adicional. Estos temas se practican refactorizando o ejecutando la misma suite:

- `test.step`, anexos y skip están en los ejemplos. Retries: configurados solo en CI; no “arreglan” un test inestable.
- Reportes HTML, capturas y vídeo de fallos: configurados. UI Mode y depuración: `npm run test:ui` o `npx playwright test --debug --project=chromium`.
- Codegen: `npx playwright codegen http://127.0.0.1:4177`; revisar los locators y agregar aserciones de negocio después de grabar.
- Page Objects: ejercicio de refactorizar el wizard de transferencia después de entender el test directo. No hay una capa POM artificial en esta entrega.
- Parametrización: convertir los límites de importes/OTP/alias en tablas de datos y decidir qué ejecutar por API y qué por UI.
- [Sharding](https://playwright.dev/docs/test-sharding): probar `npx playwright test --project=chromium --shard=1/2` y `--shard=2/2`. No se ejecutó un pipeline distribuido en esta entrega.
- Tags, anotaciones, timeouts, reporters personalizados y dependencias entre proyectos: extensiones del curso; no requieren añadir productos bancarios.

## Pendiente de una siguiente etapa, explícitamente no implementado

| Tema | Escenario propuesto | Motivo para separarlo |
| --- | --- | --- |
| HAR record/replay | Cotizador de monedas externo simulado y caché de tasas. | Hoy no hay proveedor HTTP externo; el mock de errores sí está implementado. |
| WebSocket / streaming | Seguimiento de procesamiento en vivo, desconexión y reconexión. | Actualmente procesar es explícito por HTTP, no un worker ni una cola. |
| Service Workers / PWA | Extracto offline con advertencia de datos desactualizados. | Offline actual muestra aviso; no promete operar sin red. |
| Sesión expirada por reloj, logout entre pestañas | Recuperación de formulario sin duplicar transferencias. | Hay TTL de una hora, pero el reloj didáctico no manipula sesiones ni hay sincronización automática. |
| Roles y doble aprobación | Operador solicita, supervisor aprueba; límites por rol. | Hoy hay dos clientes, no roles administrativos bancarios. |
| Programadas, reversiones, disputas | Fines de semana, zona horaria, conciliación y reversión de comisión. | Requiere nuevas reglas y oráculos, no solo pantallas. |
| Internacionalización / divisas | Conversión, redondeo y tipos de cambio vencidos. | Actualmente ARS y día UTC deliberadamente explícitos. |
| Component testing | Probar piezas de la interfaz aisladas. | La v2 es HTML/CSS/JS independiente; no se migró el React legacy. |
| Extensiones, Electron, Android, WebView2 | Laboratorios especializados si el curso los necesita. | Fuera del objetivo de automatización web de este banco. |
| Ejecución de código dentro de Atenea | Resolver retos desde el sitio, con evaluación automática. | Necesita sandbox real, cuotas y aislamiento de código no confiable; no ejecutar código de alumnos en el servidor de Atenea. |

La meta no es anunciar “todo Playwright”. Es un recorrido completo de prácticas fundamentales y avanzadas, con referencias oficiales y límites honestos. Antes de enseñar un tema nuevo: regla escrita → caso reproducible → test que falla cuando corresponde → solución y evidencia.
