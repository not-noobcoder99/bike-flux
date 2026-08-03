const ParkingZone = require('../models/ParkingZone');

async function listZones(req, res, next) {
  try {
    const zones = await ParkingZone.findAll();
    res.json(zones);
  } catch (err) {
    next(err);
  }
}

module.exports = { listZones };
