# Contrato del laboratorio v2

Todo es ficticio y local. No hay KYC, SMS, email, redes bancarias, pagos, cobros, conexión con Atenea ni secretos externos. Esta especificación define el **modo stable**. Los perfiles de reto violan deliberadamente una regla cada uno.

## Datos, identidad y aislamiento

Un laboratorio tiene dos personas semilladas: Ana (`ana@demo.test`) y Bruno (`bruno@demo.test`). Contraseña pública `Practica2026!`; puede registrarse otro usuario ficticio, inicialmente sin cuentas. Nombre 1–60 caracteres; email normalizado, único dentro de la práctica; contraseña 10–100 caracteres, guardada como scrypt con salt.

La cookie `athena_lab` identifica una práctica con ID aleatorio; es una capacidad de acceso, no un sistema multi-tenant para Internet. Cookie de sesión aleatoria, HttpOnly y SameSite Strict; TTL real de una hora, revocación al logout y al reiniciar servidor. No se usa Secure porque el entorno local es HTTP. Eliminar cookies puede dejar una práctica guardada pero inaccesible desde esa sesión: no hay panel global ni GC automático de laboratorios.

Los datos persisten en SQLite, un agregado JSON por práctica. Cada mutación tiene BEGIN IMMEDIATE/COMMIT/ROLLBACK. Adecuado para el taller local, **no es una arquitectura bancaria escalable**. Los controles de reloj/reset/fallo son herramientas didácticas, nunca endpoints para publicar sin rediseño.

## Cuentas e importes

- API: enteros en centavos, positivos, máximo `100000000` (ARS 1.000.000). UI convierte hasta dos decimales; no se calcula dinero con acumulación flotante.
- Saldo inicial: `ana.diaria` ARS 2.500; `ana.ahorro` ARS 600; `bruno.diaria` ARS 1.200.
- Nuevas cuentas: saldo cero, nombre 1–40 caracteres, tipo checking/savings; alias 5–30 caracteres `[a-z0-9.]`, normalizado a minúsculas y único incluso después del cierre.
- Máximo cuatro cuentas activas por persona. Depósito ficticio solo sobre cuenta propia, activa y descongelada; respeta saldo máximo.
- Cerrar: saldo contable cero y ninguna transferencia pendiente entrante/saliente. Se preservan movimientos y alias. El cierre es lógico.
- Congelar bloquea depósito, cotización y procesamiento; no borra datos. Una transferencia que no puede procesarse por congelación se rechaza.

## Transferencias

1. **Cotizar:** cuenta de origen propia y activa; destino por alias existente, distinta cuenta; ambas descongeladas. Saldo y límite suficientes.
2. **Comisión:** entre cuentas propias cero; a otra persona 1%, redondeo hacia arriba al centavo, mínimo ARS 1. Comisión fuera del límite diario pero dentro de la reserva.
3. **Cotización:** dura 90 segundos del reloj del banco, sin reservar saldo. Concepto máximo 120 caracteres (se recorta); el servidor revalida al confirmar.
4. **Confirmar:** OTP ficticio `246810`; encabezado `Idempotency-Key` de 8–100 caracteres alfanuméricos/guiones. Pasa a pending, sin acreditar al receptor.
5. **Disponible:** saldo contable menos suma de importes + comisiones pendientes desde esa cuenta.
6. **Idempotencia:** misma persona + misma clave + misma cotización devuelve la misma operación, incluso después del vencimiento. Misma clave con otra cotización: 409. Cotización ya usada con clave nueva: 409. Alcance de clave por persona y práctica.
7. **Límite diario:** ARS 1.000 por emisor, todas sus cuentas, suma de principales pendientes/completados creados en el día UTC. Canceladas/rechazadas liberan límite. La comisión no cuenta. El cambio de día no elimina pendientes antiguos ni su reserva.
8. **Procesar:** acción explícita del emisor, no automática. Revalida cuentas/saldo/capacidad del destino. Si hay impedimento bancario, pasa a rejected y libera reserva, sin mover dinero.
9. **Éxito:** débito de principal+comisión, crédito de principal, comisión a tesorería y dos movimientos, todo atómico. Estado completed. No se puede cancelar ni procesar otra vez.
10. **Fallo técnico simulado:** error 503 después del débito; rollback completo. Sigue pending y reservado. Reintentar sin fallo permite completar una única vez.
11. **Cancelar:** solo emisor y pending. Libera reserva/límite sin movimientos de dinero; estado cancelled.
12. El receptor puede consultar su transferencia y comprobante pero no procesarla ni cancelarla. No puede depositar ni congelar cuentas del emisor.

