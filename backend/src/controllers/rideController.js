const Ride = require('../models/Ride');
const Scooty = require('../models/Scooty');
const ConditionPhoto = require('../models/ConditionPhoto');
const PricingPlan = require('../models/PricingPlan');
const iotService = require('../services/iotService');
const billingService = require('../services/billingService');
const zoneService = require('../services/zoneService');
const { distanceKm } = require('../utils/geofence');

// Step 1: user scans QR -> validate scooty + account, unlock relay, create ride row
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

    await iotService.unlockScooty(scooty_id);
    await Scooty.updateStatus(scooty_id, 'in_use');

    res.status(201).json({ ride_id, message: 'Scooty unlocked. Please confirm condition photo to start riding.' });
  } catch (err) {
    next(err);
  }
}

// Handles the actual multipart image upload (via multer) for a condition photo.
// Frontend uploads the file here first, then calls /condition-photo with the returned URL.
async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo file uploaded' });
    const photo_url = `/uploads/${req.file.filename}`;
    res.status(201).json({ photo_url });
  } catch (err) {
    next(err);
  }
}

// Step 2: rider uploads condition photo before riding off
async function uploadConditionPhoto(req, res, next) {
  try {
    const { ride_id, photo_url, photo_type } = req.body;
    if (!ride_id || !photo_url) {
      return res.status(400).json({ error: 'ride_id and photo_url are required' });
    }
    const ride = await Ride.findById(ride_id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    await ConditionPhoto.create({ ride_id, photo_url, photo_type: photo_type || 'start' });

    if (photo_type === 'start' || !photo_type) {
      await Ride.activate(ride_id);
    }

    res.json({ message: 'Condition photo recorded' });
  } catch (err) {
    next(err);
  }
}

// Step 3: end ride -> compute fare, charge virtual card, free up scooty
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

    const plan = await require('../models/PricingPlan').findById(ride.plan_id);
    const fare_amount = await billingService.calculateFare({ distance_km, duration_minutes, plan });

    await Ride.complete(ride_id, {
      end_zone_id: resolved_end_zone_id, end_lat, end_lng, distance_km, duration_minutes, fare_amount,
    });
    await billingService.chargeRide({ user_id: ride.user_id, ride_id, amount: fare_amount });

    await require('../services/iotService').lockScooty(ride.scooty_id);
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

module.exports = { unlockScooty, uploadPhoto, uploadConditionPhoto, endRide, activeRide, history };
