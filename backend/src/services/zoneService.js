// Resolves parking zones via the Python geofencing service.

const ParkingZone = require('../models/ParkingZone');
const pythonService = require('./pythonService');

async function resolveZoneForPoint(lat, lng) {
  const zones = await ParkingZone.findAll();
  if (!zones.length) return null;
  try {
    return await pythonService.resolveZone(lat, lng, zones);
  } catch {
    return null;
  }
}

module.exports = { resolveZoneForPoint };
