# Clase 02 · Crear una práctica e iniciar sesión

Lección local: <http://127.0.0.1:4177/lecciones/crear-practica/>.

## Qué aprende el alumno

Continuación de la clase 01, con cinco capítulos y un reto independiente. El alumno
debe poder explicar qué acción realiza y qué resultado comprueba en cada paso:

1. Abrir `/`, elegir el perfil por etiqueta y valor con `selectOption('stable')`.
2. Pulsar Crear mi práctica y esperar el encabezado del acceso mediante una aserción.
3. Completar los campos por etiqueta con `fill`; reemplaza los valores precargados.
4. Iniciar sesión y verificar el saludo de Ana y su región de cuenta, no solo el clic.
5. Probar una contraseña incorrecta: error visible, formulario conservado y cuenta ausente.

El banco mantiene `/` en todo ese recorrido. No se usa `toHaveURL('/dashboard')`
ni se enseña una navegación que no existe. Las acciones usan sus comprobaciones
de disponibilidad y las aserciones web reintentan el resultado: no hay sleeps,
`force`, selectores posicionales, Page Objects ni preparación por API todavía.

El rechazo esperado debe dar un **test aprobado**. Estas comprobaciones de UI
no equivalen a una auditoría completa de autenticación o permisos del backend.
Cada test recibe un contexto limpio y crea una práctica; no depende de otro test.

## Fuentes ejecutables y materiales

- Guion: `lab/lessons/create-practice.json`.
- Referencia y reto: `lab/e2e/create-practice.spec.js` y `create-practice-challenge.spec.js`.
- Evidencia: `lab/e2e/create-practice-evidence.spec.js`.
- Página: `lab/public/practice-lesson.html`; reproductor compartido `lesson.js`.
- Ejercicio sin resolver y guía Git: `course/create-practice/`.
- Recursos servidos: `lab/public/lessons/create-practice/`.

Las capturas son del banco real local, con usuarios y dinero ficticios. La evidencia
incluye resultados y hashes de las fuentes e imágenes; el código mostrado y descargado
se extrae de los tests. No se simulan terminales exitosas ni resultados de ejecución.

```powershell
npm run lesson:capture:practice
npm run course:build
npm run check
npm test
npm run test:lesson
```

La captura y las suites usan **4178 y SQLite en memoria**. No tocan la práctica manual
de 4177. La reproducción sirve medios estáticos: no crea prácticas ni inicia sesión.
Al ejecutar los ejercicios, sí se crean prácticas ficticias en el banco local configurado.

## Progresión en el repositorio del alumno

Guardar la clase 01 y crear `clase/02-crear-practica` desde esa rama. No reinicializar
Git ni sobrescribir el intento con la solución. El ZIP inicio es un checkpoint opcional:
incluye smoke y los dos tests de clase 01 resueltos, más el ejercicio 02 con `test.skip`.

- Inicio sin completar: **3 passed y 1 skipped** (no afirmar que el omitido pasó).
- Al completar el caso de Ana: **4 passed**.
- Con el reto implementado: **5 passed**.

Los ZIPs usan listas explícitas y son reproducibles. Excluyen `.env`, credenciales reales,
sesiones, `.git`, dependencias y reportes. `ana@demo.test` y `Practica2026!` son fixtures
públicos del laboratorio. No se han publicado repos ni ramas remotas del curso.

## Voz y sincronización

Se reutiliza el clon propio de Juan, «J T», autorizado, con Eleven v4 en el plan existente.
Los originales quedan en `.lesson-tools/elevenlabs/create-practice/`, fuera del webroot
y del control de versiones. Reproducir la lección no consume créditos externos.

```powershell
python scripts/import-lesson-audio.py --lesson create-practice --model-dir RUTA_AL_MODELO_LOCAL
```

Entradas: `objetivo.mp3`, `preparar.mp3`, `acceder.mp3`, `comprobar.mp3`, `reto.mp3`.
La alineación usa Whisper local y genera quince cues y subtítulos VTT. Se exige duración
de 2–3 minutos y al menos 85% de alineación por escena; esto valida sincronización,
no sustituye la revisión auditiva de Juan.

## Siguiente clase

[Clase 03: depositar en la cuenta correcta](http://127.0.0.1:4177/lecciones/deposito-en-cuenta/):
localizadores dentro de una región, botones “Depositar” repetidos, formulario y comprobación
del cambio de saldo sin afectar la otra cuenta. Continúa el recorrido inicial antes del piloto avanzado.

Referencias oficiales: [acciones](https://playwright.dev/docs/input),
[localizadores](https://playwright.dev/docs/locators),
[auto-waiting](https://playwright.dev/docs/actionability) y
[aserciones](https://playwright.dev/docs/test-assertions).

## Verificación local · 7 de octubre de 2026

- Audio final: **169,792 segundos**; cinco capítulos y quince cues sincronizados.
- Alineación por escena: **95,18–100%**; transcripción local revisada contra el guion.
- `npm run check` y compilación sintáctica del importador Python: aprobados.
- `npm test`: **35 aprobados**, sin fallos.
- `npx playwright test`: **218 aprobados y 3 omitidos** preexistentes/intencionales
  (Service Worker en Firefox/WebKit y arrastre HTML5 en móvil). Incluye ambas clases,
  el piloto avanzado, el banco y los doce casos del reproductor 02 en los cuatro proyectos.
- `npm run test:visual`: **1 aprobado**, sin actualizar la baseline.
- ZIPs extraídos fuera del repo y `npm ci` limpio: inicio **3 aprobados / 1 omitido**;
  solución **5 aprobados**, contra una instancia separada en 4179 y memoria.
- Reproducción comprobada sin peticiones externas ni escrituras en el banco; sin
  errores de audio/JavaScript ni desborde horizontal en escritorio/móvil.
- ElevenLabs: **2.639 créditos** del plan existente; saldo mostrado al terminar **30.728**.
  Sin compras, recargas ni cambios de suscripción. La revisión auditiva final queda con Juan.
- Servidor manual de 4177 reiniciado para cargar las nuevas rutas, sin borrar su SQLite.
  Este reinicio invalida sesiones locales anteriores: si corresponde, volver a entrar.
- Sin commits, pushes ni despliegues a QA/producción.
