const express = require('express');
const router = express.Router();
const { listAvailable, nearest, getById } = require('../controllers/scootyController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, listAvailable);
router.get('/nearest', requireAuth, nearest);
router.get('/:id', requireAuth, getById);

module.exports = router;
