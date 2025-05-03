const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const requireUser = require('../requireUser');

// POST /api/transactions/transfer - Transfer funds between users
router.post('/transfer', requireUser, async (req, res) => {
  try {
    const { toEmail, amount } = req.body;
    if (!toEmail || !amount || amount <= 0) {
      throw { status: 400, message: 'Invalid transfer data' };
    }
    // Sender account (first)
    const senderAccount = await Account.findOne({ user: req.userId });
    if (!senderAccount) throw { status: 404, message: 'Sender account not found' };
    if (senderAccount.frozen) throw { status: 400, message: 'Sender account is frozen' };
    if (senderAccount.balance < amount) throw { status: 400, message: 'Insufficient funds' };
    
    // Recipient user and account
    const recipient = await User.findOne({ email: toEmail });
    if (!recipient) throw { status: 404, message: 'Recipient user not found' };
    const recipientAccount = await Account.findOne({ user: recipient._id });
    if (!recipientAccount) throw { status: 400, message: 'Recipient has no account' };
    if (recipientAccount.frozen) throw { status: 400, message: 'Recipient account is frozen' };

    // fetch sender info
    const sender = await User.findById(req.userId);

    // Apply balances
    senderAccount.balance -= amount;
    recipientAccount.balance += amount;
    await senderAccount.save();
    await recipientAccount.save();

    // Record transactions
    await Transaction.create([
      { user: req.userId, accountId: senderAccount._id, amount, type: 'transfer', direction: 'out', description: `Transferencia a ${toEmail}` },
      { user: recipient._id, accountId: recipientAccount._id, amount, type: 'transfer', direction: 'in', description: `Transferencia de ${sender.email}` }
    ]);

    res.json({ message: 'Transfer successful' });
  } catch (err) {
    console.error('Transfer error:', err);
    res.status(err.status || 500).json({ message: err.message || 'Transfer failed' });
  }
});

// GET /api/transactions - Get all transactions for user
router.get('/', requireUser, async (req, res) => {
  try {
    // Fetch all transactions for this user (including deleted-account events)
    const txs = await Transaction.find({ user: req.userId }).sort({ date: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
