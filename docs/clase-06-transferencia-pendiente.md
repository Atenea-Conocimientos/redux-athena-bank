# Clase 06 · Confirmar no es completar

Página local: <http://127.0.0.1:4177/lecciones/confirmar-transferencia/>.
Continúa la clase 05; no reemplaza ni duplica el piloto avanzado de transferencia
pendiente, que además prepara datos por API y verifica otro BrowserContext.

## Contrato didáctico

Práctica estable nueva por cada test, creada por UI, acceso como Ana. Dinero y
credenciales son fixtures públicos. Se comprueba la sesión de Ana únicamente.

| Caso | Acción | Resultado esperado |
|---|---|---|
| Referencia | Cotizar 100 a bruno.diaria; confirmar con 246810 | Un artículo Pendiente, comisión 1, total 101; diaria disponible 2.399/reservado 101; ahorro 600 |
| Resumen de referencia | Volver al inicio | Contable 3.100, reservado 101, disponible 2.999 |
| Reto independiente | Misma cotización, confirmar con 000000 | Error dentro del diálogo; tras cerrarlo y recargar, cero artículos, diaria 2.500, ahorro 600, reserva 0 y disponible total 3.100 |

No pulsar Procesar. El contrato establece que pendiente todavía no acredita a Bruno,
pero el test **no dice haberlo verificado** porque no observa su sesión. No se hacen
operaciones bancarias reales ni llamadas de API para crear la práctica o comprobar saldos.

## Qué enseña

- Diferenciar la acción confirmada del estado final: cierre del diálogo no basta.
- Aserciones con reintento de cantidad, identidad, estado, comisión y total.
- Acotar un artículo por nombre accesible con alias y sufijo dinámico; regex anclada,
  punto literal, sin `.first()` ni identificadores inventados.
- Reutilizar localizadores de cuenta luego de navegar.
- Diferenciar disponible de una cuenta, disponible total, contable y reservado.
- `getByTestId('available-total')` como contrato explícito existente de la aplicación.
- Rechazo del código válido en formato pero incorrecto en valor; error + ausencia de efectos.
- Esperar error y resumen cargado antes de afirmar que no hay artículos.

No cubre concurrencia, idempotencia, API, sesión del receptor ni invariantes de toda
la base de datos. Esas competencias siguen en el laboratorio avanzado.

## Fuentes y evidencia

- `lab/lessons/confirm-transfer.json`: cinco escenas, quince cues.
- `lab/public/confirm-lesson.html`: reproductor compartido y material escrito.
- `lab/e2e/confirm-transfer.spec.js`: referencia autónoma y snippets.
- `lab/e2e/confirm-transfer-challenge.spec.js`: reto autónomo.
- `lab/e2e/confirm-transfer-evidence.spec.js`: dos diagnósticos con capturas reales.
- `scripts/capture-confirm-lesson.cjs`: ejecuta cuatro casos, valida resultados,
  extrae snippets exactos y genera hashes de fuentes y capturas en `evidence.json`.
- `course/confirm-transfer/`: guía y ejercicio pendiente.

```sh
node scripts/capture-confirm-lesson.cjs
npm run course:build
```

Por defecto usa configuración de proyecto y puerto 4178 aislado. Para evitar otros
trabajos concurrentes admite `CONFIRM_LESSON_CONFIG`, `CONFIRM_LESSON_REPORT` y
`CONFIRM_LESSON_PORT`; la evidencia registra el puerto utilizado. No modifica 4177.

Capturas: `quote.png`, `pending.png`, `balances.png`, `rejected.png`. Código y recursos
publicados bajo `lab/public/lessons/confirm-transfer/`, sin sesiones, claves ni datos
personales. El reproductor solo lee archivos estáticos y nunca confirma una transferencia.

## Material acumulativo

Rama propuesta del alumno: `clase/06-confirmar-transferencia`, desde clase 05 resuelta.
No se publica ninguna rama ni se crea PR automáticamente.

- Inicio: 13 tests anteriores + ejercicio omitido: **13 passed / 1 skipped**.
- Ejercicio principal resuelto: **14 passed**.
- Solución con reto independiente: **15 passed**.

