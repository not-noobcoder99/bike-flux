const express = require('express');
const router = express.Router();
const {
  getWallet, topUp, history, listPlans, mySubscriptions, subscribe, cancelSubscription,
} = require('../controllers/walletController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getWallet);
router.post('/topup', requireAuth, topUp);
router.get('/transactions', requireAuth, history);

router.get('/plans', requireAuth, listPlans);
router.get('/subscriptions', requireAuth, mySubscriptions);
router.post('/subscriptions', requireAuth, subscribe);
router.patch('/subscriptions/:id/cancel', requireAuth, cancelSubscription);

module.exports = router;