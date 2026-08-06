const db = require('../config/db');

const IotUnit = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT iu.*, s.plate_number
       FROM iot_units iu
       LEFT JOIN scooties s ON iu.scooty_id = s.scooty_id
       ORDER BY iu.iot_unit_id`
    );
    return rows;
  },

  async findByScooty(scooty_id) {
    const [rows] = await db.query('SELECT * FROM iot_units WHERE scooty_id = ?', [scooty_id]);
    return rows[0];
  },

  async findById(iot_unit_id) {
    const [rows] = await db.query('SELECT * FROM iot_units WHERE iot_unit_id = ?', [iot_unit_id]);
    return rows[0];
  },

  async create({ scooty_id, device_serial, firmware_version }) {
    const [result] = await db.query(
      `INSERT INTO iot_units (scooty_id, device_serial, relay_status, firmware_version)
       VALUES (?, ?, 'locked', ?)`,
      [scooty_id, device_serial, firmware_version || '1.0.0']
    );
    return result.insertId;
  },

  async setRelayStatus(scooty_id, relay_status) {
    await db.query(
      'UPDATE iot_units SET relay_status = ?, last_ping_at = NOW() WHERE scooty_id = ?',
      [relay_status, scooty_id]
    );
  },

  // No real hardware yet -- this simulates a heartbeat/GPS ping so the
  // admin panel can demonstrate live device monitoring without physical units.
  async simulatePing(iot_unit_id, { firmware_version } = {}) {
    await db.query(
      `UPDATE iot_units SET last_ping_at = NOW(), firmware_version = COALESCE(?, firmware_version) WHERE iot_unit_id = ?`,
      [firmware_version || null, iot_unit_id]
    );
  },

  async delete(iot_unit_id) {
    await db.query('DELETE FROM iot_units WHERE iot_unit_id = ?', [iot_unit_id]);
  },
};

module.exports = IotUnit;

