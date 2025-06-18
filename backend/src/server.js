const mongoose = require('mongoose');
const app = require('./app');
require('dotenv').config(); // <-- Asegurate de cargar las variables de entorno

const PORT = process.env.PORT || 6007; // <-- Cambiado a 6007 como puerto por defecto
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('✅ MongoDB conectado');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Error al conectar con MongoDB:', err);
    process.exit(1);
  });
