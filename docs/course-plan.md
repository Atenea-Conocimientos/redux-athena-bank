# Athena Bank Lab — propuesta de curso y backlog didáctico

## Promesa concreta

**Diseñar, automatizar y depurar pruebas de un banco ficticio, incluyendo fallos que un happy path no detecta.**

No prometer dominio de “todo Playwright”, empleo ni seguridad bancaria profesional. El valor no es mostrar más métodos: es enseñar a elegir qué probar, construir el resultado esperado, preparar datos y explicar un fallo con evidencia.

Formato propuesto (a validar con Juan): cuatro encuentros en vivo de unas dos horas + retos entre encuentros. Puede dividirse en ocho módulos asincrónicos. Antes de venderlo, hacer un piloto con Isaac y Luis y medir tiempos reales; todavía no es un curso grabado ni una oferta comercial publicada.

## Recorrido

| Módulo | Problema del alumno | Trabajo y entregable |
| --- | --- | --- |
| 1. Pensar antes de automatizar | “No sé qué casos diseñar.” | Exploración del banco, riesgos, particiones y límites; cinco casos con oráculo explícito. |
| 2. Primera suite confiable | “Mi selector funciona hasta que cambia algo.” | Login, cuenta correcta, labels/roles/scoping, auto-waiting y assertions. Un flujo sin sleeps. |
| 3. Dinero y estados | “El toast dice OK, ¿ya está probado?” | Cotización, comisión, reservas, cancelación y rechazo. Matriz de transiciones + verificación API. |
| 4. Datos y sesiones | “Mis tests se pisan.” | Fixture por práctica, setup por API, storageState, Ana/Bruno y ejecución paralela. |
| 5. Red y reintentos | “Falla a veces, le pongo retry.” | 503/aborto/demora, idempotencia, rollback, traces y reporte de defecto. |
| 6. Navegador realista | “Solo sé fill y click.” | CSV válido/inválido, descargas, popup, iframe, Shadow DOM y drag/teclado. |
| 7. Tiempo y calidad de experiencia | “No quiero esperar 90 segundos.” | Dos relojes, móvil, offline/permisos, foco, axe, ARIA y baseline visual revisada. |
| 8. Entrega profesional | “No sé cuándo dar por terminado.” | Suite mantenible, refactorización POM justificada, CI, evidencias y mini demo. |

En cada módulo: breve explicación → investigar sin solución → diseñar resultado esperado → automatizar → introducir fallo → depurar y reportar. Las suites resueltas están en `lab/e2e` como material de referencia; no pedir copiarlas como evaluación.

## Historias y criterios de aceptación del banco

Las siguientes historias ya tienen soporte funcional. Son material de curso, no tickets creados en el board de Atenea. Detalles y valores exactos en [reglas](lab-rules.md).

### AB-01 · Iniciar una práctica aislada

Como estudiante quiero datos reiniciables para repetir mis pruebas sin afectar a otros.

- Cada nueva práctica contiene los mismos saldos y usuarios, con ID distinto.
- Un cambio en A no aparece en B.
- Reiniciar A requiere confirmación en UI y no elimina B.
- Ejercicios: dos contextos, reset con modal nativo aceptado/cancelado, sesión sin cookie.

### AB-02 · Acceder con identidad propia

Como cliente ficticio quiero registrarme y entrar para ver solo mis cuentas.

- Email único normalizado dentro de la práctica; clave mínima; error sin sesión al fallar.
- Logout invalida sesión en servidor.
- Otro cliente no puede operar mis cuentas ni mis transferencias.
- Casos: email con espacios/mayúsculas, duplicado, clave errónea, API sin sesión, ID ajeno y límite de intentos.

### AB-03 · Administrar cuentas

- Cuenta nueva con saldo cero, alias único y máximo cuatro activas.
- Depósito acepta centavos positivos; rechaza cero, negativos, strings y saldo máximo excedido.
- Congelar impide operar; descongelar recupera capacidad.
- Cerrar exige saldo cero y ausencia de operaciones pendientes, conservando historial.
- Casos: cuatro/cinco cuentas, un centavo, alias repetido tras cierre, doble tarjeta con “Depositar”, destino vacío con pendiente entrante.

### AB-04 · Cotizar y confirmar una transferencia

- Se ve principal, comisión, destino y total antes de confirmar.
- OTP incorrecto no crea operación; cotización vencida no confirma.
- Al confirmar se revalidan condiciones que pudieron cambiar desde la cotización.
- Casos: misma cuenta, cuenta propia diferente, destino desconocido, comisión mínima/redondeada, cuenta congelada entre cotización y confirmación.

### AB-05 · Reservar y procesar dinero correctamente

- Pending reduce disponible, pero no saldo contable ni acredita receptor.
- Completed produce débito, crédito, comisión e historial coherentes.
- Cancelled libera reserva; rejected por cuenta congelada no mueve fondos.
- Casos: dos pendientes que exceden disponible, importe exactamente en límite, principal válido pero saldo insuficiente para comisión, procesar dos veces, cancelar después de completar.

### AB-06 · Recuperarse de fallos sin duplicar

- Misma clave/pedido devuelve una sola operación.
- Misma clave con pedido diferente se rechaza.
- Fallo después del débito revierte saldo, comisión, historial y estado.
- Casos: dos requests simultáneos, reintento después de expirar cotización ya confirmada, 503 técnico y reintento exitoso, doble click durante petición demorada.

