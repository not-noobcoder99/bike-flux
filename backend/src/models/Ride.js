const db = require('../config/db');

const Ride = {
  async create({ user_id, scooty_id, plan_id, start_zone_id, start_lat, start_lng }) {
    const [result] = await db.query(
      `INSERT INTO rides (user_id, scooty_id, plan_id, start_zone_id, start_time, start_lat, start_lng, status)
       VALUES (?, ?, ?, ?, NOW(), ?, ?, 'unlocking')`,
      [user_id, scooty_id, plan_id, start_zone_id, start_lat, start_lng]
    );
    return result.insertId;
  },

  async activate(ride_id) {
    await db.query(`UPDATE rides SET status = 'active' WHERE ride_id = ?`, [ride_id]);
  },

  async complete(ride_id, { end_zone_id, end_lat, end_lng, distance_km, duration_minutes, fare_amount }) {
    await db.query(
      `UPDATE rides SET status = 'completed', end_time = NOW(), end_zone_id = ?,
       end_lat = ?, end_lng = ?, distance_km = ?, duration_minutes = ?, fare_amount = ?
       WHERE ride_id = ?`,
      [end_zone_id, end_lat, end_lng, distance_km, duration_minutes, fare_amount, ride_id]
    );
  },

  async findById(ride_id) {
    const [rows] = await db.query('SELECT * FROM rides WHERE ride_id = ?', [ride_id]);
    return rows[0];
  },

  async findActiveByUser(user_id) {
    const [rows] = await db.query(
      `SELECT * FROM rides WHERE user_id = ? AND status IN ('unlocking','active') LIMIT 1`,
      [user_id]
    );
    return rows[0];
  },

  async findHistoryByUser(user_id) {
    const [rows] = await db.query(
      `SELECT * FROM rides WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(
      `SELECT r.*, u.full_name, u.email, s.plate_number
       FROM rides r
       JOIN users u ON r.user_id = u.user_id
       JOIN scooties s ON r.scooty_id = s.scooty_id
       ORDER BY r.created_at DESC`
    );
    return rows;
  },

  async delete(ride_id) {
    await db.query('DELETE FROM rides WHERE ride_id = ?', [ride_id]);
  },
};

module.exports = Ride;
