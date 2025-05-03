const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const requireUser = require('../requireUser');

// GET /api/accounts - Get all accounts for the logged-in user
router.get('/', requireUser, async (req, res) => {
  try {
    const accounts = await Account.find({ user: req.userId });
    res.json(accounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/accounts - Create a new account
router.post('/', requireUser, async (req, res) => {
  try {
    const { type, initialAmount } = req.body;
    const last4 = Math.floor(1000 + Math.random() * 9000).toString();
    const name = 'Nueva Cuenta';
    const account = new Account({
      user: req.userId,
      type,
      last4,
      name,
      frozen: false,
      balance: initialAmount || 0,
    });
    await account.save();
    res.status(201).json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/accounts/:id/freeze - Freeze or unfreeze an account
router.put('/:id/freeze', requireUser, async (req, res) => {
  try {
    const { isFrozen } = req.body;
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { frozen: !!isFrozen },
      { new: true }
    );
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/accounts/:id/deposit - Add funds to an account
router.post('/:id/deposit', requireUser, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount' });
    const account = await Account.findOne({ _id: req.params.id, user: req.userId });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    if (account.frozen) return res.status(400).json({ message: 'Account is frozen' });
    account.balance += amount;
    await account.save();
    const transaction = new Transaction({
      accountId: account._id,
      amount,
      type: 'deposit',
      direction: 'in',
      description: 'Deposit'
    });
    await transaction.save();
    res.json(account);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/accounts/:id - Delete an account
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const account = await Account.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
