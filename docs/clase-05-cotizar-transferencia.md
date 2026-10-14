# Clase 05 · Cotizar antes de confirmar

Página local: <http://127.0.0.1:4177/lecciones/cotizar-transferencia/>.
Continuación de clase 04 en `clase/05-cotizar-transferencia` del repo del alumno.

## Escenarios y límites

| Caso | Origen / destino | Importe | Comisión | Total a reservar |
|---|---|---:|---:|---:|
| Principal | ana.diaria → bruno.diaria | $100 | $1 | $101 |
| Reto independiente | ana.diaria → ana.ahorro | $100 | $0 | $100 |

Cada test crea su propia práctica estable por la UI e inicia sesión como Ana.
Se comprueban diaria $2.500 y ahorro $600. El test **no confirma**, no completa OTP
ni procesa transferencias. Tras cerrar la cotización y recargar, verifica ambos
saldos originales y la ausencia de transferencias. Recargar obliga a leer de nuevo
el estado del servidor y evita limitar la prueba a tarjetas detrás del diálogo.

Cotizar crea una propuesta temporal en el banco, pero no una reserva ni una
transferencia. Cerrar su diálogo no significa cancelar una operación pendiente.
No se hacen afirmaciones sobre expiración, OTP, concurrencia o integridad contable
exhaustiva: se cubren costos y ausencia de movimientos por consultar.

## Conceptos de Playwright

- Diálogos `Nueva transferencia` y `Confirmar transferencia` con búsquedas acotadas.
- `getByLabel('Cuenta de origen').selectOption('ana-main')`: aquí seleccionar el
  origen es parte intencional del caso, no se oculta una preselección incorrecta.
- `await test.step`: acciones y aserciones agrupadas semánticamente en el reporte,
  dentro del mismo test. No crea aislamiento, sesión ni prueba independiente.
- `getByRole('term')` / `getByRole('definition')` con `toHaveText([...])` comprueban
  cantidad, orden y contenido del desglose real `<dl><dt>…<dd>…`.
- Saldos acotados a regiones y aserciones con reintento después de `page.reload()`.

Todo el dinero y las credenciales son fixtures públicos del laboratorio.

## Fuentes y artefactos

- Guion de 5 escenas y 15 cues: `lab/lessons/transfer-quote.json`.
- Página: `lab/public/quote-lesson.html`, reproductor compartido, quiz y reto.
- Ejecutables: `lab/e2e/transfer-quote.spec.js`, `transfer-quote-challenge.spec.js`.
- Capturas reales: `lab/e2e/transfer-quote-evidence.spec.js`.
- Generador: `scripts/capture-quote-lesson.cjs`.
- Configuración aislada: `scripts/playwright.quote-capture.config.cjs`.
- Inicio y guía: `course/transfer-quote/`.
- Recursos locales: `lab/public/lessons/transfer-quote/`.

```powershell
node scripts/capture-quote-lesson.cjs
npm run course:build
```

La captura usa **4185**, SQLite `:memory:` y dos workers. `QUOTE_LESSON_PORT` permite
elegir otro puerto local. No modifica la práctica manual de 4177 ni utiliza 4178.
Genera capturas `before`, `form`, `quote`, `after`, `challenge`; extrae código de
fuentes ejecutadas y registra hashes/resultados en `evidence.json`.
El constructor de ZIPs se ejecuta aparte cuando todos los materiales acumulativos
están disponibles. No se accede a datos bancarios al reproducir la página.

## Material acumulativo

- Inicio: once tests previos resueltos y un `test.skip`: **11 passed / 1 skipped**.
- Principal: **12 passed**.
- Principal y reto: **13 passed**.

El constructor usa listas explícitas y no distribuye `.env`, sesiones, `.git`,
dependencias ni reportes. El reto se ofrece como descarga bajo “Ya hice mi intento”;
la escena del reto muestra la preparación, no su solución automática.

## Narración

Voz propia de Juan autorizada; el agente principal genera los MP3 con ElevenLabs.
Originales en `.lesson-tools/elevenlabs/transfer-quote/`: `objetivo.mp3`,
`formulario.mp3`, `desglose.mp3`, `cancelar.mp3`, `reto.mp3`.
El importador local alinea texto y audio y publica MP3, manifiesto y VTT.
No se genera TTS ni se consumen créditos al reproducir los archivos locales.

## Evidencia de implementación

Primera captura ejecutada el 8/10/2026: **5 passed**, cuatro casos más setup,
Chromium, servidor aislado 4185. Reporte: `test-results/class05/results.json`.
Las verificaciones de audio y ZIPs acumulativos se detallan en las siguientes secciones.

## ZIPs verificados desde carpetas limpias · 8/10/2026

Los dos paquetes se extrajeron en carpetas temporales independientes y cada uno
ejecutó `npm ci` (cero vulnerabilidades reportadas). Se probaron con Chromium,
un worker y `LAB_BASE_URL=http://127.0.0.1:4184`, contra un servidor aislado propio
del Lab con SQLite en memoria. Sin fixtures ni helpers privados del repositorio.

- Inicio: **11 passed / 1 skipped**, el ejercicio nuevo omitido intencionalmente.
- Solución: **13 passed**, sin omisiones, fallos ni reintentos.
- Comando: `npm test -- --workers=1 --reporter=list,json`.
- Reportes: `%TEMP%/athena-classes04-06-zips-5e1fbca1636b4a17bef79ebda0dfe0f3/`
  con `clase-05-inicio/results.json` y `clase-05-solucion/results.json`.
- El servidor temporal se detuvo al terminar los seis paquetes04–06.
  No se modificó ni reinició el servidor manual4177.

## Integración verificada · 8/10/2026

- Narración local: **150,148 segundos (2:30)**, cinco capítulos y quince cues;
  alineación automática entre **96,67% y 100%**. La aprobación de naturalidad
  y calidad de la voz corresponde a Juan.
- Pruebas nativas de fuentes, audio, subtítulos, ZIPs, rutas y rangos: **4/4**.
- Reproductor en Chromium, Firefox, WebKit y móvil, un worker: **12/12**.
  Se verificaron audio real, capítulos, fragmentos completos sin recorte,
  quiz, reto, descargas exactas y continuidad desde la clase04.
- Sin errores JavaScript, solicitudes externas ni escrituras bancarias desde
  la lección. Axe no encontró infracciones en las vistas probadas.
- Reporte: `artifacts/class05-player-results.json`. Servidor aislado **4185**,
  SQLite en memoria; no se modificó el servidor manual4177.

Referencias oficiales: [test.step](https://playwright.dev/docs/api/class-test#test-step),
[localizadores por rol](https://playwright.dev/docs/locators#locate-by-role),
[toHaveText](https://playwright.dev/docs/api/class-locatorassertions#locator-assertions-to-have-text).
