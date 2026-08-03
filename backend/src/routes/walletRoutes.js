const express = require('express');
const router = express.Router();
const { getWallet, topUp, history } = require('../controllers/walletController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, getWallet);
router.post('/topup', requireAuth, topUp);
router.get('/transactions', requireAuth, history);

module.exports = router;
