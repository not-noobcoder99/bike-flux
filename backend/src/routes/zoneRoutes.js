const express = require('express');
const router = express.Router();
const { listZones } = require('../controllers/zoneController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listZones);

module.exports = router;
