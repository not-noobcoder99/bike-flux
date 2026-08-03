const express = require('express');
const router = express.Router();
const {
  unlockScooty, uploadPhoto, uploadConditionPhoto, endRide, activeRide, history,
} = require('../controllers/rideController');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/uploadMiddleware');

router.post('/unlock', requireAuth, unlockScooty);
router.post('/upload-photo', requireAuth, upload.single('photo'), uploadPhoto);
router.post('/condition-photo', requireAuth, uploadConditionPhoto);
router.post('/end', requireAuth, endRide);
router.get('/active', requireAuth, activeRide);
router.get('/history', requireAuth, history);

module.exports = router;
