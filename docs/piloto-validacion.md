# Evidencia del piloto v0.1 — 14 de octubre de 2026

Preparación técnica lista para la evaluación interna de Luis. No equivale a su aceptación pedagógica ni autoriza publicación comercial o despliegue.

## Entorno y reproducibilidad

Windows, Node.js 24.14.0, Playwright 1.63.0. Rama codex/playwright-piloto-luis-v0.1. Se preservó el trabajo existente del laboratorio y las seis clases. No se modificó la plataforma atenea-conocimientos, QA ni producción.

Se creó un clon independiente sin node_modules ni archivos ignorados. El primer clon reveló diferencias CRLF/LF en los recursos descargables; se corrigieron mediante .gitattributes en a0c81de. Un segundo clon desde ese commit pasó npm ci, npm run check y las 51 pruebas. npm ci informó cero vulnerabilidades. Los navegadores de Playwright ya estaban instalados en la PC; su descarga en otra máquina requiere conexión.

## Resultados

- npm run check: aprobado.
- npm test: 51 aprobadas, cero fallos; incluye integridad de audio, subtítulos, guiones, código, ZIPs deterministas, rangos HTTP y descargas.
- Chromium + Pixel 7 emulado: 170 aprobadas, 1 omisión prevista (drag HTML5 móvil), cero fallos, 50.7 segundos.
- Firefox + WebKit desde el clon limpio: 169 aprobadas, 2 omisiones previstas (Service Worker en esos motores), cero fallos, 1.7 minutos.
- Las suites recorren reproductores, capítulos, pausa/reanudación, códigos e imágenes, transcripciones, quizzes correctos/incorrectos, pistas, soluciones, descargas, continuidad de clases, escenarios y retos reales, y accesibilidad automática. Los tests de clases verifican ausencia de escrituras bancarias durante la reproducción.
- 14 ZIPs extraídos en carpetas independientes: npm ci y npm test aprobados en cada una contra una base ficticia en memoria en 4179. No se usaron archivos privados del instructor ni dependencias copiadas a los ZIPs.
- MP3 completos decodificados por AudioContext: clases 01–06 de 156.626, 169.792, 169.844, 144.323, 150.148 y 156.078 segundos; caso avanzado 166.165 segundos. No se consumieron créditos TTS.
- Inspección visual de la clase 01 en escritorio y clase 06 en móvil: estructura, contenido y controles visibles. La suite comprueba escenas sin desbordes y análisis axe.
- Últimos cambios posteriores a a0c81de: documentación de resultados y números esperados; regeneración de los dos ZIPs avanzados por una corrección de README. Las 51 pruebas de integridad se repitieron y aprobaron. No cambió código de ejecución.

| Material | Inicio: aprobadas / omitidas | Solución: aprobadas / omitidas |
| --- | --- | --- |
| Clase 01 | 1 / 1 | 3 / 0 |
| Clase 02 | 3 / 1 | 5 / 0 |
| Clase 03 | 5 / 1 | 7 / 0 |
| Clase 04 | 7 / 3 | 11 / 0 |
| Clase 05 | 11 / 1 | 13 / 0 |
| Clase 06 | 13 / 1 | 15 / 0 |
| Caso avanzado | 1 / 1 | 2 / 0 |

Las omisiones en los ZIPs de inicio son ejercicios deliberadamente pendientes, no resultados aprobados.

## Revisión pendiente propia del piloto

Luis debe ejecutar el checklist de piloto-interno-luis.md desde su PC y reportar claridad, dificultad, tiempos y problemas. Juan conserva la escucha final de sus narraciones; la decodificación y sincronización automática no certifican pronunciación ni calidad pedagógica. La revisión manual con lector de pantalla no se realizó. El arrastre HTML5 móvil y Service Worker Firefox/WebKit permanecen fuera de la cobertura indicada; no bloquean las seis clases.

No se enviaron invitaciones ni mensajes a testers. Isaac no participa de este piloto. No se hicieron merges, despliegues, cambios de credenciales ni compras. El workflow disponible es de pruebas, con pull_request y ejecución manual; subir esta rama no despliega servicios.
