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
    const [rows] = await db.query(`SELECT * FROM maintenance_logs WHERE status != 'resolved'`);
    return rows;
  },
};

module.exports = MaintenanceLog;
