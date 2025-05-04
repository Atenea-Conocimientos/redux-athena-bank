# Redux Athena Bank

Aplicación bancaria full-stack que permite gestionar cuentas, registrar transacciones (depósitos, transferencias y eventos de ciclo de vida de cuentas) y visualizar un panel de actividad.

---

## 🛠️ Requisitos

- **Node.js** v14 o superior
- **npm** o **yarn**
- **MongoDB** (local o en la nube)
- **Git** para control de versiones

## 🐳 Uso con Docker

Después de los requisitos, puedes levantar todo el stack sin instalar dependencias locales usando Docker y Docker Compose.
1. Desde la carpeta `backend/`, ejecutar:
   ```bash
   docker-compose up -d
   ```
2. Esto iniciará:
   - `mongo`: contenedor de MongoDB
   - `backend`: servidor Express (usa el `Dockerfile`)
3. El backend estará disponible en `http://localhost:4000`.
4. Para detener y eliminar contenedores:
   ```bash
   docker-compose down
   ```

## 🔧 Configuración de entorno

### Backend
1. Renombrar o copiar `.env.example` a `.env` en la carpeta `backend/`.
2. Configurar variables en `backend/.env`:
   ```env
   MONGO_URI=<tu cadena de conexión MongoDB>
   JWT_SECRET=<secreto para JWT>
   PORT=4000        # opcional (por defecto 4000)
   ```

### Frontend
1. Renombrar o copiar `.env.example` a `.env` en la carpeta `frontend/`.
2. _Nota: el frontend usa Vite con `import.meta.env.DEV`. No requiere `.env` unless overrides._
Opcionalmente puedes definir en `.env` de Vite:
   ```env
   VITE_API_BASE=http://localhost:4000/api
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
npm run dev     # servidor en http://localhost:4000

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
