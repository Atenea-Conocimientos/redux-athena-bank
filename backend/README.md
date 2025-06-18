# Backend - Athena Bank

Este backend es una API REST desarrollada con **Node.js**, **Express** y **MongoDB** (vía Mongoose). Gestiona autenticación, cuentas bancarias y transacciones para la aplicación Athena Bank.

## Tecnologías principales

- **Node.js** + **Express**
- **MongoDB** + **Mongoose**
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **dotenv** para variables de entorno


## Estructura del proyecto

```
backend/
├── src/
│   ├── controllers/         # Lógica de negocio (controladores)
│   ├── models/              # Esquemas de Mongoose (User, Account, Transaction)
│   ├── routes/              # Rutas de la API (auth, accounts, transactions)
│   ├── app.js               # Configuración principal de Express
│   ├── server.js            # Entry point y conexión a MongoDB
│   └── requireUser.js       # Middleware de autenticación
├── .env.example             # Variables de entorno de ejemplo
├── package.json             # Dependencias y scripts
└── ...
```

## Variables de entorno
Crea un archivo `.env` en la raíz de `backend/` basado en `.env.example`:

```
PORT=6007
MONGO_URI=mongodb://localhost:27017/athena-bank
JWT_SECRET=una_clave_secreta_segura
```

## Scripts disponibles

- `npm install`        – Instala las dependencias
- `npm run dev`        – Inicia el backend en modo desarrollo con nodemon
- `npm start`          – Inicia el backend en modo producción

## Endpoints principales

- `POST   /api/auth/login`           – Login de usuario
- `POST   /api/auth/register`        – Registro de usuario
- `GET    /api/accounts`             – Listar cuentas del usuario
- `POST   /api/accounts`             – Crear nueva cuenta
- `POST   /api/accounts/:id/freeze`  – Congelar cuenta
- `POST   /api/accounts/:id/topup`   – Depositar fondos
- `POST   /api/accounts/:id/transfer`– Transferir fondos
- `GET    /api/transactions`         – Listar transacciones

> Todas las rutas bajo `/api/accounts` y `/api/transactions` requieren autenticación JWT.

## Notas
- El backend escucha por defecto en el puerto `6007`.
- Asegúrate de que MongoDB esté corriendo localmente.
- El frontend se comunica con este backend vía `/api`.

---

¿Dudas o sugerencias? ¡Contribuciones y PRs son bienvenidos!