Invariante para verificar: **suma de saldos de todas las cuentas + tesorería** no cambia al transferir. Los depósitos son una fuente ficticia explícita; cancelación, rechazo y fallos técnicos no alteran ese total.

## Beneficiarios, CSV y extractos

Beneficiario: nombre 1–50, alias activo existente; único por usuario. Reordenar exige todos los IDs propios exactamente una vez; ni omisiones, duplicados ni IDs ajenos.

Importación: archivo `.csv`, UTF-8, hasta 50.000 bytes, encabezado exacto `nombre,alias`, entre 1 y 20 filas. Este formato didáctico **no admite campos con comas entrecomilladas ni saltos de línea embebidos**. Una fila inválida revierte toda la importación. Solo se almacena metadata de la importación, no el contenido del archivo.

Extracto descargable: todos los movimientos propios, no solamente la página/filtro visible. Importes en unidades decimales con punto; fórmulas potenciales escapadas. El comprobante en nueva pestaña no es un PDF firmado y distingue pending de completed. Nunca interpretar “comprobante” como prueba de acreditación si está pendiente.

## Simulación

- El reloj por práctica avanza 1–1440 minutos por pedido. Afecta día bancario y cotizaciones; no cambia el reloj real de sesiones.
- `page.clock` cambia solo navegador: el servidor seguirá rechazando/aceptando por su propio reloj. No usarlo como supuesto viaje temporal de toda la aplicación.
- `duplicate-submit`: desactiva deduplicación y bloqueo de cotización usada. Reto: probar un reintento idéntico y detectar dos reservas/transferencias.
- `missing-reservation`: disponible de cuentas ignora pendientes. Reto: desde `ana.ahorro` reservar ARS 400 y luego ARS 300; debería rechazarse la segunda. El total superior y las tarjetas pueden mostrar la inconsistencia.
- El proveedor en iframe es HTML **confiable del mismo repositorio y origen**, no un tercero real aislado por sandbox. postMessage verifica origen y ventana emisora; no otorga privilegios.
- Geolocalización: usar coordenadas simuladas; la demo devuelve una sucursal ficticia fija y no almacena coordenadas. No prueba cálculo de distancia real.

## API rápida

### Sesiones y borradores

`POST /api/lab/session/expire` vence exclusivamente la sesión autenticada que llama. No necesita esperar una hora ni adelantar el reloj bancario. La siguiente operación protegida recibe 401. Un nuevo login rota/revoca el token anterior del mismo navegador.

Si el 401 sucede al revisar/confirmar una transferencia, la UI vuelve al login y conserva en memoria únicamente origen, destino, importe y concepto. El mismo usuario de la misma práctica puede recuperarlos; otra identidad no. No se conservan OTP, contraseñas, cotización ni clave de idempotencia en ese borrador; no se envía una transferencia al reingresar. Hay que cotizar y confirmar otra vez. Recargar la página pierde el borrador; cerrar voluntariamente el diálogo o salir lo descarta.

Logout/login/reset se comunican por BroadcastChannel a las otras pestañas de la misma práctica: se ocultan saldos y se cierran diálogos. La autorización real sigue siendo del servidor; BroadcastChannel no sustituye ese control. Contextos de navegador separados mantienen sesiones independientes.

