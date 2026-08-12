const Ride = require('../models/Ride');
const Scooty = require('../models/Scooty');
const PricingPlan = require('../models/PricingPlan');
const iotService = require('../services/iotService');
const billingService = require('../services/billingService');
const zoneService = require('../services/zoneService');
const { distanceKm } = require('../utils/geofence');

async function unlockScooty(req, res, next) {
  try {
    const { scooty_id, lat, lng, zone_id } = req.body;
    const user_id = req.user.user_id;

    const existingRide = await Ride.findActiveByUser(user_id);
    if (existingRide) return res.status(409).json({ error: 'You already have an active ride' });

    const scooty = await Scooty.findById(scooty_id);
    if (!scooty || scooty.status !== 'available') {
      return res.status(400).json({ error: 'Scooty is not available' });
    }

    const resolved_zone_id = zone_id ?? (lat != null && lng != null
      ? await zoneService.resolveZoneForPoint(lat, lng)
      : null);

    const plan = await PricingPlan.findDefault();
    const ride_id = await Ride.create({
      user_id, scooty_id, plan_id: plan.plan_id, start_zone_id: resolved_zone_id, start_lat: lat, start_lng: lng,
    });

    await Ride.activate(ride_id);
    await iotService.unlockScooty(scooty_id);
    await Scooty.updateStatus(scooty_id, 'in_use');

    res.status(201).json({ ride_id, message: 'Scooty unlocked and ride started.' });
  } catch (err) {
    next(err);
  }
}


async function endRide(req, res, next) {
  try {
    const { ride_id, end_lat, end_lng, end_zone_id } = req.body;
    const ride = await Ride.findById(ride_id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.status !== 'active') return res.status(400).json({ error: 'Ride is not active' });

    const distance_km = distanceKm(ride.start_lat, ride.start_lng, end_lat, end_lng);
    const duration_minutes = Math.max(1, Math.round((Date.now() - new Date(ride.start_time)) / 60000));

    const resolved_end_zone_id = end_zone_id ?? (end_lat != null && end_lng != null
      ? await zoneService.resolveZoneForPoint(end_lat, end_lng)
      : null);

    const plan = await PricingPlan.findById(ride.plan_id);
    const fare_amount = await billingService.calculateFare({ distance_km, duration_minutes, plan });

    await Ride.complete(ride_id, {
      end_zone_id: resolved_end_zone_id, end_lat, end_lng, distance_km, duration_minutes, fare_amount,
    });
    await billingService.chargeRide({ user_id: ride.user_id, ride_id, amount: fare_amount });

    await iotService.lockScooty(ride.scooty_id);
    const scooty = await Scooty.findById(ride.scooty_id);
    const newBattery = Math.max(0, (scooty.battery_level || 100) - Math.max(1, Math.round(distance_km * 2)));
    await Scooty.updateBattery(ride.scooty_id, newBattery);
    await Scooty.updateStatus(ride.scooty_id, 'available');
    await Scooty.updateLocation(ride.scooty_id, end_lat, end_lng);

    res.json({ message: 'Ride completed', fare_amount, distance_km, duration_minutes });
  } catch (err) {
    next(err);
  }
}

async function activeRide(req, res, next) {
  try {
    const ride = await Ride.findActiveByUser(req.user.user_id);
    res.json(ride || null);
  } catch (err) {
    next(err);
  }
}

async function history(req, res, next) {
  try {
    const rides = await Ride.findHistoryByUser(req.user.user_id);
    res.json(rides);
  } catch (err) {
    next(err);
  }
}

// Fare preview: returns estimated fare for given distance + duration
async function calculateFare(req, res, next) {
  try {
    const { distance_km, duration_minutes } = req.body;
    if (!distance_km || !duration_minutes) {
      return res.status(400).json({ error: 'distance_km and duration_minutes are required' });
    }
    const plan = await PricingPlan.findDefault();
    if (!plan) return res.status(400).json({ error: 'No pricing plan configured' });

    const fare_amount = await billingService.calculateFare({
      distance_km: Number(distance_km),
      duration_minutes: Number(duration_minutes),
      plan,
    });
    res.json({ fare_amount });
  } catch (err) {
    next(err);
  }
}

// User-facing ride simulator
async function simulateRide(req, res, next) {
  try {
    const user_id = req.user.user_id;
    const { scooty_id, distance_km, duration_minutes } = req.body;
    if (!scooty_id) return res.status(400).json({ error: 'scooty_id is required' });

    const scooty = await Scooty.findById(scooty_id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });

    const plan = await PricingPlan.findDefault();
    if (!plan) return res.status(400).json({ error: 'No pricing plan configured' });

    const simDistance = distance_km ? Number(distance_km) : Math.round((Math.random() * 3 + 0.5) * 100) / 100;
    const simDuration = duration_minutes ? Number(duration_minutes) : Math.round(Math.random() * 20 + 5);

    const ride_id = await Ride.create({
      user_id, scooty_id, plan_id: plan.plan_id,
      start_zone_id: scooty.current_zone_id,
      start_lat: scooty.current_lat, start_lng: scooty.current_lng,
    });
    await Ride.activate(ride_id);

    const fare_amount = await billingService.calculateFare({ distance_km: simDistance, duration_minutes: simDuration, plan });
    await Ride.complete(ride_id, {
      end_zone_id: scooty.current_zone_id,
      end_lat: scooty.current_lat, end_lng: scooty.current_lng,
      distance_km: simDistance, duration_minutes: simDuration, fare_amount,
    });
    await billingService.chargeRide({ user_id, ride_id, amount: fare_amount });

    const newBattery = Math.max(0, (scooty.battery_level || 100) - Math.max(1, Math.round(simDistance * 2)));
    await Scooty.updateBattery(scooty.scooty_id, newBattery);

    res.status(201).json({
      message: 'Simulated ride completed and billed',
      ride_id, distance_km: simDistance, duration_minutes: simDuration, fare_amount,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { unlockScooty, endRide, activeRide, history, calculateFare, simulateRide };
