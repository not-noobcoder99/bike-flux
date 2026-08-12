const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/auth');
const c = require('../controllers/adminController');

router.use(requireAuth, requireRole('admin'));

router.get('/dashboard', c.dashboard);

// Scooties (Bikes)
router.get('/scooties', c.listScooties);
router.post('/scooties', c.createScooty);
router.put('/scooties/:id', c.updateScooty);
router.patch('/scooties/:id/status', c.updateScootyStatus);
router.post('/scooties/:id/recharge', c.rechargeScooty);
router.delete('/scooties/:id', c.deleteScooty);

// Parking Zones (Stations)
router.get('/zones', c.listZones);
router.post('/zones', c.createZone);
router.put('/zones/:id', c.updateZone);
router.delete('/zones/:id', c.deleteZone);

// Users
router.get('/users', c.listAllUsers);
router.get('/users/pending', c.listPendingUsers);
router.patch('/users/:id/approve', c.approveUser);
router.patch('/users/:id/suspend', c.suspendUser);
router.patch('/users/:id/role', c.updateUserRole);
router.put('/users/:id', c.updateUser);
router.delete('/users/:id', c.deleteUser);

// Pricing Plans
router.get('/plans', c.listPlans);
router.post('/plans', c.createPlan);
router.put('/plans/:id', c.updatePlan);
router.delete('/plans/:id', c.deletePlan);

// Subscriptions
router.get('/subscriptions', c.listSubscriptions);
router.patch('/subscriptions/:id/cancel', c.cancelSubscription);

// Transactions
router.get('/transactions', c.listTransactions);
router.post('/transactions', c.createManualTransaction);

// IoT Units (simulated monitor)
router.get('/iot-units', c.listIotUnits);
router.patch('/iot-units/:id/simulate-ping', c.simulateIotPing);
router.delete('/iot-units/:id', c.deleteIotUnit);

// Rides
router.get('/rides', c.listRides);
router.post('/simulate-ride', c.simulateRide);

// Virtual Cards
router.get('/virtual-cards', c.listVirtualCards);
router.patch('/virtual-cards/:id/status', c.updateCardStatus);

module.exports = router;