### AB-07 · Importar una agenda consistente

- CSV válido agrega todos los beneficiarios.
- Error en una fila revierte el archivo entero.
- Reordenar mantiene IDs propios únicos y conserva orden al recargar.
- Casos: fila desconocida al final, duplicado dentro del archivo/agenda, encabezado erróneo, archivo grande, drag y teclado. No confundir rechazo del formato simple documentado con bug de CSV genérico.

### AB-08 · Obtener evidencia de operaciones

- Historial filtrable y paginado, extracto completo solo del usuario actual.
- Comprobante se abre en nueva pestaña y muestra el estado real.
- Casos: búsqueda sin resultados, combinar filtros, cargar más, CSV descargado/filtrado visualmente diferente por diseño, receptor autorizado vs tercero.

### AB-09 · Integrarse con un proveedor simulado

- Código correcto en iframe produce confirmación en documento principal.
- La ayuda en Shadow DOM se puede operar por rol y teclado.
- Casos: código incorrecto/correcto, localizar en frame adecuado, fuente/origen no válidos de mensajes (extensión de pruebas de seguridad).

### AB-10 · Soportar condiciones de navegador

- Offline indica falta de red; no promete completar operaciones.
- Geolocalización simulada produce sucursal ficticia; rechazo de permiso ofrece alternativa textual.
- El dashboard funciona en móvil sin desborde horizontal de página.
- Casos: offline/online, permiso otorgado/denegado, foco de diálogo, escape, texto largo, tamaños intermedios. La suite actual cubre otorgado; denegado y validación manual con lector de pantalla quedan para ampliar.

## Retos integradores (sin regalar el test resuelto)

### Reto 1 · “Lo mandé una sola vez”

Seleccionar `duplicate-submit`. El servicio respondió tarde y el cliente reintentó. ¿Cómo demostramos que hubo dos operaciones del mismo pedido? Entregar reproducción mínima, evidencia de reserva/IDs, riesgo, resultado esperado y un test que falle contra ese perfil y pase contra stable.

### Reto 2 · “El saldo alcanza… ¿o no?”

Seleccionar `missing-reservation`. Reservar ARS 400 desde `ana.ahorro` y luego intentar ARS 300. ¿Qué representa saldo contable vs disponible? ¿Alcanza revisar la tarjeta? Verificar API, reservar/completar/cancelar y explicar la inconsistencia sin inventar reglas.

### Reto 3 · “Se cortó entre débito y crédito”

En stable, generar pending, activar fallo al procesar desde Laboratorio, procesar, comprobar rollback y reintentar. Capturar la traza y explicar por qué un 503 no prueba pérdida de dinero ni autoriza a enviar un pedido distinto.

### Reto 4 · “Funciona en mi máquina”

Ejecutar con varios workers y motores. Separar problema de app, test y entorno. Investigar el foco de modales, eventos de descargas y diferencias visuales entre SO. No resolver con `force: true`, sleeps o snapshots actualizados sin revisión.

## Preguntas para quizzes y discusión

1. Pending de ARS 100 hacia otro cliente: ¿el receptor ya cobró? **No.** Se reservan ARS 101; hasta procesar no se acredita.
2. `page.clock.fastForward` adelanta 91 segundos: ¿la API debe rechazar por vencimiento? **No necesariamente.** El reloj de servidor es independiente.
3. ¿Deshabilitar el botón alcanza para evitar duplicados? **No.** Hay otros clientes y reintentos; se exige idempotencia de servidor.
4. ¿Un toast exitoso prueba atomicidad? **No.** Se verifican estados, ambos saldos, comisión y movimientos.
5. ¿Dar retry a todos los fallos arregla flakiness? **No.** Puede ocultarla; hay que investigar sincronización, datos y defectos.
6. ¿Dos contextos de navegador garantizan datos distintos en backend? **No.** El fixture debe separar prácticas; compartir cookie comparte datos.
7. ¿axe sin violaciones demuestra accesibilidad completa? **No.** Solo ciertos chequeos automáticos, en el estado evaluado.
8. ¿Debe rechazarse todo comprobante de pending? **No.** Puede documentar una solicitud pendiente, sin afirmar acreditación.

## Evaluación sugerida

Rubrica sobre 10: diseño/riesgo (2), oráculos y datos (2), estabilidad/aislamiento (2), depuración y evidencia (2), claridad/mantenimiento (2). No premiar cantidad de clicks, cobertura inventada ni tests que siempre pasan.

“Terminado” para un ejercicio: regla citada, caso reproducible, aserción significativa, cleanup, test estable y evidencia que permite a otra persona reproducirlo. Para cambios en esta app: correr tests de negocio, E2E y revisar el impacto visual; no desplegar retos defectuosos en la plataforma principal.

## Siguiente expansión con mayor valor

Elegir **una** línea después del piloto, no sumar diez pantallas a la vez:

1. Transferencias programadas y cola: calendario, concurrencia, worker, reintentos y eventos en tiempo real.
2. Operador/supervisor: permisos y aprobaciones por umbral; separación de funciones.
3. Disputas y reversión: estado final no siempre es final; conciliación y trazabilidad.
4. Divisas/cotizador: contrato externo, HAR, tasas vencidas y redondeo.

La eventual integración con Atenea debe ser un proyecto separado: escenarios versionados, ejecución aislada del código del alumno, límites de recursos y limpieza. No correr tests aportados por usuarios dentro del backend de producción.
