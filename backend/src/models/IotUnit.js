const db = require('../config/db');

const IotUnit = {
  async findByScooty(scooty_id) {
    const [rows] = await db.query('SELECT * FROM iot_units WHERE scooty_id = ?', [scooty_id]);
    return rows[0];
  },

  async setRelayStatus(scooty_id, relay_status) {
    await db.query(
      'UPDATE iot_units SET relay_status = ?, last_ping_at = NOW() WHERE scooty_id = ?',
      [relay_status, scooty_id]
    );
  },
};

module.exports = IotUnit;
