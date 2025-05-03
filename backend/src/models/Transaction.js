const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number }, // optional for neutral events
  type: { type: String, enum: ['transfer', 'deposit', 'withdraw', 'account_opened', 'account_closed', 'status_change'], required: true },
  description: { type: String },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  direction: { type: String, enum: ['in', 'out', 'neutral'], required: true }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
