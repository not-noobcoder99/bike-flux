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
};

module.exports = ConditionPhoto;
