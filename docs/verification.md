# Verificación local — 6 de octubre de 2026

Entorno: Windows, Node.js 24.14.0, Playwright 1.63.0. Solo laboratorio v2. No se ejecutaron migraciones, cambios en Atenea ni despliegues. La aplicación legacy `backend/` + `frontend/` quedó sin modificaciones.

## Resultados de la entrega

- `npm run check`: sintaxis correcta de banco, servidor y aplicación.
- `npm test`: **18/18** tests de dominio e integración HTTP.
- `npx playwright test`: **75 aprobados y 1 omitido**. Son 19 escenarios ejecutados en cuatro proyectos: Chromium, Firefox, WebKit y móvil Chromium emulado.
- Omisión deliberada: HTML5 drag-and-drop en móvil. La alternativa por controles y teclado se ejecuta también allí.
- `npm run test:visual`: **1/1**, comparación con baseline Chromium/Windows revisada, ejecutada nuevamente sin actualizar snapshots.
- axe sobre dashboard semillado: sin violaciones detectadas en los tags WCAG incluidos. Esto no certifica toda la aplicación ni sustituye lector de pantalla/exploración manual.
- Revisión de capturas de escritorio y móvil y navegación local con datos ficticios.

En las primeras corridas aparecieron defectos de iframe, limpieza del temporizador, superposición de notificaciones y retorno de foco en WebKit. Se corrigió la app y se volvió a correr la suite; no se ocultaron con reintentos ni `force`.

## Evidencias y reproducción

- `playwright-report/`: reporte HTML local generado por la suite, ignorado por Git.
- `test-results/`: capturas, CSV y JSON de axe; trazas/vídeo si alguna prueba falla. Ignorado por Git.
- `lab/visual/dashboard.spec.js-snapshots/dashboard-chromium-win32.png`: baseline de escritorio revisada, versionada.
- `npm run test:ui`: explorar casos y depurar paso a paso.

El workflow CI fue preparado pero **no ejecutado en GitHub**. No afirmar validación de Linux ni de un dispositivo físico: móvil es emulación. No se hicieron pruebas de carga ni auditoría exhaustiva de seguridad. Las reglas/servicios marcados pendientes en el mapa de cobertura no están implementados.

Node 24 muestra un aviso de que SQLite integrado es experimental. No impide estas pruebas; fijar/validar la versión de Node al preparar el curso. Mantener este registro como evidencia histórica, no como garantía de futuras modificaciones.
