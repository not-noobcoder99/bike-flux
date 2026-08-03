// Handles fare calculation and virtual-card charging at ride end.
// Fare calc delegates to the Python microservice, which can host more
// advanced geofencing / dynamic pricing logic.

const axios_url = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';
const VirtualCard = require('../models/VirtualCard');
const Transaction = require('../models/Transaction');

async function calculateFare({ distance_km, duration_minutes, plan }) {
  // Simple local calc as a fallback; python-services/app.py exposes the same
  // logic at POST /calculate-fare for more advanced versions (surge, zones, etc).
  const base = Number(plan.base_fare);
  const perMin = Number(plan.per_minute_rate) * duration_minutes;
  const perKm = Number(plan.per_km_rate) * distance_km;
  return Math.round((base + perMin + perKm) * 100) / 100;
}

async function chargeRide({ user_id, ride_id, amount }) {
  const card = await VirtualCard.findByUser(user_id);
  if (!card) throw new Error('No virtual card linked to user');
  if (Number(card.balance) < amount) {
    await Transaction.create({
      user_id, card_id: card.card_id, ride_id, amount, type: 'ride_charge', status: 'failed',
    });
    throw new Error('Insufficient balance on virtual card');
  }
  await VirtualCard.adjustBalance(card.card_id, -amount);
  await Transaction.create({
    user_id, card_id: card.card_id, ride_id, amount, type: 'ride_charge', status: 'success',
  });
}

module.exports = { calculateFare, chargeRide };
