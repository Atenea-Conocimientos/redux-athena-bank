# Clase 04 · Depósitos inválidos

Ruta local: <http://127.0.0.1:4177/lecciones/depositos-invalidos/>.

## Objetivo y alcance

Tres casos parametrizados e independientes: importe vacío, cero y negativo.
Parten de una práctica estable nueva por UI, sesión de Ana y saldos diaria $2.500
y ahorro $600. El navegador bloquea el submit por las restricciones del input
`required`, `min="0.01"`, `step="0.01"`. No existe un error propio de aplicación
en este recorrido y no se debe fabricarlo ni omitir la validación para buscarlo.

El test comprueba `validationMessage` no vacío sin texto literal dependiente del
idioma, diálogo abierto, foco en el campo y ambos saldos iniciales conservados.
El reto independiente prueba el mínimo válido `0.01`: diaria $2.500,01 y ahorro $600.
Esto cubre UI; no sustituye pruebas de autorización/validación de API.

## Enseñanza

- Separar datos y pasos usando tabla + `for...of` para declarar tres tests.
- Títulos únicos y resultados independientes en el reporte.
- Contexto nuevo de Playwright y práctica creada dentro de cada caso.
- Reutilizar localizadores de regiones y diálogo aprendidos en clase 03.
- Distinguir propiedad JS del campo de atributo y texto DOM.
- Verificar el rechazo antes de observar saldos que no cambian.
- Un límite necesita casos inválidos y al menos un válido del otro lado.

## Material

- `lab/lessons/invalid-deposit.json`: cinco escenas y quince cues, 354 palabras.
- `lab/public/invalid-deposit-lesson.html`: reproducción, código, quiz, reto y ZIPs.
- `lab/e2e/invalid-deposit.spec.js`: tres casos de referencia.
- `lab/e2e/invalid-deposit-challenge.spec.js`: un centavo válido.
- `lab/e2e/invalid-deposit-evidence.spec.js`: dos diagnósticos/capturas.
- `scripts/capture-invalid-deposit-lesson.cjs`: ejecuta antes de publicar snippets.
- `course/invalid-deposit/`: guía y ejercicio inicial con tres tests omitidos.

Recursos de `lab/public/lessons/invalid-deposit/`: `before.png`, `empty.png`,
`error.png`, `challenge.png`, `code.json`, `evidence.json`, specs descargables,
`lesson.json`, `narration.mp3`, `subtitles.vtt`, ZIPs `clase-04-inicio.zip` y
`clase-04-solucion.zip`. La etiqueta error.png identifica captura del importe
negativo; no presupone que aparezca un error de aplicación ni que las capturas
incluyan la burbuja nativa del navegador.

## Regeneración y evidencia

```sh
node scripts/capture-invalid-deposit-lesson.cjs
npm run course:build
```

Por defecto la captura usa configuración Playwright principal, puerto4178 y
SQLite en memoria. Para ejecución aislada admite `INVALID_DEPOSIT_CAPTURE_CONFIG`,
`INVALID_DEPOSIT_CAPTURE_REPORT` y `INVALID_DEPOSIT_CAPTURE_PORT`.
No toca el servidor manual4177. Los recursos se generan solo con seis tests
aprobados; conserva hashes de fuentes y capturas. El diagnóstico verifica
`valueMissing` y `rangeUnderflow`, además de ausencia de solicitudes POST al
endpoint de depósito. Es instrumentación de evidencia, no complejidad añadida
al ejercicio del alumno.

Los ZIPs son acumulativos: inicio **7 passed / 3 skipped**; principal **10 passed**;
solución con reto **11 passed**. La rama propuesta es `clase/04-depositos-invalidos`.
No se publican ramas remotas ni se implementa en QA/producción.

## Voz

Guion autorizado para voz de Juan, cinco archivos originales fuera del webroot:
`objetivo.mp3`, `datos.mp3`, `validacion.mp3`, `comprobar.mp3`, `reto.mp3`.
Importar/alinear con el proceso compartido antes de publicar la lección local.

## Validación realizada durante implementación

- Seis escenarios nuevos en cuatro proyectos: **24/24 aprobados** en Chromium,
  Firefox, WebKit y móvil, servidor aislado 4184 con SQLite en memoria.
- Escenarios principales: tres rechazos nativos; reto mínimo válido: aprobado.
- Diagnóstico: vacío valueMissing; cero y negativo rangeUnderflow; sin POST.
- Cuatro capturas reales generadas, revisadas visualmente y huellas guardadas.
- Pruebas de reproducción, voz y ZIP acumulado: ver la integración verificada abajo.

## ZIPs verificados desde carpetas limpias · 8/10/2026

Ambos paquetes se extrajeron en carpetas temporales independientes. Se ejecutó
`npm ci` en cada una (cero vulnerabilidades reportadas), luego
`npm test -- --workers=1 --reporter=list,json` contra un servidor propio del Lab
en **4184**, con SQLite en memoria y `LAB_BASE_URL=http://127.0.0.1:4184`.
No se reutilizaron `node_modules`, fixtures ni helpers privados del repositorio.

- Inicio: **7 passed / 3 skipped**, los tres ejercicios pendientes intencionales.
- Solución: **11 passed**, sin omisiones, fallos ni reintentos.
- Verificación nativa de ZIP exacto/CRC/reproducibilidad: **1/1 aprobada**.
- Reportes conservados en `%TEMP%/athena-classes04-06-zips-5e1fbca1636b4a17bef79ebda0dfe0f3/`
  dentro de cada checkpoint como `results.json`.
- El servidor temporal se detuvo al finalizar; no se tocó el servidor manual4177.

## Integración verificada · 8/10/2026

- Narración local: **144,323 segundos (2:24)**, cinco capítulos y quince cues;
  alineación automática entre **89,55% y 100%**. La aprobación de naturalidad
  y calidad de la voz corresponde a Juan.
- Pruebas nativas de fuentes, audio, subtítulos, ZIPs, rutas y rangos: **4/4**.
- Reproductor en Chromium, Firefox, WebKit y móvil, un worker: **12/12**.
  Se verificaron audio real, selección de capítulos, fragmentos sin recorte,
  quiz, reto, descargas exactas y continuidad desde la clase03.
- Sin errores JavaScript, solicitudes externas ni escrituras bancarias desde
  la lección. Axe no encontró infracciones en las vistas probadas.
- Reporte: `artifacts/class04-player-results.json`. Servidor aislado **4185**,
  SQLite en memoria; no se modificó el servidor manual4177.

Referencias: [parametrización](https://playwright.dev/docs/test-parameterize),
[aserciones de propiedades](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-js-property),
[validación HTML](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/validationMessage).
