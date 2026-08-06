const db = require('../config/db');

const PricingPlan = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM pricing_plans ORDER BY plan_id');
    return rows;
  },

  async findDefault() {
    const [rows] = await db.query(
      `SELECT * FROM pricing_plans WHERE is_subscription = FALSE ORDER BY plan_id ASC LIMIT 1`
    );
    return rows[0];
  },

  async findById(plan_id) {
    const [rows] = await db.query('SELECT * FROM pricing_plans WHERE plan_id = ?', [plan_id]);
    return rows[0];
  },

  async create({ name, base_fare, per_minute_rate, per_km_rate, is_subscription, monthly_price }) {
    const [result] = await db.query(
      `INSERT INTO pricing_plans (name, base_fare, per_minute_rate, per_km_rate, is_subscription, monthly_price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, base_fare, per_minute_rate, per_km_rate, !!is_subscription, monthly_price || null]
    );
    return result.insertId;
  },

  async update(plan_id, { name, base_fare, per_minute_rate, per_km_rate, is_subscription, monthly_price }) {
    await db.query(
      `UPDATE pricing_plans SET name = ?, base_fare = ?, per_minute_rate = ?, per_km_rate = ?,
       is_subscription = ?, monthly_price = ? WHERE plan_id = ?`,
      [name, base_fare, per_minute_rate, per_km_rate, !!is_subscription, monthly_price || null, plan_id]
    );
  },

  async delete(plan_id) {
    await db.query('DELETE FROM pricing_plans WHERE plan_id = ?', [plan_id]);
  },
};

module.exports = PricingPlan;
