const db = require('../config/db');

const MaintenanceLog = {
  async create({ scooty_id, reported_by, issue_description }) {
    const [result] = await db.query(
      `INSERT INTO maintenance_logs (scooty_id, reported_by, issue_description) VALUES (?, ?, ?)`,
      [scooty_id, reported_by, issue_description]
    );
    return result.insertId;
  },

  async findOpen() {
    const [rows] = await db.query(
      `SELECT ml.*, s.plate_number, u.full_name AS reporter_name
       FROM maintenance_logs ml
       JOIN scooties s ON ml.scooty_id = s.scooty_id
       LEFT JOIN users u ON ml.reported_by = u.user_id
       WHERE ml.status != 'resolved'
       ORDER BY ml.created_at DESC`
    );
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(
      `SELECT ml.*, s.plate_number, u.full_name AS reporter_name
       FROM maintenance_logs ml
       JOIN scooties s ON ml.scooty_id = s.scooty_id
       LEFT JOIN users u ON ml.reported_by = u.user_id
       ORDER BY ml.created_at DESC`
    );
    return rows;
  },

  async findById(log_id) {
    const [rows] = await db.query(
      `SELECT ml.*, s.plate_number, u.full_name AS reporter_name
       FROM maintenance_logs ml
       JOIN scooties s ON ml.scooty_id = s.scooty_id
       LEFT JOIN users u ON ml.reported_by = u.user_id
       WHERE ml.log_id = ?`,
      [log_id]
    );
    return rows[0];
  },

  async updateStatus(log_id, status) {
    const resolved_at = status === 'resolved' ? new Date() : null;
    await db.query(
      `UPDATE maintenance_logs SET status = ?, resolved_at = COALESCE(?, resolved_at) WHERE log_id = ?`,
      [status, resolved_at, log_id]
    );
  },

  async delete(log_id) {
    await db.query('DELETE FROM maintenance_logs WHERE log_id = ?', [log_id]);
  },
};

module.exports = MaintenanceLog;

