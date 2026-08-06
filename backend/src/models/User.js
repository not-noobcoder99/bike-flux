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

  async findAll() {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone, student_id, role, status, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  async findByStatus(status) {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone, student_id, role, status, created_at FROM users WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
    return rows;
  },

  async updateStatus(user_id, status) {
    await db.query('UPDATE users SET status = ? WHERE user_id = ?', [status, user_id]);
  },

  async updateRole(user_id, role) {
    await db.query('UPDATE users SET role = ? WHERE user_id = ?', [role, user_id]);
  },

  async update(user_id, { full_name, phone, student_id }) {
    await db.query(
      'UPDATE users SET full_name = ?, phone = ?, student_id = ? WHERE user_id = ?',
      [full_name, phone, student_id, user_id]
    );
  },

  async delete(user_id) {
    await db.query('DELETE FROM users WHERE user_id = ?', [user_id]);
  },
};

module.exports = User;