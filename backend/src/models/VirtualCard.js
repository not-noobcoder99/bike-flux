const db = require('../config/db');

const VirtualCard = {
  async findByUser(user_id) {
    const [rows] = await db.query('SELECT * FROM virtual_cards WHERE user_id = ?', [user_id]);
    return rows[0];
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
};

module.exports = VirtualCard;
