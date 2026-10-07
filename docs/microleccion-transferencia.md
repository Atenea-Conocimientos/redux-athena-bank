# Microlección 01: cómo comprobar una transferencia pendiente

Piloto **local**, 2 minutos y 35 segundos, programado en HTML/CSS/JS. No es un MP4 ni una grabación interactiva del usuario. Alterna **capturas obtenidas de una prueba real** con fragmentos de esa misma prueba. La voz sintética en español se generó localmente con Kokoro (Dora / `ef_dora`); no utiliza ElevenLabs, API de voz, claves ni suscripciones.

## Verla

```sh
npm ci
npm run dev
```

Abrí <http://127.0.0.1:4177/lecciones/transferencia-pendiente/> o **Laboratorio → Ver microlección**. No hace falta sesión para verla. El audio MP3 y las capturas ya están incluidos (aproximadamente 2 MB en total), por lo que **no hay que instalar Python ni bajar modelos para reproducirla**.

- Reproducir/pausar, repetir, retroceder 10 segundos, cambiar velocidad y silenciar.
- Siete capítulos; el audio gobierna los subtítulos y los cambios de pantalla/código.
- Los botones Pantalla/Código permiten inspeccionar la otra vista; al comenzar la próxima frase vuelve la vista prevista por el guion.
- Subtítulos visibles por defecto; transcripción completa y descarga VTT.
- Fragmentos de código reales y prueba completa descargable.
- Quiz con feedback y un reto de cancelación de $200.
- Sin autoplay ni peticiones a servicios externos. La reproducción no crea ni modifica prácticas, sesiones ni transferencias.
- Si el audio no puede cargarse, capítulos, código y lectura siguen disponibles.

La voz es **sintética**, no una imitación de Juan. Tiene pronunciación española, no un acento argentino garantizado. El piloto queda sujeto a la revisión de Juan sobre dicción, ritmo y tono antes de escalar a un curso. No se ha realizado una evaluación auditiva humana del resultado.

## Qué se enseña y de dónde sale la evidencia

Se crea una práctica **estable y nueva**, independiente de la práctica manual:

1. Ana tiene $2.500 en `ana.diaria`; Bruno tiene $1.200 en `bruno.diaria`.
2. Ana cotiza $100 al alias de Bruno. Comisión externa del 1%, mínimo $1: total $101.
3. Confirmar con OTP ficticio `246810` deja la operación **Pendiente**. No se pulsa Procesar.
4. La cuenta de Ana conserva $2.500 contables, reserva $101 y tiene $2.399 disponibles.
5. En otro `BrowserContext`, Bruno conserva $1.200: no hay acreditación anticipada.

La API devuelve **centavos enteros**. La lección distingue saldo de una cuenta del total de Ana (que también tiene una cuenta de ahorro).

La prueba autocontenida está en `lab/e2e/pending-lesson.spec.js`. Genera y limpia su propia práctica con la API, abre una sesión separada de Bruno y verifica UI y API. Su archivo descargable es una copia exacta; los fragmentos se extraen de las marcas `@snippet` / `@end`. `evidence.json` registra fecha, versión de Playwright y hash del código, sin cookies ni identificadores de sesión.

Para ejecutarla dentro de este repositorio:

```sh
npx playwright install chromium firefox webkit
npm run test:lesson
```

La referencia ya existe en `lab/e2e/`: no agregues otra copia descargada en esa carpeta porque se ejecutaría dos veces. Usa la descarga para consultar o adaptar el ejemplo en otro proyecto; allí necesitarás instalar Playwright y configurar `baseURL` y un servidor del laboratorio.

## Cambiar capturas o código

```sh
npm run lesson:capture
```

El comando ejecuta la referencia en Chromium con el servidor de pruebas **4178**, SQLite **en memoria**. No toca el servidor manual 4177 ni `.lab-data/bank.sqlite`. Si la prueba falla, el comando falla. Después de cambiar el código de referencia, regenerá capturas/fragmentos: el test de integridad detecta copias desactualizadas.

## Cambiar guion y regenerar la voz

Fuente: `lab/lessons/pending-transfer.json`. Define capítulos, frases, captura asociada y el primer índice de frase que muestra código (`codeFromCue`, base cero). La línea de tiempo se calcula con la duración real de cada segmento de audio, no con tiempos estimados. El generador exige una duración total de 120 a 180 segundos.

