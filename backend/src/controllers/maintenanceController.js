const MaintenanceLog = require('../models/MaintenanceLog');
const Scooty = require('../models/Scooty');

async function listLogs(req, res, next) {
  try {
    const { status } = req.query;
    const logs = status === 'open'
      ? await MaintenanceLog.findOpen()
      : await MaintenanceLog.findAll();
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

async function createLog(req, res, next) {
  try {
    const { scooty_id, issue_description } = req.body;
    if (!scooty_id || !issue_description) {
      return res.status(400).json({ error: 'scooty_id and issue_description are required' });
    }

    const scooty = await Scooty.findById(scooty_id);
    if (!scooty) return res.status(404).json({ error: 'Scooty not found' });

    const log_id = await MaintenanceLog.create({
      scooty_id,
      reported_by: req.user.user_id,
      issue_description,
    });

    if (scooty.status === 'available') {
      await Scooty.updateStatus(scooty_id, 'maintenance');
    }

    const log = await MaintenanceLog.findById(log_id);
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

async function updateLogStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['open', 'in_progress', 'resolved'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${valid.join(', ')}` });
    }

    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: 'Maintenance log not found' });

    await MaintenanceLog.updateStatus(req.params.id, status);

    if (status === 'resolved') {
      const scooty = await Scooty.findById(log.scooty_id);
      if (scooty && scooty.status === 'maintenance') {
        await Scooty.updateStatus(log.scooty_id, 'available');
      }
    }

    const updated = await MaintenanceLog.findById(req.params.id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function updateScootyStatus(req, res, next) {
  try {
    const { status } = req.body;
    const valid = ['available', 'maintenance', 'offline'];
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

async function listScooties(req, res, next) {
  try {
    const scooties = await Scooty.findAll();
    res.json(scooties);
  } catch (err) {
    next(err);
  }
}

module.exports = { listLogs, createLog, updateLogStatus, updateScootyStatus, listScooties };
