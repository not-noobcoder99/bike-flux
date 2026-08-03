const db = require('../config/db');

const User = {
  async create({ full_name, email, password_hash, phone, student_id }) {
    const [result] = await db.query(
      `INSERT INTO users (full_name, email, password_hash, phone, student_id)
       VALUES (?, ?, ?, ?, ?)`,
      [full_name, email, password_hash, phone, student_id]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(user_id) {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone, student_id, role, status, created_at FROM users WHERE user_id = ?',
      [user_id]
    );
    return rows[0];
  },
};

module.exports = User;
