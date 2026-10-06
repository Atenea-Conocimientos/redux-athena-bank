# Verificación local — 6 de octubre de 2026

Entorno: Windows, Node.js 24.14.0, Playwright 1.63.0. Solo laboratorio v2. No se ejecutaron migraciones, cambios en Atenea ni despliegues. La aplicación legacy `backend/` + `frontend/` quedó sin modificaciones.

## Primera entrega (antes de integraciones avanzadas)

- `npm run check`: sintaxis correcta de banco, servidor y aplicación.
- `npm test`: **18/18** tests de dominio e integración HTTP.
- `npx playwright test`: **75 aprobados y 1 omitido**. Son 19 escenarios ejecutados en cuatro proyectos: Chromium, Firefox, WebKit y móvil Chromium emulado.
- Omisión deliberada: HTML5 drag-and-drop en móvil. La alternativa por controles y teclado se ejecuta también allí.
- `npm run test:visual`: **1/1**, comparación con baseline Chromium/Windows revisada, ejecutada nuevamente sin actualizar snapshots.
- axe sobre dashboard semillado: sin violaciones detectadas en los tags WCAG incluidos. Esto no certifica toda la aplicación ni sustituye lector de pantalla/exploración manual.
- Revisión de capturas de escritorio y móvil y navegación local con datos ficticios.

En las primeras corridas aparecieron defectos de iframe, limpieza del temporizador, superposición de notificaciones y retorno de foco en WebKit. Se corrigió la app y se volvió a correr la suite; no se ocultaron con reintentos ni `force`.

## Ampliación avanzada — misma fecha

- `npm run check`: sintaxis correcta incluyendo mercado, servidor WebSocket y Service Worker.
- `npm test`: **23/23** pruebas de dominio, HTTP y WebSocket; expiración de sesión aislada, feed público, origen/ruta inválidos, comandos y límite de payload.
- `npx playwright test`: **150 aprobados, 3 omitidos, 0 fallidos** sin retries locales. Son 38 escenarios × 4 proyectos + 1 setup de salud.
- Omisiones: HTML5 drag móvil y Service Worker en Firefox/WebKit (las APIs de automatización de workers de Playwright solo soportan Chromium). El mismo escenario offline sí pasa en Chromium y móvil emulado.
- Nuevos casos: HAR sin cookies, `route.fetch` parametrizado, tasa vencida/contrato inválido, WebSocket real/mock/pass-through, portapapeles, caché offline, sesión vencida y borrador, aislamiento por identidad, logout entre pestañas, descarte voluntario de borrador y respuesta demorada posterior al logout.
- Revisión de capturas del mercado en escritorio/móvil; axe sin violaciones detectadas en estados evaluados. Se ajustó la especificidad CSS para mantener legibles las tasas y la marca.
- Regresión visual de dashboard sin actualizar la baseline: **1/1**.
- Sharding avanzado probado localmente en Chromium, secuencial y no distribuido. No ejecutado en GitHub.
- `npm audit --omit=dev`: 0 vulnerabilidades reportadas para las dependencias runtime al verificar; esto no es una auditoría de seguridad de la app.
- Servidor manual reiniciado en 4177 con SQLite existente preservado. Reiniciar revoca las sesiones en memoria, no los datos ficticios.

Se agregó una protección frente a respuestas de una sesión anterior: si cambia la sesión mientras una petición está en vuelo, su respuesta no puede volver a mostrar el diálogo ni datos privados. El caso se reproduce con una respuesta retenida, sin sleeps, y pasa en los cuatro proyectos.

## Evidencias y reproducción

- `playwright-report/`: reporte HTML local generado por la suite, ignorado por Git.
- `test-results/`: capturas, CSV y JSON de axe; trazas/vídeo si alguna prueba falla. Ignorado por Git.
- `test-results/results.json`: reporte estructurado; HAR público adjunto al test correspondiente. `artifacts/shard-*` conserva outputs de las ejecuciones divididas.
- `lab/visual/dashboard.spec.js-snapshots/dashboard-chromium-win32.png`: baseline de escritorio revisada, versionada.
- `npm run test:ui`: explorar casos y depurar paso a paso.

El workflow CI fue preparado pero **no ejecutado en GitHub**. No afirmar validación de Linux ni de un dispositivo físico: móvil es emulación. No se hicieron pruebas de carga ni auditoría exhaustiva de seguridad. Las reglas/servicios marcados pendientes en el mapa de cobertura no están implementados.

Node 24 muestra un aviso de que SQLite integrado es experimental. No impide estas pruebas; fijar/validar la versión de Node al preparar el curso. Mantener este registro como evidencia histórica, no como garantía de futuras modificaciones.
