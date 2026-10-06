# Integraciones avanzadas — guía de práctica

Todo local y con datos ficticios. Iniciar con `npm ci` y `npm run dev`. No hacen falta claves, APIs pagas ni cuentas externas. Abrir [mercado](http://127.0.0.1:4177/mercado/) directamente o desde **Laboratorio → Abrir mercado ficticio**.

## 1. El proveedor responde distinto

**Historia AB-11.** Consultar USD/EUR, cambiar moneda y actualizar. Diseñar oráculos para respuesta válida, negativa, incompleta, vencida y 503. ¿Debe seguir apareciendo el precio anterior como vigente después de un error?

Referencia: `lab/e2e/advanced-network.spec.js`. Usa un [Page Object](https://playwright.dev/docs/pom) pequeño, casos parametrizados y `route.fetch` para modificar una respuesta real. El reloj de UI permite vencer la tasa sin esperar 90 segundos. Este cotizador no ejecuta conversiones bancarias.

## 2. El proveedor no está disponible para la suite

Grabar únicamente `/api/market/rates` en un HAR y cerrar el contexto para guardarlo. Reproducir en otro contexto con `notFound: 'abort'`: una URL que no coincida no debe escapar a la red. El test verifica que no se llamó al fallback de proveedor y adjunta el HAR público al reporte. No grabar el login ni subir grabaciones con credenciales.

[Referencia oficial HAR](https://playwright.dev/docs/mock#mocking-with-har-files). Los archivos generados van al output ignorado de cada test, no al repositorio. Service Workers se bloquean en estos tests para no interceptar la misma petición por dos mecanismos.

## 3. El canal se corta

**Historia AB-12.** Conectar en vivo → solicitar nueva tasa → simular corte → reconectar. Cada conexión comienza en 0. La secuencia pertenece al canal, no representa movimientos bancarios.

Tres niveles de prueba: servidor WebSocket real con eventos `framereceived`; mock total con `routeWebSocket`; puente al servidor mediante `connectToServer` alterando solamente la respuesta. Inyectar un JSON roto y explicar por qué una prueba exclusivamente mockeada no valida la integración real.

[Referencia oficial WebSockets](https://playwright.dev/docs/mock#mock-websockets).

## 4. Se cae Internet, pero la pantalla sigue abierta

**Historia AB-13.** Habilitar consulta offline, cortar red, recargar, inspeccionar aviso de datos desactualizados. Recuperar red y actualizar. Revisar caches: solo página, JS, CSS y tasas públicas. Borrar caché y verificar que el worker deje de controlar la página.

No se guardan extractos ni sesiones. No se pueden operar fondos offline. La suite `offline.spec.js` verifica activación, fallback, retorno online y limpieza. Se ejecuta en Chromium y Pixel 7 emulado; las APIs de [Service Workers de Playwright](https://playwright.dev/docs/service-workers) no se soportan en sus proyectos Firefox/WebKit y esos casos tienen skip explícito. Esto no significa que esos navegadores carezcan de Service Workers.

## 5. Venció mi sesión mientras confirmaba

**Historia AB-14.** Crear una práctica y entrar como Ana. Preparar transferencia hasta OTP. En otra pestaña de esa misma práctica, abrir Laboratorio y pulsar **Vencer mi sesión**. Volver al diálogo anterior e intentar confirmar: debe pedir login, no crear una transferencia. Reingresar como Ana recupera el formulario; reingresar como Bruno no lo recupera.

El borrador vive solo en memoria de esa pestaña; una recarga lo pierde. OTP, contraseña y autorización no son parte del borrador. No hay reenvío automático. El control de expiración revoca solo tu sesión, no las de otros contextos. Salir explícitamente notifica las otras pestañas y descarta borradores.

## 6. El navegador deniega permisos

Usar `addInitScript` antes de navegar para simular portapapeles permitido/denegado. Registrar llamadas con `exposeFunction`: confirmar qué texto se intentó copiar, no solo el mensaje de éxito. Simular también ubicación denegada y comprobar la alternativa textual. Los tests no usan el clipboard real del usuario.

[Referencia oficial de mocks del navegador](https://playwright.dev/docs/mock-browser-apis).

## Ejecutar y depurar

```sh
npm run test:advanced
npx playwright test --grep '@network' --project=chromium
npx playwright test --grep '@auth' --project=firefox
npx playwright test --grep '@offline' --project=chromium
npx playwright test --grep '@advanced' --project=chromium --shard=1/2
npx playwright test --grep '@advanced' --project=chromium --shard=2/2
npm run test:ui
npm run test:report
```

El setup de salud corre como dependencia de los proyectos. No guarda un usuario compartido: las prácticas mutables siguen aisladas por fixture. HTML y JSON están en `playwright-report/` y `test-results/results.json`; traces/videos/capturas de fallo van al output de cada test. No ejecutar dos servidores de test simultáneos sobre el mismo puerto 4178. Los comandos de shards anteriores se pueden correr secuencialmente para estudiar cómo se divide la suite; CI distribuido y reporters personalizados no están implementados.

**Entregable del alumno:** regla, caso reproducible, aserción de negocio, evidencia y explicación del fallo. Las suites resueltas son referencia para el docente; no equivalen a que el alumno haya completado los retos.
