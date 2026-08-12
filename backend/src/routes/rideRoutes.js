const express = require('express');
const router = express.Router();
const {
  unlockScooty, endRide, activeRide, history,
  calculateFare, simulateRide,
} = require('../controllers/rideController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.post('/unlock', requireAuth, unlockScooty);
router.post('/end', requireAuth, endRide);
router.get('/active', requireAuth, activeRide);
router.get('/history', requireAuth, history);
router.post('/calculate-fare', requireAuth, calculateFare);
router.post('/simulate', requireAuth, simulateRide);

module.exports = router;
