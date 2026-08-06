const Scooty = require('../models/Scooty');
const MaintenanceLog = require('../models/MaintenanceLog');
const ParkingZone = require('../models/ParkingZone');
const User = require('../models/User');
const IotUnit = require('../models/IotUnit');
const PricingPlan = require('../models/PricingPlan');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const ConditionPhoto = require('../models/ConditionPhoto');
const Ride = require('../models/Ride');
const VirtualCard = require('../models/VirtualCard');
const billingService = require('../services/billingService');

// ---------------- Dashboard ----------------

async function dashboard(req, res, next) {
  try {
    const scooties = await Scooty.findAll();
    const logs = await MaintenanceLog.findOpen();
    const zones = await ParkingZone.findAll();
    const pendingUsers = await User.findByStatus('pending');
    const transactions = await Transaction.findAll();
    const subscriptions = await Subscription.findAll();

    const scootyCounts = scooties.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const totalRevenue = transactions
      .filter((t) => t.status === 'success' && t.type === 'ride_charge')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({
      scooty_counts: scootyCounts,
      open_maintenance_logs: logs.length,
      zone_count: zones.length,
      pending_users: pendingUsers.length,
      total_transactions: transactions.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      active_subscriptions: subscriptions.filter((s) => s.status === 'active').length,
    });
  } catch (err) { next(err); }
}

// ---------------- Scooties (Bikes) CRUD ----------------

async function listScooties(req, res, next) {
  try { res.json(await Scooty.findAll()); } catch (err) { next(err); }
}

async function createScooty(req, res, next) {
  try {
    const { plate_number, model, current_zone_id, current_lat, current_lng, battery_level, device_serial } = req.body;
    if (!plate_number) return res.status(400).json({ error: 'plate_number is required' });

    const existing = await Scooty.findByPlate(plate_number);
    if (existing) return res.status(409).json({ error: 'A scooty with that plate number already exists' });

    const scooty_id = await Scooty.create({ plate_number, model, current_zone_id, current_lat, current_lng, battery_level });
    await IotUnit.create({ scooty_id, device_serial: device_serial || `DEV-${scooty_id}-${Date.now()}` });

    res.status(201).json(await Scooty.findById(scooty_id));
  } catch (err) { next(err); }
}

async function updateScooty(req, res, next) {
  try {
    const scooty = await Scooty.findById(req.params.id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });
    const { plate_number, model, current_zone_id, battery_level } = req.body;
    await Scooty.update(req.params.id, {
      plate_number: plate_number ?? scooty.plate_number,
      model: model ?? scooty.model,
      current_zone_id: current_zone_id ?? scooty.current_zone_id,
      battery_level: battery_level ?? scooty.battery_level,
    });
    res.json(await Scooty.findById(req.params.id));
  } catch (err) { next(err); }
}

async function updateScootyStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['available', 'in_use', 'maintenance', 'offline'];
    if (!valid.includes(status)) return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });

    const scooty = await Scooty.findById(req.params.id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });

    await Scooty.updateStatus(req.params.id, status);
    res.json({ message: 'Scooty status updated', scooty_id: Number(req.params.id), status });
  } catch (err) { next(err); }
}

async function deleteScooty(req, res, next) {
  try {
    const scooty = await Scooty.findById(req.params.id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });
    if (scooty.status === 'in_use') return res.status(400).json({ error: 'Cannot delete a scooty that is currently on a ride' });
    await Scooty.delete(req.params.id);
    res.json({ message: 'Scooty deleted' });
  } catch (err) { next(err); }
}

// ---------------- Maintenance Logs ----------------

async function listMaintenanceLogs(req, res, next) {
  try { res.json(await MaintenanceLog.findAll()); } catch (err) { next(err); }
}

async function deleteMaintenanceLog(req, res, next) {
  try {
    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });
    await MaintenanceLog.delete(req.params.id);
    res.json({ message: 'Maintenance log deleted' });
  } catch (err) { next(err); }
}

// ---------------- Parking Zones (Stations) CRUD ----------------

async function listZones(req, res, next) {
  try { res.json(await ParkingZone.findAll()); } catch (err) { next(err); }
}

async function createZone(req, res, next) {
  try {
    const { name, description, geofence_geojson, capacity, center_lat, center_lng } = req.body;
    if (!name || !geofence_geojson) return res.status(400).json({ error: 'name and geofence_geojson are required' });
    const zone_id = await ParkingZone.create({ name, description, geofence_geojson, capacity, center_lat, center_lng });
    res.status(201).json(await ParkingZone.findById(zone_id));
  } catch (err) { next(err); }
}

