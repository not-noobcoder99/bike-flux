const db = require('../config/db');

const ConditionPhoto = {
  async create({ ride_id, photo_url, photo_type }) {
    const [result] = await db.query(
      `INSERT INTO condition_photos (ride_id, photo_url, photo_type) VALUES (?, ?, ?)`,
      [ride_id, photo_url, photo_type]
    );
    return result.insertId;
  },

  async findByRide(ride_id) {
    const [rows] = await db.query('SELECT * FROM condition_photos WHERE ride_id = ?', [ride_id]);
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(
      `SELECT cp.*, r.user_id, s.plate_number
       FROM condition_photos cp
       JOIN rides r ON cp.ride_id = r.ride_id
       JOIN scooties s ON r.scooty_id = s.scooty_id
       ORDER BY cp.taken_at DESC`
    );
    return rows;
  },

  async delete(photo_id) {
    await db.query('DELETE FROM condition_photos WHERE photo_id = ?', [photo_id]);
  },
};

module.exports = ConditionPhoto;
