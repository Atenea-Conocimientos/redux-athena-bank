const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://atena-redux.ngrok.app', // Kept for ngrok testing
    'http://atenea.uno',
    'https://atenea.uno'
  ],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/transactions', require('./routes/transactions'));

app.get('/', (req, res) => {
  res.send('API is running');
});
app.use('/api/auth', authRoutes); // <-- debe estar montado así


module.exports = app;
