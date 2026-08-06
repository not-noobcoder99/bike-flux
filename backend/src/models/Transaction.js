const db = require('../config/db');

const Transaction = {
  async create({ user_id, card_id, ride_id, amount, type, status, provider_ref }) {
    const [result] = await db.query(
      `INSERT INTO transactions (user_id, card_id, ride_id, amount, type, status, provider_ref)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, card_id, ride_id, amount, type, status, provider_ref]
    );
    return result.insertId;
  },

  async findByUser(user_id) {
    const [rows] = await db.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return rows;
  },

  async findAll() {
    const [rows] = await db.query(
      `SELECT t.*, u.full_name, u.email
       FROM transactions t
       JOIN users u ON t.user_id = u.user_id
       ORDER BY t.created_at DESC`
    );
    return rows;
  },

  async findById(transaction_id) {
    const [rows] = await db.query('SELECT * FROM transactions WHERE transaction_id = ?', [transaction_id]);
    return rows[0];
  },

  async updateStatus(transaction_id, status) {
    await db.query('UPDATE transactions SET status = ? WHERE transaction_id = ?', [status, transaction_id]);
  },
};

module.exports = Transaction;