Herramientas opcionales para **regenerar**, no para reproducir: Python 3.12, FFmpeg con `libmp3lame` en PATH y los paquetes de `scripts/lesson-audio-requirements.txt`. Todo se instala en un entorno virtual separado, ignorado por Git.

En PowerShell, desde la raíz:

```powershell
python -m venv .lesson-tools/venv
& .lesson-tools/venv/Scripts/python.exe -m pip install -r scripts/lesson-audio-requirements.txt
New-Item -ItemType Directory -Force .lesson-tools/models
$lessonRelease = 'https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.1'
Invoke-WebRequest "$lessonRelease/kokoro-v1.0.int8.onnx" -OutFile .lesson-tools/models/kokoro-v1.0.int8.onnx
Invoke-WebRequest "$lessonRelease/voices-v1.0.bin" -OutFile .lesson-tools/models/voices-v1.0.bin
& .lesson-tools/venv/Scripts/python.exe scripts/generate-lesson-audio.py
```

Las dos descargas oficiales suman aproximadamente **142 MB**. Después de instalarlas, la síntesis funciona sin Internet. El script comprueba SHA-256 contra los publicados en el release antes de cargar los modelos. Cachea los segmentos en `.lesson-tools/segments/`: un cambio visual no vuelve a sintetizar todas las frases. No subir modelos, entorno virtual ni WAV intermedios a Git.

Genera:

- `narration.mp3`: mono, 24 kHz, 96 kbps, normalización de pico a 0,90 antes de la compresión.
- `lesson.json`: escenas, cues, duración real y hash de la fuente.
- `subtitles.vtt`: subtítulos segmentados por frase, no transcripción automática.

Si cambiás la duración, actualizá también el texto de acceso en `lab/public/app.js`. Una sustitución por voz humana necesita nuevos tiempos de cues; no reemplazar solo el MP3 conservando tiempos anteriores.

## Fuentes y atribuciones

- [Kokoro-82M, hexgrad](https://huggingface.co/hexgrad/Kokoro-82M): pesos Apache-2.0; el modelo no se redistribuye en este repositorio.
- [kokoro-onnx, thewh1teagle](https://github.com/thewh1teagle/kokoro-onnx): implementación MIT, versión 0.6.1 utilizada para la síntesis.
- [Release de los modelos ONNX](https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1): modelo int8 y banco de voces v1.0, hashes en el generador.
- El entorno de síntesis también utiliza ONNX Runtime, NumPy, SoundFile, Phonemizer y eSpeak NG. Conservan sus licencias respectivas; no se distribuyen los binarios del entorno de síntesis.
- Guion y capturas: esta implementación de Athena Bank Lab, con cuentas y dinero ficticios.

## Verificación

```sh
npm run check
npm test
npm run test:lesson
npx playwright test
npm run test:visual
```

`lesson.test.cjs` comprueba integridad de guion/código/capturas, duración, cues y rangos HTTP para el audio (GET/HEAD/206/416). `lesson-player.spec.js` cubre reproducción real, capítulos, teclado, quiz, descarga, accesibilidad axe, pantalla móvil y fallback sin audio. La revisión visual utiliza capturas de escritorio y móvil en `artifacts/` (ignoradas por Git).

No se agregó persistencia de avance, integración con cursos de Atenea, exportación MP4 ni publicación. Este piloto valida primero el formato.

### Resultado local — 7 de octubre de 2026

- `npm run check`: correcto; el generador Python también compila con `py_compile`.
- `npm test`: **25/25**.
- `npm run test:lesson`: **17/17**, incluyendo setup, Chromium, Firefox, WebKit y móvil Pixel 7.
- `npx playwright test --grep-invert microlección`: **150 aprobadas, 3 omitidas**. Son las omisiones preexistentes: Service Worker en Firefox/WebKit y arrastre HTML5 en móvil.
- `npm run test:visual`: **1/1**, sin cambiar el baseline del dashboard.
- Capturas revisadas en escritorio (1440 px) y móvil; axe sin violaciones en la pantalla probada.
- Audio final: **155,096 segundos**, MP3 local. Reproducción, avance, pausa, cambio de capítulo y repetición probados en los cuatro proyectos. La calidad de la voz requiere la escucha y aprobación del autor.
