const express = require('express');
const router = express.Router();
const {
  unlockScooty, uploadConditionPhoto, endRide, activeRide, history,
} = require('../controllers/rideController');
const { requireAuth } = require('../middleware/auth');

router.post('/unlock', requireAuth, unlockScooty);
router.post('/condition-photo', requireAuth, uploadConditionPhoto);
router.post('/end', requireAuth, endRide);
router.get('/active', requireAuth, activeRide);
router.get('/history', requireAuth, history);

module.exports = router;
