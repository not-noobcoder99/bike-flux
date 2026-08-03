const Scooty = require('../models/Scooty');
const MaintenanceLog = require('../models/MaintenanceLog');
const ParkingZone = require('../models/ParkingZone');
const User = require('../models/User');

async function dashboard(req, res, next) {
  try {
    const scooties = await Scooty.findAll();
    const logs = await MaintenanceLog.findOpen();
    const zones = await ParkingZone.findAll();
    const pendingUsers = await User.findByStatus('pending');

    const scootyCounts = scooties.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      scooty_counts: scootyCounts,
      open_maintenance_logs: logs.length,
      zone_count: zones.length,
      pending_users: pendingUsers.length,
    });
  } catch (err) {
    next(err);
  }
}

async function listScooties(req, res, next) {
  try {
    const scooties = await Scooty.findAll();
    res.json(scooties);
  } catch (err) {
    next(err);
  }
}

async function updateScootyStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['available', 'in_use', 'maintenance', 'offline'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    }

    const scooty = await Scooty.findById(req.params.id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });

    await Scooty.updateStatus(req.params.id, status);
    res.json({ message: 'Scooty status updated', scooty_id: Number(req.params.id), status });
  } catch (err) {
    next(err);
  }
}

async function listMaintenanceLogs(req, res, next) {
  try {
    const logs = await MaintenanceLog.findAll();
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function listZones(req, res, next) {
  try {
    const zones = await ParkingZone.findAll();
    res.json(zones);
  } catch (err) {
    next(err);
  }
}

async function createZone(req, res, next) {
  try {
    const { name, description, geofence_geojson, capacity, center_lat, center_lng } = req.body;
    if (!name || !geofence_geojson) {
      return res.status(400).json({ error: 'name and geofence_geojson are required' });
    }

    const zone_id = await ParkingZone.create({
      name, description, geofence_geojson, capacity, center_lat, center_lng,
    });
    const zone = await ParkingZone.findById(zone_id);
    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
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

    const updated = await ParkingZone.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function deleteZone(req, res, next) {
  try {
    const zone = await ParkingZone.findById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    await ParkingZone.delete(req.params.id);
    res.json({ message: 'Zone deleted' });
  } catch (err) {
    next(err);
  }
}

// ---- User approval workflow ----

async function listPendingUsers(req, res, next) {
  try {
    const users = await User.findByStatus('pending');
    res.json(users);
  } catch (err) {
    next(err);
  }
}

async function approveUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.updateStatus(req.params.id, 'active');
    res.json({ message: 'User approved', user_id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
}

async function suspendUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await User.updateStatus(req.params.id, 'suspended');
    res.json({ message: 'User suspended', user_id: Number(req.params.id) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
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
};
