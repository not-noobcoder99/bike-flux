const db = require('../config/db');

const ParkingZone = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM parking_zones');
    return rows;
  },
  async findById(zone_id) {
    const [rows] = await db.query('SELECT * FROM parking_zones WHERE zone_id = ?', [zone_id]);
    return rows[0];
  },
};

module.exports = ParkingZone;
