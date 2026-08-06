const VirtualCard = require('../models/VirtualCard');
const Transaction = require('../models/Transaction');
const PricingPlan = require('../models/PricingPlan');
const Subscription = require('../models/Subscription');

async function getWallet(req, res, next) {
  try {
    const card = await VirtualCard.findByUser(req.user.user_id);
    res.json(card);
  } catch (err) { next(err); }
}

async function topUp(req, res, next) {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const card = await VirtualCard.findByUser(req.user.user_id);
    if (!card) return res.status(404).json({ error: 'No virtual card found' });

    await VirtualCard.adjustBalance(card.card_id, amount);
    await Transaction.create({
      user_id: req.user.user_id, card_id: card.card_id, ride_id: null, amount, type: 'topup', status: 'success',
    });

    res.json({ message: 'Top-up successful' });
  } catch (err) { next(err); }
}

async function history(req, res, next) {
  try {
    res.json(await Transaction.findByUser(req.user.user_id));
  } catch (err) { next(err); }
}

// ---- Pricing plans / subscriptions self-service ----

async function listPlans(req, res, next) {
  try {
    res.json(await PricingPlan.findAll());
  } catch (err) { next(err); }
}

async function mySubscriptions(req, res, next) {
  try {
    res.json(await Subscription.findByUser(req.user.user_id));
  } catch (err) { next(err); }
}

async function subscribe(req, res, next) {
  try {
    const { plan_id, months } = req.body;
    if (!plan_id) return res.status(400).json({ error: 'plan_id is required' });

    const plan = await PricingPlan.findById(plan_id);
    if (!plan || !plan.is_subscription) return res.status(400).json({ error: 'Invalid subscription plan' });

    const existing = await Subscription.findActiveByUser(req.user.user_id);
    if (existing) return res.status(409).json({ error: 'You already have an active subscription' });

    const durationMonths = months && months > 0 ? months : 1;
    const start = new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationMonths);

    const card = await VirtualCard.findByUser(req.user.user_id);
    const cost = Number(plan.monthly_price || 0) * durationMonths;
    if (card && cost > 0) {
      if (Number(card.balance) < cost) return res.status(400).json({ error: 'Insufficient wallet balance for this subscription' });
      await VirtualCard.adjustBalance(card.card_id, -cost);
      await Transaction.create({
        user_id: req.user.user_id, card_id: card.card_id, ride_id: null, amount: cost, type: 'subscription', status: 'success',
      });
    }

    const subscription_id = await Subscription.create({
      user_id: req.user.user_id, plan_id,
      start_date: start.toISOString().slice(0, 10),
      end_date: end.toISOString().slice(0, 10),
    });

    res.status(201).json({ message: 'Subscribed successfully', subscription_id });
  } catch (err) { next(err); }
}

async function cancelSubscription(req, res, next) {
  try {
    const subs = await Subscription.findByUser(req.user.user_id);
    const sub = subs.find((s) => s.subscription_id === Number(req.params.id));
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    await Subscription.updateStatus(req.params.id, 'cancelled');
    res.json({ message: 'Subscription cancelled' });
  } catch (err) { next(err); }
}

module.exports = { getWallet, topUp, history, listPlans, mySubscriptions, subscribe, cancelSubscription };
