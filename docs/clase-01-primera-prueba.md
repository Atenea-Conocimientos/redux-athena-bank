# Clase 01 · Mi primera prueba con Playwright

Lección local: <http://127.0.0.1:4177/lecciones/primera-prueba/>.

## Objetivo y límites

Un principiante puede preparar su repo desde el Paso 0, observar una condición,
traducirla a un test y explicar un fallo. No necesita login, API, Page Objects ni
datos de cuentas. Esta clase **no** demuestra que crear una práctica funcione;
comprueba el título y que el botón esté visible y habilitado.

1. Leer la condición esperada en la bienvenida, sin pulsar el botón.
2. Entender `test`, `expect`, `page`, `async/await` y `goto`.
3. Diferenciar localizador, nombre accesible y aserción.
4. Cambiar el texto esperado para provocar un fallo; interpretar Expected/Received.
5. Restaurar el requisito, ejecutar, resolver el reto y guardar un commit.

El reto verifica el perfil Estable por defecto sin cambiarlo. Hay una pista y
una solución separada. El caso de transferencia pendiente continúa disponible,
rotulado como avanzado; no es el siguiente prerrequisito para principiantes.

## Materiales reproducibles

- `lab/lessons/first-test.json`: guion de cinco escenas y quince cues.
- `lab/e2e/first-test.spec.js`: referencia ejecutable y código mostrado/descargado.
- `lab/e2e/first-test-challenge.spec.js`: solución del reto.
- `lab/e2e/first-test-evidence.spec.js`: captura la bienvenida y el diagnóstico.
- `course/first-test/`: README y ejercicio omitido explícitamente con `test.skip`.
- `lab/public/lessons/first-test/`: medios, evidencias y ZIPs descargables.

El diagnóstico no es un mock: el harness ejecuta una aserción incorrecta, captura
su error y verifica Expected y Received. El harness pasa porque el fallo era
esperado. El resumen de éxito proviene del resultado JSON del test de referencia;
no se presenta como una captura de terminal. Los hashes permiten detectar evidencia
desactualizada. Los tiempos de ejecución son ejemplos, no objetivos de rendimiento.

```powershell
npm run lesson:capture:first
npm run course:build
npm test
npm run test:lesson
```

La captura usa 4178 y SQLite en memoria; no modifica la práctica manual en 4177.
Los ZIPs son listas explícitas de archivos, sin claves, sesiones, `.git` ni dependencias.
Inicio: 1 smoke aprobado y 1 ejercicio omitido. Solución: 3 aprobados.
El alumno trabaja en `clase/01-primera-prueba` de su propio repositorio.
No se publicaron repos ni ramas remotas de referencia.

## Voz y sincronización

Voz propia de Juan, clon autorizada «J T», Eleven v4. El guion se generó por escena
en ElevenLabs, usando el plan existente. Los MP3 originales quedan fuera del webroot
en `.lesson-tools/elevenlabs/first-test/` (ignorado por Git). Reproducir la clase
sirve el archivo local y no consume más créditos ni llama servicios externos.

Para volver a ensamblar, con Python/faster-whisper y FFmpeg instalados:

```powershell
python scripts/import-lesson-audio.py --lesson first-test --model-dir RUTA_AL_MODELO_LOCAL
```

Archivos de entrada: `objetivo.mp3`, `estructura.mp3`, `comprobar.mp3`, `fallo.mp3`,
`reto.mp3`. Usa timestamps locales de palabras, exige alineación >=85%, verifica
orden y duración 120–180 segundos y genera subtítulos VTT. La puntuación es una
comprobación de alineación, no una evaluación de naturalidad de la voz.
La configuración por defecto del script conserva la lección de transferencias.

## Continuación: clase 02

La siguiente lección local es [Crear una práctica e iniciar sesión](clase-02-crear-practica.md):
`getByLabel`, `fill`, `selectOption`, `click` y comprobar el cambio de pantalla.
La aplicación conserva la ruta `/` durante este flujo; no se enseña una navegación ficticia.
El reto independiente cubre contraseña incorrecta. La validación didáctica con un alumno real
sigue siendo recomendable antes de publicar el curso.

Fuentes: [escribir pruebas](https://playwright.dev/docs/writing-tests) y
[aserciones](https://playwright.dev/docs/test-assertions).

## Verificación local · 7 de octubre de 2026

- Audio final: 156,626 segundos, cinco escenas y quince cues sincronizados.
- Alineación local por escena: 93,2–97,3%; es una métrica de sincronización.
- `npm test`: 31 aprobados, cero fallos.
- `npm run check` y prueba visual del dashboard: aprobados, sin actualizar el baseline.
- `npx playwright test`: 190 aprobados y 3 omitidos preexistentes (Service Worker
  en Firefox/WebKit y arrastre HTML5 en móvil). Incluye ambas lecciones, controles,
  descargas, código real, diagnóstico, accesibilidad y ausencia de peticiones externas.
- ZIPs extraídos fuera del repo, `npm ci` limpio: inicio 1 aprobado/1 omitido;
  solución 3 aprobados, contra un banco en memoria separado en 4179.
- La reproducción no modifica datos del banco; la práctica manual de 4177 se conserva.
- Generación de esta clase: 2.453 créditos del plan existente de ElevenLabs;
  saldo mostrado al finalizar: 33.367. No se compraron planes ni recargas.
- Sin commits, pushes ni despliegues. La revisión auditiva final del curso queda con Juan.