### Mercado público ficticio

`/mercado/` no requiere sesión. `GET /api/market/rates` entrega `{fictional:true,base:'ARS',sequence,asOf,expiresAt,rates:{USD,EUR}}`. Son números inventados, no precios reales: inicialmente USD=1000 y EUR=1200. Validez de referencia de 90 segundos; no compra, vende ni convierte fondos. El fetch omite cookies para no guardarlas en HAR.

`ws://127.0.0.1:4177/ws/market` emite el mismo contrato con `type:'rates'`. Secuencia 0 inicial; mensaje de texto `next` incrementa la secuencia de esa conexión y usa tasa base + (secuencia módulo 10). `disconnect` cierra con código 1012. Mensaje desconocido devuelve `type:'error'`; binarios y payload >1024 bytes se rechazan. Origen/Host estrictamente locales y del mismo origen, máximo 64 conexiones. No comparte secuencias entre clientes ni publica cuentas, sesiones o transferencias. Reconectar es manual y reinicia secuencia.

El Service Worker se habilita voluntariamente desde mercado y su scope es `/mercado/`. Allowlist de caché: esa página, su JS, CSS y respuesta pública de tasas; nunca endpoints de banco ni peticiones de escritura. Estrategia network-first con fallback marcado `X-Lab-Cache: stale`. La UI informa datos desactualizados al usar fallback, no tener red o vencer la tasa. Borrar caché desregistra solo este worker, borra solo caches `athena-market-*` y recarga para liberar el controlador. No es una PWA instalable ni permite operar offline.

### Endpoints bancarios

Requests JSON; cookies por contexto; base local `http://127.0.0.1:4177`. `Idempotency-Key` solo en confirmar. Errores `{message, code}` con HTTP 4xx/503. No hay contrato OpenAPI generado aún.

| Método / ruta | Cuerpo o respuesta relevante |
| --- | --- |
| POST `/api/labs` | `{profile: "stable"}` crea datos y cookie, cierra sesión previa del navegador |
| GET / DELETE `/api/lab` | Información / reset exclusivo de la práctica de la cookie |
| POST `/api/auth/register` | `{name,email,password}` |
| POST `/api/auth/login` | `{email,password}`; tras 10 fallos, bloquear un minuto en esa práctica |
| POST `/api/auth/logout` | Revoca sesión actual |
| GET `/api/overview` | Usuario, cuentas, transferencias visibles, movimientos, documentos, límites |
| POST `/api/accounts` | `{name,alias,type}` |
| POST `/api/accounts/:id/deposit` | `{amount}` en centavos |
| PUT `/api/accounts/:id/freeze` | `{frozen: true}` booleano |
| DELETE `/api/accounts/:id` | Cierre lógico |
| POST `/api/quotes` | `{from,toAlias,amount,note?}` |
| POST `/api/transfers` | `{quoteId,otp}` + header de idempotencia |
| POST `/api/transfers/:id/settle` | `{simulateFailure:false}` |
| POST `/api/transfers/:id/cancel` | Cancelación pendiente |
| GET `/api/transfers/:id` | Comprobante accesible a emisor/receptor |
| POST `/api/beneficiaries` | `{name,alias}` |
| PUT `/api/beneficiaries/order` | `{ids:[...]}` |
| POST `/api/documents/import` | `{filename,content}` |
| GET `/api/statement.csv` | Descarga del historial propio completo |
| POST `/api/lab/clock` | `{minutes:2}` |
| POST `/api/lab/session/expire` | Sin cuerpo; vence la sesión actual en servidor |
| GET `/api/market/rates` | Público, tasas ficticias; no requiere cookies |

Sin autorización para producción: compartirlo por Internet requiere revisar persistencia/sesiones, límites de recursos, aislamiento, HTTPS, administración de escenarios y abuso. Nunca reutilizar la contraseña pública ni cargar una copia de usuarios de Atenea.
