const VirtualCard = require('../models/VirtualCard');
const Transaction = require('../models/Transaction');

async function getWallet(req, res, next) {
  try {
    const card = await VirtualCard.findByUser(req.user.user_id);
    res.json(card);
  } catch (err) {
    next(err);
  }
}

async function topUp(req, res, next) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const card = await VirtualCard.findByUser(req.user.user_id);
    if (!card) return res.status(404).json({ error: 'No virtual card found' });

    // TODO: integrate real payment provider confirmation before crediting balance
    await VirtualCard.adjustBalance(card.card_id, amount);
    await Transaction.create({
      user_id: req.user.user_id,
      card_id: card.card_id,
      ride_id: null,
      amount,
      type: 'topup',
      status: 'success',
    });

    res.json({ message: 'Top-up successful' });
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const transactions = await Transaction.findByUser(req.user.user_id);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

module.exports = { getWallet, topUp, history };
