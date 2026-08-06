const db = require('../config/db');

const Subscription = {
  async findAll() {
    const [rows] = await db.query(
      `SELECT sub.*, u.full_name, u.email, pp.name AS plan_name
       FROM subscriptions sub
       JOIN users u ON sub.user_id = u.user_id
       JOIN pricing_plans pp ON sub.plan_id = pp.plan_id
       ORDER BY sub.created_at DESC`
    );
    return rows;
  },

  async findByUser(user_id) {
    const [rows] = await db.query(
      `SELECT sub.*, pp.name AS plan_name, pp.monthly_price
       FROM subscriptions sub
       JOIN pricing_plans pp ON sub.plan_id = pp.plan_id
       WHERE sub.user_id = ? ORDER BY sub.created_at DESC`,
      [user_id]
    );
    return rows;
  },

  async findActiveByUser(user_id) {
    const [rows] = await db.query(
      `SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' LIMIT 1`,
      [user_id]
    );
    return rows[0];
  },

  async findById(subscription_id) {
    const [rows] = await db.query('SELECT * FROM subscriptions WHERE subscription_id = ?', [subscription_id]);
    return rows[0];
  },

  async create({ user_id, plan_id, start_date, end_date }) {
    const [result] = await db.query(
      `INSERT INTO subscriptions (user_id, plan_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [user_id, plan_id, start_date, end_date]
    );
    return result.insertId;
  },

  async updateStatus(subscription_id, status) {
    await db.query('UPDATE subscriptions SET status = ? WHERE subscription_id = ?', [status, subscription_id]);
  },

  async delete(subscription_id) {
    await db.query('DELETE FROM subscriptions WHERE subscription_id = ?', [subscription_id]);
  },
};

module.exports = Subscription;