async function updateZone(req, res, next) {
  try {
    const zone = await ParkingZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    const { name, description, geofence_geojson, capacity, center_lat, center_lng } = req.body;
    await ParkingZone.update(req.params.id, {
      name: name ?? zone.name,
      description: description ?? zone.description,
      geofence_geojson: geofence_geojson ?? zone.geofence_geojson,
      capacity: capacity ?? zone.capacity,
      center_lat: center_lat ?? zone.center_lat,
      center_lng: center_lng ?? zone.center_lng,
    });
    res.json(await ParkingZone.findById(req.params.id));
  } catch (err) { next(err); }
}

async function deleteZone(req, res, next) {
  try {
    const zone = await ParkingZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    await ParkingZone.delete(req.params.id);
    res.json({ message: 'Zone deleted' });
  } catch (err) { next(err); }
}

// ---------------- Users: full management ----------------

async function listAllUsers(req, res, next) {
  try { res.json(await User.findAll()); } catch (err) { next(err); }
}

async function listPendingUsers(req, res, next) {
  try { res.json(await User.findByStatus('pending')); } catch (err) { next(err); }
}

async function approveUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.updateStatus(req.params.id, 'active');
    res.json({ message: 'User approved', user_id: Number(req.params.id) });
  } catch (err) { next(err); }
}

async function suspendUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.updateStatus(req.params.id, 'suspended');
    res.json({ message: 'User suspended', user_id: Number(req.params.id) });
  } catch (err) { next(err); }
}

async function updateUserRole(req, res, next) {
  try {
    const { role } = req.body;
    const valid = ['rider', 'admin', 'maintenance'];
    if (!valid.includes(role)) return res.status(400).json({ error: `role must be one of: ${valid.join(', ')}` });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.updateRole(req.params.id, role);
    res.json({ message: 'Role updated', user_id: Number(req.params.id), role });
  } catch (err) { next(err); }
}

// Edits a user's profile fields (name/phone/student id) -- the model method
// already existed but nothing was calling it until now.
async function updateUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { full_name, phone, student_id } = req.body;
    await User.update(req.params.id, {
      full_name: full_name ?? user.full_name,
      phone: phone ?? user.phone,
      student_id: student_id ?? user.student_id,
    });
    res.json(await User.findById(req.params.id));
  } catch (err) { next(err); }
}

async function deleteUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (Number(req.params.id) === req.user.user_id) return res.status(400).json({ error: "You can't delete your own account" });
    await User.delete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
}

// ---------------- Pricing Plans CRUD ----------------

async function listPlans(req, res, next) {
  try { res.json(await PricingPlan.findAll()); } catch (err) { next(err); }
}

async function createPlan(req, res, next) {
  try {
    const { name, base_fare, per_minute_rate, per_km_rate, is_subscription, monthly_price } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const plan_id = await PricingPlan.create({
      name, base_fare: base_fare || 0, per_minute_rate: per_minute_rate || 0, per_km_rate: per_km_rate || 0,
      is_subscription, monthly_price,
    });
    res.status(201).json(await PricingPlan.findById(plan_id));
  } catch (err) { next(err); }
}

async function updatePlan(req, res, next) {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    const { name, base_fare, per_minute_rate, per_km_rate, is_subscription, monthly_price } = req.body;
    await PricingPlan.update(req.params.id, {
      name: name ?? plan.name,
      base_fare: base_fare ?? plan.base_fare,
      per_minute_rate: per_minute_rate ?? plan.per_minute_rate,
      per_km_rate: per_km_rate ?? plan.per_km_rate,
      is_subscription: is_subscription ?? plan.is_subscription,
      monthly_price: monthly_price ?? plan.monthly_price,
    });
    res.json(await PricingPlan.findById(req.params.id));
  } catch (err) { next(err); }
}

async function deletePlan(req, res, next) {
  try {
    const plan = await PricingPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    await PricingPlan.delete(req.params.id);
    res.json({ message: 'Plan deleted' });
  } catch (err) { next(err); }
}

// ---------------- Subscriptions (admin view + cancel) ----------------

async function listSubscriptions(req, res, next) {
  try { res.json(await Subscription.findAll()); } catch (err) { next(err); }
}

async function cancelSubscription(req, res, next) {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Subscription not found' });
    await Subscription.updateStatus(req.params.id, 'cancelled');
    res.json({ message: 'Subscription cancelled' });
  } catch (err) { next(err); }
}

// ---------------- Transactions (admin view + manual/simulated) ----------------

async function listTransactions(req, res, next) {
  try { res.json(await Transaction.findAll()); } catch (err) { next(err); }
}

