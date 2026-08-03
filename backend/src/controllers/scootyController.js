const Scooty = require('../models/Scooty');

async function listAvailable(req, res, next) {
  try {
    const scooties = await Scooty.findAvailable();
    res.json(scooties);
  } catch (err) {
    next(err);
  }
}

async function nearest(req, res, next) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'lat and lng query params required' });
    const scooties = await Scooty.findNearest(Number(lat), Number(lng));
    res.json(scooties);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const scooty = await Scooty.findById(req.params.id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });
    res.json(scooty);
  } catch (err) {
    next(err);
  }
}

module.exports = { listAvailable, nearest, getById };
