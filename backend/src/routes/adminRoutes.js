const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  dashboard,
  listScooties,
  updateScootyStatus,
  listMaintenanceLogs,
  listZones,
  createZone,
  updateZone,
  deleteZone,
  listPendingUsers,
  approveUser,
  suspendUser,
} = require('../controllers/adminController');

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', dashboard);
router.get('/scooties', listScooties);
router.patch('/scooties/:id/status', updateScootyStatus);
router.get('/maintenance-logs', listMaintenanceLogs);
router.get('/zones', listZones);
router.post('/zones', createZone);
router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);

router.get('/users/pending', listPendingUsers);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/suspend', suspendUser);

module.exports = router;
