const db = require('../config/db');

const VirtualCard = {
  async findByUser(user_id) {
    const [rows] = await db.query('SELECT * FROM virtual_cards WHERE user_id = ?', [user_id]);
    return rows[0];
  },

  async findAll() {
    const [rows] = await db.query(
      `SELECT vc.*, u.full_name, u.email
       FROM virtual_cards vc
       JOIN users u ON vc.user_id = u.user_id
       ORDER BY vc.card_id`
    );
    return rows;
  },

  async create({ user_id, card_number, provider_ref }) {
    const [result] = await db.query(
      `INSERT INTO virtual_cards (user_id, card_number, provider_ref) VALUES (?, ?, ?)`,
      [user_id, card_number, provider_ref]
    );
    return result.insertId;
  },

  async adjustBalance(card_id, amount) {
    await db.query('UPDATE virtual_cards SET balance = balance + ? WHERE card_id = ?', [amount, card_id]);
  },

  async updateStatus(card_id, status) {
    await db.query('UPDATE virtual_cards SET status = ? WHERE card_id = ?', [status, card_id]);
  },
};

module.exports = VirtualCard;

