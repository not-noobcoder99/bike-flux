const db = require('../config/db');

const Subscription = {
  async findActiveByUser(user_id) {
    const [rows] = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`,
      [user_id]
    );
    return rows[0];
  },
};

module.exports = Subscription;
