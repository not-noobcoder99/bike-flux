const db = require('../config/db');

const Scooty = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT s.*, pz.name AS zone_name
       FROM scooties s
       LEFT JOIN parking_zones pz ON s.current_zone_id = pz.zone_id
       ORDER BY s.scooty_id`
    );
    return rows;
  },

  async findAvailable() {
    const [rows] = await db.query(`SELECT * FROM scooties WHERE status = 'available'`);
    return rows;
  },

  async findNearest(lat, lng, limit = 10) {
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

  async findByPlate(plate_number) {
    const [rows] = await db.query('SELECT * FROM scooties WHERE plate_number = ?', [plate_number]);
    return rows[0];
  },

  async create({ plate_number, model, current_zone_id, current_lat, current_lng, battery_level }) {
    const [result] = await db.query(
      `INSERT INTO scooties (plate_number, model, current_zone_id, current_lat, current_lng, battery_level, status)
       VALUES (?, ?, ?, ?, ?, ?, 'available')`,
      [plate_number, model || null, current_zone_id || null, current_lat ?? null, current_lng ?? null, battery_level ?? 100]
    );
    return result.insertId;
  },

  async update(scooty_id, { plate_number, model, current_zone_id, battery_level }) {
    await db.query(
      `UPDATE scooties SET plate_number = ?, model = ?, current_zone_id = ?, battery_level = ? WHERE scooty_id = ?`,
      [plate_number, model || null, current_zone_id || null, battery_level, scooty_id]
    );
  },

  async updateStatus(scooty_id, status) {
    await db.query('UPDATE scooties SET status = ? WHERE scooty_id = ?', [status, scooty_id]);
  },

  async updateBattery(scooty_id, battery_level) {
    await db.query('UPDATE scooties SET battery_level = ? WHERE scooty_id = ?', [battery_level, scooty_id]);
  },

  async updateLocation(scooty_id, lat, lng) {
    await db.query('UPDATE scooties SET current_lat = ?, current_lng = ? WHERE scooty_id = ?', [lat, lng, scooty_id]);
  },

  async delete(scooty_id) {
    await db.query('DELETE FROM scooties WHERE scooty_id = ?', [scooty_id]);
  },
};

module.exports = Scooty;
