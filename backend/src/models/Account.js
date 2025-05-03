const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['debit', 'credit', 'savings', 'checking'], required: true },
  last4: { type: String, required: true },
  name: { type: String, required: true },
  frozen: { type: Boolean, default: false },
  balance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Account', AccountSchema);