Los ZIP incluyen listas explícitas de archivos. Copiar solo el nuevo ejercicio
cuando el alumno ya tiene repo; comparar solución en otra carpeta, nunca sobrescribir.

## Voz

Voz autorizada de Juan clonada con IA, anunciada en la página. Originales fuera del
webroot/Git en `.lesson-tools/elevenlabs/confirm-transfer/`; nombres de escena
`objetivo`, `confirmar`, `operacion`, `saldos`, `reto`.
Importador compartido genera MP3, manifiesto y VTT alineados localmente.
Reproducir no consume créditos de generación. La revisión auditiva final corresponde a Juan.

## Verificación inicial

El 8 de octubre de 2026, los cuatro casos de referencia/reto/evidencia aprobaron en
Chromium con servidor aislado 4186 y SQLite en memoria. Las capturas y hashes se
generaron de esa ejecución. Los mismos cuatro casos aprobaron después en Chromium,
Firefox, WebKit y móvil: **16/16**, sin reintentos (17,8 segundos). Reporte aislado
`test-results/class06/results.json`.

## Voz y reproductor integrados · 8/10/2026

- Voz local: **156,078 segundos (2:36)**, cinco capítulos, quince subtítulos.
- Alineación por escena: **89,7%–98,6%**. El porcentaje mide alineación textual,
  no sustituye la revisión auditiva de Juan ni prueba los importes pronunciados.
- Verificación nativa integrada: **51/51** pruebas del repositorio aprobadas,
  incluidas las cuatro de clase 06 (hashes, tiempos, recursos, ZIPs y rutas).
- Reproductor de clase 06: **12/12**, sin reintentos, Chromium/Firefox/WebKit/móvil,
  un worker, puerto aislado **4186**, SQLite en memoria (39 segundos).
  Reporte: `artifacts/class06-player-results.json`.
- Comprobado: avance de audio, cinco capítulos y código exacto, quiz, descargas,
  transcripción, teclado, continuidad 05→06, sin violaciones Axe ni errores de
  página, solicitudes externas o escrituras bancarias.
- Capturas visuales locales: `artifacts/class06-desktop-preview.png`,
  `artifacts/class06-mobile-balances-preview.png` y
  `artifacts/class06-mobile-code-preview.png`.
- A 412 px, el snippet de saldos cabe completo en 344 × 347 px: fuente 11 px,
  interlínea 19,8 px, sin desbordes horizontales ni recorte vertical. El resumen
  de pantalla es ilustrativo en móvil; el detalle de importes también se expresa
  en texto accesible, subtítulos y código.
- Dos comprobaciones visuales adicionales en Chromium: **2/2**. No se modificó
  el servidor manual 4177 ni la práctica del usuario.

## ZIPs verificados desde carpetas limpias · 8/10/2026

Ambos paquetes se extrajeron en carpetas temporales independientes. Cada uno
ejecutó `npm ci` (cero vulnerabilidades reportadas) y sus tests con Chromium y
un worker contra un servidor propio del Lab en4184, con SQLite en memoria y
`LAB_BASE_URL=http://127.0.0.1:4184`. Sin helpers ni fixtures privados del repo.

- Inicio: **13 passed / 1 skipped**, ejercicio nuevo omitido intencionalmente.
- Solución: **15 passed**, sin omisiones, fallos ni reintentos.
- Comando: `npm test -- --workers=1 --reporter=list,json`.
- Reportes: `%TEMP%/athena-classes04-06-zips-5e1fbca1636b4a17bef79ebda0dfe0f3/`
  con `clase-06-inicio/results.json` y `clase-06-solucion/results.json`.
- El servidor temporal se detuvo al finalizar; el manual4177 no se tocó.

Clase 07 sugerida: cancelación y liberación de reserva; expresamente no implementada.
Referencias: <https://playwright.dev/docs/locators>,
<https://playwright.dev/docs/test-assertions>,
<https://playwright.dev/docs/locators#locate-by-test-id>.
