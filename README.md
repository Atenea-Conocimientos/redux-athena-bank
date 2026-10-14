# Redux Athena Bank

**Piloto interno v0.1 — clases 01 a 06:** [instalación y checklist para Luis](docs/piloto-interno-luis.md).

## Nuevo: Athena Bank Lab v2 — laboratorio para el curso de Playwright

Un banco **ficticio y exclusivamente local**, con reglas de negocio, errores controlados y pruebas de referencia. No procesa pagos ni se conecta a Atenea, QA, producción, MongoDB o servicios externos.

La aplicación original permanece en `backend/` y `frontend/`, sin migraciones ni cambios de comportamiento. El laboratorio nuevo vive en `lab/`: usa Node.js 24, SQLite integrado y una interfaz independiente. Los datos y las credenciales de ambas versiones **no se comparten**. La v2 es una base funcional para desarrollar el curso, no un banco de producción ni una cobertura de cada método de Playwright.

### Levantar el laboratorio

Desde la raíz del repositorio, con **Node.js 24 o superior**:

```sh
npm ci
npm run dev
```

Abrir [http://127.0.0.1:4177](http://127.0.0.1:4177), elegir **Estable** y crear una práctica. No se necesita `.env`.

- Ana: `ana@demo.test` · Bruno: `bruno@demo.test`.
- Contraseña **pública y ficticia** de ambos: `Practica2026!`.
- OTP de transferencias: `246810`. Código del iframe: `135790`.
- Nunca ingresar información, archivos ni contraseñas reales.
- SQLite persiste en `.lab-data/bank.sqlite` (ignorado por Git). Las sesiones duran una hora y se invalidan al reiniciar el servidor.
- En **Laboratorio → Reiniciar mi práctica**, se borra solamente ese conjunto de datos ficticios. El resto de las prácticas no cambia. Crear una práctica nueva no elimina las anteriores.
- Cada contexto del navegador conserva su laboratorio mediante una cookie. Compartir esa cookie significa compartir la práctica; para sesiones separadas de Ana/Bruno, ver el ejemplo de `browser.newContext` en la suite.

Variables opcionales: `LAB_PORT` y `LAB_DB`. No exponer el servidor a Internet: escucha exclusivamente en `127.0.0.1`. El puerto de pruebas es **4178** y usa SQLite en memoria, separado de tu práctica manual en **4177**.

### Qué incluye

- Registro y sesiones; cuentas con alias únicos, congelación, depósitos y cierre controlado.
- **Laboratorio → Empezar la clase 01**: [Mi primera prueba con Playwright](http://127.0.0.1:4177/lecciones/primera-prueba/). Bienvenida, localizadores, aserciones, diagnóstico de un fallo intencional y reto. Incluye voz autorizada de Juan generada con IA, subtítulos y proyectos de inicio/solución. [Guía del instructor](docs/clase-01-primera-prueba.md).
- **Clase 02**: [Crear una práctica e iniciar sesión](http://127.0.0.1:4177/lecciones/crear-practica/). Formularios con `getByLabel`, `selectOption`, `fill` y `click`; resultado observable y reto de contraseña incorrecta. Voz de Juan, capturas reales y ZIPs acumulativos sobre la clase 01. [Guía del instructor](docs/clase-02-crear-practica.md).
- **Clase 03**: [Depositar en la cuenta correcta](http://127.0.0.1:4177/lecciones/deposito-en-cuenta/). Localizadores dentro de regiones, botones repetidos, cuenta seleccionada en un diálogo y comprobación de ambos saldos. Voz de Juan, reto independiente y ZIPs acumulativos. [Guía del instructor](docs/clase-03-deposito-en-cuenta.md).
- **Clase 04**: [Depósitos inválidos](http://127.0.0.1:4177/lecciones/depositos-invalidos/). Parametrización, validación nativa y saldos intactos; reto del centavo mínimo. [Guía](docs/clase-04-depositos-invalidos.md).
- **Clase 05**: [Cotizar antes de confirmar](http://127.0.0.1:4177/lecciones/cotizar-transferencia/). Origen/destino, desglose de comisión, `test.step` y cotización sin reserva. [Guía](docs/clase-05-cotizar-transferencia.md).
- **Clase 06**: [Confirmar no es completar](http://127.0.0.1:4177/lecciones/confirmar-transferencia/). OTP ficticio, operación pendiente, reserva y disponible; reto de código incorrecto. [Guía](docs/clase-06-transferencia-pendiente.md).
- **Caso avanzado**: [Cómo comprobar una transferencia pendiente](http://127.0.0.1:4177/lecciones/transferencia-pendiente/), piloto de menos de tres minutos con voz de Juan, pantalla/código sincronizados, subtítulos, capítulos y un quiz. El MP3 se sirve localmente: no requiere instalar TTS ni consume créditos al reproducirlo. [Guía y regeneración](docs/microleccion-transferencia.md).
- **Paso 0 → [Prepará tu repositorio](http://127.0.0.1:4177/lecciones/preparar-repositorio/)**: guía para crear el repo de automatización del alumno, instalar Playwright y trabajar por clase. Descargas separadas **inicio** (ejercicio pendiente) y **solución** (test real completo). Los checkpoints se distribuyen como ZIPs acumulativos por clase.
- Transferencias con comisión, límite diario, OTP de práctica, vencimiento de cotización, reservas, idempotencia y estados pendiente/completada/cancelada/rechazada.
- Procesamiento transaccional: el fallo simulado después del débito revierte la operación completa.
- Beneficiarios ordenables, CSV importable atómicamente, movimientos filtrables/paginados y descarga de extractos.
- Comprobantes en nueva pestaña, proveedor local en iframe, ayuda en Shadow DOM y geolocalización simulable.
- 20 misiones dentro de la interfaz; modo estable y dos perfiles con defectos intencionales.
- **Laboratorio → Abrir mercado ficticio**: proveedor HTTP, grabación/replay HAR, WebSocket real y simulado, cortes/reconexión y caché pública offline con advertencia de antigüedad.
- Sesión expirable desde Laboratorio; recuperación del borrador de transferencia al volver a entrar con el mismo usuario, sin conservar OTP ni enviar automáticamente. Salir también limpia las otras pestañas de la práctica.
- Page Object de referencia, tests parametrizados, tags, proyecto de setup y reportes HTML/JSON.
- Fixtures aisladas, pruebas de negocio/API/UI, Chromium/Firefox/WebKit y emulación móvil, axe, ARIA, captura visual y configuración de CI.

### Verificar

```sh
npx playwright install chromium firefox webkit
npm run check
npm test
npm run test:e2e
npm run test:all-browsers
npm run test:advanced
npm run test:ui
npm run test:report
```

`test:e2e` corre Chromium y móvil; `test:all-browsers` corre los tres motores de escritorio. `npx playwright test` incluye esos cuatro proyectos y un setup de salud como dependencia. No usa perfiles personales ni credenciales reales del navegador. Un laboratorio por prueba permite ejecución paralela. El caso Service Worker se ejecuta en Chromium/escritorio y móvil; se omite expresamente en Firefox/WebKit por la limitación de las APIs de Playwright.

Comparación visual separada: `npm run test:visual`. Hay una baseline revisada de Chromium/Windows; en otro SO hay que generar y **revisar** su propia baseline con `npm run test:visual -- --update-snapshots`, y volver a ejecutar sin ese flag. No aceptar cambios de imágenes automáticamente para ocultar diferencias. El workflow de CI no compara la baseline Windows contra Linux.

### Material para preparar el curso

- [Guía de la clase inicial](course/first-test/README.md), [clase 02 acumulativa](course/create-practice/README.md) y [plantilla del caso avanzado](course/automation/README.md). Regenerar ZIPs con `npm run course:build`; el test de integridad detecta material desactualizado. `lesson:capture`, `lesson:capture:first` y `lesson:capture:practice` también reconstruyen los ZIPs.
- [Mapa de cobertura de Playwright y temas pendientes](docs/playwright-coverage.md).
- [Reglas del banco y contrato de API](docs/lab-rules.md).
- [Historias, casos y propuesta de curso](docs/course-plan.md).
- [Práctica guiada de integraciones avanzadas](docs/advanced-lab.md).
- Pruebas resueltas: `lab/tests`, `lab/e2e` y `lab/visual`.
- Archivos de práctica: `lab/fixtures`.

El workflow `lab-tests.yml` queda preparado, **sin ejecutar ni desplegar desde este trabajo local**. Al publicarlo, revisar las cuotas de GitHub Actions de la organización antes de activar ejecuciones frecuentes. No necesita secretos.

---

## Aplicación original (legacy)

Las instrucciones siguientes corresponden únicamente al proyecto anterior. No se necesitan para usar el laboratorio v2. Esta implementación anterior no fue modificada ni revalidada como parte de la v2; no publicarla como servicio bancario real.

Aplicación bancaria full-stack que permite gestionar cuentas, registrar transacciones (depósitos, transferencias y eventos de ciclo de vida de cuentas) y visualizar un panel de actividad.

---

## 🛠️ Requisitos

- **Node.js** v14 o superior
- **npm** o **yarn**
- **MongoDB** (local o en la nube)
- **Git** para control de versiones
- Para macOS: tener instalada la última versión de Xcode y las Command Line Tools.

## 🔧 Configuración de entorno

### Backend
1. Renombrar o copiar `.env.example` a `.env` en la carpeta `backend/`.
2. Configurar variables en `backend/.env`:
   ```env
   MONGO_URI=<tu cadena de conexión MongoDB>
   JWT_SECRET=<secreto para JWT>
   PORT=6007        # opcional (por defecto 6007)
   ```

### Frontend
1. Renombrar o copiar `.env.example` a `.env` en la carpeta `frontend/`.
2. _Nota: el frontend usa Vite con `import.meta.env.DEV`. No requiere `.env` unless overrides._
Opcionalmente puedes definir en `.env` de Vite:
   ```env
   VITE_API_BASE=http://localhost:6007/api
   ```

---

## 🚀 Instalación y ejecución

```bash
# Clonar repositorio
git clone git@github.com:Atenea-Conocimientos/redux-athena-bank.git
cd redux-athena-bank

# Backend
cd backend
npm install
npm run dev     # servidor en http://localhost:6007

# Frontend (nueva terminal)
cd ../frontend
npm install
npm run dev     # app en http://localhost:3000
```

---

## 🔑 Endpoints API

Todas las rutas marcadas requieren el header `Authorization: Bearer <token>` tras login.

### Auth
- **POST** `/api/auth/register` – Registro de usuario
- **POST** `/api/auth/login`    – Login y obtención de token JWT
- **POST** `/api/auth/logout`   – Cierra sesión y limpia cookie JWT

### Cuentas
- **GET** `/api/accounts`         – Listar cuentas del usuario
- **POST** `/api/accounts`        – Crear nueva cuenta (enviar `{ type, initialAmount }`)
- **DELETE** `/api/accounts/:id`  – Eliminar cuenta
- **PUT** `/api/accounts/:id/freeze` – Congelar/descongelar cuenta (enviar `{ isFrozen }`)
- **POST** `/api/accounts/:id/deposit` – Depositar fondos (enviar `{ amount }`)

### Transacciones
- **GET** `/api/transactions`                   – Obtener historial de transacciones
- **POST** `/api/transactions/transfer`         – Transferir fondos desde cuenta (enviar `{ fromAccountId, toEmail, amount }`)

---

## 📋 Funcionalidades principales

- Gestión de cuentas: creación, eliminación, congelar/descongelar
- Depósitos y transferencias con validaciones (fondos, estado de cuenta)
- Registro de eventos de ciclo de vida: apertura, cierre y cambios de estado
- Historial agrupado por fecha, con importes coloreados (verde para entrada, rojo para salida)
- Etiquetas en español y descripciones dinámicas según tipo de cuenta y usuario
- Auto–refresh del panel de actividad tras acciones (crear, eliminar, transferir)

---

## 🤖 QA y automatización

Este proyecto está en camino de integrar pruebas automatizadas (unitarias e integrales) para garantizar calidad continua. Se planea usar **Playwright**.

> Todos los equipos de QA y desarrollo están invitados a contribuir: reportar bugs, escribir casos de prueba y mejorar la cobertura.

---

## 🤝 Contribuciones

¡Se agradecen PRs! Para contribuir:
1. Haz un fork del repositorio.
2. Crea tu branch: `git checkout -b feature/mi-nueva-funcionalidad`.
3. Agrega tests automatizados para tu cambio.
4. Envía un pull request describiendo tus cambios.

---

## ⚖️ Licencia

MIT
