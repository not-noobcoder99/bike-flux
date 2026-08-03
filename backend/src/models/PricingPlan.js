const db = require('../config/db');

const PricingPlan = {
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
};

module.exports = PricingPlan;
