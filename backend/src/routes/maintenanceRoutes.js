const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listLogs,
  createLog,
  updateLogStatus,
  updateScootyStatus,
  listScooties,
} = require('../controllers/maintenanceController');

router.use(requireAuth, requireRole('maintenance'));

router.get('/scooties', listScooties);
router.get('/logs', listLogs);
router.post('/logs', createLog);
router.patch('/logs/:id', updateLogStatus);
router.patch('/scooties/:id/status', updateScootyStatus);

module.exports = router;