async function createManualTransaction(req, res, next) {
  try {
    const { user_id, amount, type, status } = req.body;
    const validTypes = ['ride_charge', 'topup', 'subscription', 'refund'];
    if (!user_id || !amount || !validTypes.includes(type)) {
      return res.status(400).json({ error: `user_id, amount, and type (one of ${validTypes.join(', ')}) are required` });
    }
    const card = await VirtualCard.findByUser(user_id);
    if (!card) return res.status(404).json({ error: 'No virtual card found for this user' });

    const signedAmount = type === 'ride_charge' ? -Math.abs(amount) : Math.abs(amount);
    await VirtualCard.adjustBalance(card.card_id, signedAmount);

    const transaction_id = await Transaction.create({
      user_id, card_id: card.card_id, ride_id: null, amount, type, status: status || 'success', provider_ref: 'admin-manual',
    });
    res.status(201).json(await Transaction.findById(transaction_id));
  } catch (err) { next(err); }
}

// ---------------- IoT Units (simulated monitor, no real hardware) ----------------

async function listIotUnits(req, res, next) {
  try { res.json(await IotUnit.findAll()); } catch (err) { next(err); }
}

async function simulateIotPing(req, res, next) {
  try {
    const unit = await IotUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: 'IoT unit not found' });
    await IotUnit.simulatePing(req.params.id);
    res.json(await IotUnit.findById(req.params.id));
  } catch (err) { next(err); }
}

async function deleteIotUnit(req, res, next) {
  try {
    const unit = await IotUnit.findById(req.params.id);
    if (!unit) return res.status(404).json({ error: 'IoT unit not found' });
    await IotUnit.delete(req.params.id);
    res.json({ message: 'IoT unit deleted' });
  } catch (err) { next(err); }
}

// ---------------- Rides (admin view) ----------------

async function listRides(req, res, next) {
  try { res.json(await Ride.findAll()); } catch (err) { next(err); }
}

async function simulateRide(req, res, next) {
  try {
    const { user_id, scooty_id, distance_km, duration_minutes } = req.body;
    if (!user_id || !scooty_id) return res.status(400).json({ error: 'user_id and scooty_id are required' });

    const scooty = await Scooty.findById(scooty_id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });

    const plan = await PricingPlan.findDefault();
    const simDistance = distance_km ?? Math.round((Math.random() * 3 + 0.5) * 100) / 100;
    const simDuration = duration_minutes ?? Math.round(Math.random() * 20 + 5);

    const ride_id = await Ride.create({
      user_id, scooty_id, plan_id: plan.plan_id, start_zone_id: scooty.current_zone_id,
      start_lat: scooty.current_lat, start_lng: scooty.current_lng,
    });
    await Ride.activate(ride_id);

    const fare_amount = await billingService.calculateFare({ distance_km: simDistance, duration_minutes: simDuration, plan });
    await Ride.complete(ride_id, {
      end_zone_id: scooty.current_zone_id, end_lat: scooty.current_lat, end_lng: scooty.current_lng,
      distance_km: simDistance, duration_minutes: simDuration, fare_amount,
    });
    await billingService.chargeRide({ user_id, ride_id, amount: fare_amount });

    res.status(201).json({
      message: 'Simulated ride completed and billed',
      ride_id, distance_km: simDistance, duration_minutes: simDuration, fare_amount,
    });
  } catch (err) { next(err); }
}

// ---------------- Condition Photos (admin view + delete) ----------------

async function listConditionPhotos(req, res, next) {
  try { res.json(await ConditionPhoto.findAll()); } catch (err) { next(err); }
}

async function deleteConditionPhoto(req, res, next) {
  try {
    await ConditionPhoto.delete(req.params.id);
    res.json({ message: 'Condition photo deleted' });
  } catch (err) { next(err); }
}

// ---------------- Virtual Cards (admin view + block/unblock) ----------------

async function listVirtualCards(req, res, next) {
  try { res.json(await VirtualCard.findAll()); } catch (err) { next(err); }
}

async function updateCardStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['active', 'blocked', 'expired'];
    if (!valid.includes(status)) return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    await VirtualCard.updateStatus(req.params.id, status);
    res.json({ message: 'Card status updated', card_id: Number(req.params.id), status });
  } catch (err) { next(err); }
}

module.exports = {
  dashboard,
  listScooties, createScooty, updateScooty, updateScootyStatus, deleteScooty,
  listMaintenanceLogs, deleteMaintenanceLog,
  listZones, createZone, updateZone, deleteZone,
  listAllUsers, listPendingUsers, approveUser, suspendUser, updateUserRole, updateUser, deleteUser,
  listPlans, createPlan, updatePlan, deletePlan,
  listSubscriptions, cancelSubscription,
  listTransactions, createManualTransaction,
  listIotUnits, simulateIotPing, deleteIotUnit,
  listRides, simulateRide,
  listConditionPhotos, deleteConditionPhoto,
  listVirtualCards, updateCardStatus,
};
