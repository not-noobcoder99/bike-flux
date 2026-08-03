const db = require('../config/db');

const Scooty = {
  async findAvailable() {
    const [rows] = await db.query(
      `SELECT * FROM scooties WHERE status = 'available'`
    );
    return rows;
  },

  async findNearest(lat, lng, limit = 10) {
    // Haversine distance approximation, ordered nearest-first
    const [rows] = await db.query(
      `SELECT *,
        (6371 * ACOS(
          COS(RADIANS(?)) * COS(RADIANS(current_lat)) *
          COS(RADIANS(current_lng) - RADIANS(?)) +
          SIN(RADIANS(?)) * SIN(RADIANS(current_lat))
        )) AS distance_km
       FROM scooties
       WHERE status = 'available'
       ORDER BY distance_km ASC
       LIMIT ?`,
      [lat, lng, lat, limit]
    );
    return rows;
  },

  async findById(scooty_id) {
    const [rows] = await db.query('SELECT * FROM scooties WHERE scooty_id = ?', [scooty_id]);
    return rows[0];
  },

  async updateStatus(scooty_id, status) {
    await db.query('UPDATE scooties SET status = ? WHERE scooty_id = ?', [status, scooty_id]);
  },

  async updateLocation(scooty_id, lat, lng) {
    await db.query(
      'UPDATE scooties SET current_lat = ?, current_lng = ? WHERE scooty_id = ?',
      [lat, lng, scooty_id]
    );
  },
};

module.exports = Scooty;
