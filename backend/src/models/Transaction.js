const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['transfer', 'deposit', 'withdraw'], required: true },
  description: { type: String },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  direction: { type: String, enum: ['in', 'out'], required: true }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
