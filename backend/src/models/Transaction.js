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
};

module.exports = Transaction;
