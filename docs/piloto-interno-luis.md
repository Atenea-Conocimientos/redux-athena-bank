# Piloto interno v0.1 — guía de Luis

Alcance: seis clases iniciales de Playwright sobre Athena Bank Lab. Luis realiza la prueba interna y Juan revisa el feedback. El caso avanzado es opcional; las clases 07–12 son una propuesta futura. No es una certificación del curso completo ni un despliegue de Atenea.

## Instalación desde cero

Requisitos: Git, Node.js 24 o superior, npm, navegador y conexión para descargar dependencias/Chromium. Acceso de lectura al repositorio de Atenea. No hacen falta MongoDB, Docker, Python, TTS, ElevenLabs ni claves de servicios.

En una carpeta nueva (no sobre una instalación previa):

```sh
git clone --branch codex/playwright-piloto-luis-v0.1 --single-branch https://github.com/Atenea-Conocimientos/redux-athena-bank.git athena-bank-piloto
cd athena-bank-piloto
git rev-parse HEAD
node --version
npm ci
npm run dev
```

Conservá esta terminal abierta. Abrí http://127.0.0.1:4177/api/health: debe indicar status ok, mode local-lab y realMoney false. Empezá en http://127.0.0.1:4177/lecciones/preparar-repositorio/ y seguí la clase 01. Los MP3, imágenes, subtítulos y ZIPs ya vienen incluidos; reproducirlos no consume créditos.

Usá exclusivamente los datos ficticios publicados por el laboratorio. El banco persiste en .lab-data, ignorado por Git. Las pruebas de mantenimiento usan otro puerto (4178) y una base en memoria. No cierres servidores ajenos ni apuntes las pruebas a QA o producción.

## Recorrido del alumno

Descargá el ZIP **inicio** de cada clase en una carpeta independiente del banco. Los ZIPs son acumulativos. No extraigas una solución encima de tu intento. En cada carpeta: `npm ci`, `npx playwright install chromium`, `npm test`. El banco debe seguir abierto en 4177. La solución se extrae en otra carpeta y también se ejecuta desde cero.

| Clase | Ruta después de /lecciones/ | Inicio: aprobadas / omitidas | Solución: aprobadas |
| --- | --- | --- | --- |
| 01 Primera prueba | primera-prueba/ | 1 / 1 | 3 |
| 02 Crear práctica y acceder | crear-practica/ | 3 / 1 | 5 |
| 03 Depósito correcto | deposito-en-cuenta/ | 5 / 1 | 7 |
| 04 Depósitos inválidos | depositos-invalidos/ | verificar con reporte | verificar con reporte |
| 05 Cotización | cotizar-transferencia/ | verificar con reporte | verificar con reporte |
| 06 Transferencia pendiente | confirmar-transferencia/ | verificar con reporte | verificar con reporte |

Un ejercicio omitido en inicio es intencional: implementalo y quitá .skip. No cuenta como aprobado. Leé la guía incluida en cada ZIP para los resultados exactos; la clase 04 incluye parametrización. El caso avanzado de transferencia-pendiente/ no sustituye la clase 06.

## Checklist de la sesión (registrar por clase)

- [ ] Registrar commit, Windows, Node/npm, navegador, fecha y tiempo dedicado.
- [ ] Instalar desde el clon limpio sin archivos de la PC de Juan; comprobar salud del banco.
- [ ] Seguir Paso 0 sin ayuda y distinguir carpeta del banco de carpeta de tests.
- [ ] Abrir cada clase desde la anterior y regresar sin perder el acceso al material.
- [ ] Reproducir la narración completa: volumen, pronunciación, pausas y correspondencia con subtítulos/código. Registrar segundo exacto de cualquier problema.
- [ ] Probar pausa, reanudación, búsqueda en la línea de tiempo y todos los capítulos; revisar imágenes y código completo, en escritorio y ventana estrecha.
- [ ] Completar el quiz con respuesta incorrecta y correcta; evaluar si el feedback explica el error.
- [ ] Leer transcripción; navegar por teclado y comprobar foco visible, zoom 200 % y ausencia de texto cortado.
- [ ] Descargar inicio, ejecutar y resolver el ejercicio sin consultar solución. Registrar dudas, supuestos y tiempo.
- [ ] Resolver el reto y comprobar su resultado observable; luego comparar con la solución en otra carpeta y ejecutarla.
- [ ] Verificar que las pruebas anteriores siguen pasando y que una aserción intencionalmente incorrecta falla con un diagnóstico comprensible.
- [ ] Reiniciar la práctica ficticia y repetir; comprobar que las pruebas no dependen del orden ni de datos previos.
- [ ] Cerrar con una valoración por clase: claridad, dificultad, audio y utilidad (1–5), más el mayor obstáculo.

Reservar aproximadamente dos horas para una primera exploración; extender si hace falta para escuchar y resolver las seis clases. Registrar tiempos reales, sin dar por completadas clases no recorridas.

## Reportar un problema

Copiar: título; clase/URL y segundo del audio; commit; entorno; pasos mínimos; esperado; observado; frecuencia; captura o trace; severidad (bloquea instalación / bloquea ejercicio / confunde / cosmético). Indicar si ocurre con inicio, intento propio o solución. Adjuntar solo datos ficticios; revisar capturas/traces antes de compartir. Entregar el reporte a Juan por el canal que acuerden; esta guía no envía mensajes automáticamente.

## Criterio para cerrar el piloto

Las seis clases y sus descargas deben poder recorrerse desde instalación limpia. No debe quedar un bloqueo de instalación, reproducción, quiz o ejercicio. Los resultados automáticos se registran aparte de la evaluación de Luis: audio decodificado no garantiza buena pronunciación, y axe no reemplaza la revisión manual de accesibilidad. Priorizar los hallazgos antes de ampliar el curso.

## Diagnóstico y mantenimiento

ECONNREFUSED: revisar la terminal del banco y 4177. Puerto ocupado: usar otra sesión/carpeta con un puerto local explícito y LAB_BASE_URL equivalente para tests; no finalizar procesos ajenos. Chromium faltante: instalarlo dentro del proyecto de pruebas. Node antiguo: actualizar a 24+ y reabrir terminal. No hace falta .env.

Para verificar el laboratorio: `npx playwright install chromium firefox webkit`, `npm run check`, `npm test`, `npm run test:all-browsers` y `npm run test:e2e`. Para regenerar ZIPs de forma determinista: `npm run course:build` y luego `npm test`.
