# Clase 03 · Depositar en la cuenta correcta

Lección local: <http://127.0.0.1:4177/lecciones/deposito-en-cuenta/>.

## Objetivo y condiciones

Continuar desde clase 02 en el repo de automatización del alumno, con el banco local
encendido. Dinero y credenciales ficticios. Cada caso crea su propia práctica estable
por la UI y entra como Ana; no usa sesiones personales ni depende del test anterior.

| Caso | Estado inicial | Acción | Resultado esperado |
|---|---|---|---|
| Referencia | Diaria $2.500 / ahorro $600 | Depositar $100 en diaria | Diaria $2.600 / ahorro $600 |
| Reto independiente | Diaria $2.500 / ahorro $600 | Depositar $50 en ahorro | Diaria $2.500 / ahorro $650 |

El banco almacena centavos, pero la interfaz recibe pesos y muestra ARS con formato
es-AR: `$ 2.500,00`. Playwright normaliza el espacio de la moneda al buscar el texto.
El saldo comprobado es el **disponible de la tarjeta**, no una suma global ni un toast.

## Qué enseña

1. Un nombre exacto puede seguir siendo ambiguo: hay dos botones Depositar.
2. Buscar la región `Cuenta ana.diaria`, con `exact: true`, y encadenar su botón.
3. Evitar `.first()`/`.nth()` como sustituto de identificar la cuenta deseada.
4. Localizar desde `page` el diálogo, que está fuera de la tarjeta en el DOM.
5. Verificar `Cuenta para depósito` con `toHaveValue('ana-main')` (reto: `ana-save`).
   No cambiar el selector: eso ocultaría una preselección incorrecta de la aplicación.
6. Completar el importe, enviar y esperar el saldo nuevo; luego verificar el otro saldo.
7. Reutilizar localizadores tras el render y aserciones con reintento, sin pausas fijas.

Las comprobaciones iniciales explicitan las precondiciones. Comprobar primero el cambio
esperado evita que el saldo que no cambia apruebe antes de procesarse la operación.
No es una auditoría de integridad contable o concurrencia: es un caso inicial de UI.

## Material y evidencia

- Guion: `lab/lessons/account-deposit.json`, cinco escenas y quince subtítulos.
- Prueba y reto: `lab/e2e/account-deposit.spec.js`, `account-deposit-challenge.spec.js`.
- Capturas y diagnóstico: `lab/e2e/account-deposit-evidence.spec.js`.
- Página: `lab/public/deposit-lesson.html`, reproductor compartido.
- Ejercicio y guía del alumno: `course/account-deposit/`.
- Recursos publicados localmente: `lab/public/lessons/account-deposit/`.

El código se extrae de fuentes ejecutadas; las imágenes son del banco real local.
El arnés también verifica el rechazo por strictness del clic global ambiguo.
`evidence.json` conserva resultados y hashes de fuentes/capturas, sin sesiones ni claves.

```powershell
npm run lesson:capture:deposit
npm run course:build
npm run check
npm test
npm run test:lesson
```

Las suites usan 4178 y SQLite en memoria. No alteran la práctica manual de 4177.
Reproducir la lección solo lee recursos estáticos; no ejecuta depósitos ni llama a TTS.

## Repo acumulativo

Guardar clase 02, crear `clase/03-deposito-en-cuenta` desde esa rama y agregar el test.
No reinicializar Git ni reemplazar el intento con la solución. ZIPs opcionales:

- Inicio: cinco tests previos resueltos y un ejercicio con `test.skip`: **5 passed / 1 skipped**.
- Caso principal resuelto: **6 passed**.
- Solución con reto: **7 passed**.

Las listas explícitas excluyen `.env`, sesiones, `.git`, dependencias y reportes.
Los datos de acceso de Ana son fixtures públicos. Ramas remotas no publicadas.

## Voz y regeneración

Voz propia de Juan autorizada, J T, Eleven v4. Originales fuera del webroot y Git:
`.lesson-tools/elevenlabs/account-deposit/` con `objetivo.mp3`, `localizar.mp3`,
`depositar.mp3`, `comprobar.mp3`, `reto.mp3`.

```powershell
python scripts/import-lesson-audio.py --lesson account-deposit --model-dir RUTA_AL_MODELO_LOCAL
```

Whisper local alinea los subtítulos. Requiere 120–180 segundos y cobertura mínima de
85% por escena; la cobertura numérica se excluye del cálculo, por lo que los importes
deben contrastarse por separado contra la transcripción. La revisión auditiva final es de Juan.

## Verificación local · 8 de octubre de 2026

- Narración: **169,84 segundos (2:49)**, cinco capítulos y quince subtítulos.
- Alineación local por escena: entre **92,2% y 98,8%**. Se contrastaron por separado
  los importes de las transcripciones: 2.500, 600, 100, 2.600, 50 y 650 pesos.
- ElevenLabs: **2.682 créditos** utilizados; saldo mostrado al finalizar: **28.046**.
  Sin recargas, compras ni cambios de plan. Reproducir los MP3 locales no consume créditos.
- Material extraído en carpetas limpias e instalado con `npm ci`: inicio **5 passed /
  1 skipped** (ejercicio intencional), solución **7 passed**.
- Captura del banco y diagnóstico de localizador ambiguo: **5 passed**, incluido setup.
- `npm run check` y compilación sintáctica del importador Python: correctos.
- `npm test`: **39/39**. Los recursos, hashes, subtítulos, ZIPs, rutas y rangos de audio
  quedan cubiertos por las pruebas automáticas.
- Regresión E2E en Chromium, Firefox, WebKit y móvil: primera pasada **243 passed /
  3 skipped / 3 failed**. Los **28 casos nuevos de clase 03** aprobaron en esa pasada.
  Los tres fallos fueron timeouts de infraestructura de Firefox en ejercicios previos
  de red y capacidades del navegador; al repetirlos con un worker, **3/3 aprobaron**
  (más el setup). No se modificaron esos tests ni se ocultó el resultado inicial.
  Reporte original: `artifacts/class03-all-browsers-results.json`; trazas originales:
  `artifacts/class03-initial-e2e/`; reejecución: `artifacts/class03-firefox-retry-results.json`.
- Regresión visual: **1/1**, sin actualizar referencias. Revisadas las vistas de
  escritorio y móvil, reproducción del MP3, descargas y ausencia de solicitudes
  externas o escrituras bancarias desde la lección.
- Tras compactar el marco móvil de clase 03, reejecución final con dos workers:
  **28/28 casos de la clase + setup**, sin fallos ni omisiones. Se comprueba el alto
  del marco y que ningún fragmento de código quede recortado. Reporte:
  `artifacts/class03-final-results.json`.

Solo se modificó y ejecutó el laboratorio local. No hay publicación, PR ni despliegue
a QA o producción en esta entrega.

## Siguiente paso propuesto

Clase 04: [importes inválidos y comprobación de saldos sin cambios](clase-04-depositos-invalidos.md),
ya implementada en el recorrido local.

Referencias: [localizadores](https://playwright.dev/docs/locators),
[unicidad](https://playwright.dev/docs/locators#strictness),
[aserciones](https://playwright.dev/docs/test-assertions).
