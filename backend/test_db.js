const db = require('./src/config/db');

async function test() {
  const [rows] = await db.query('DESCRIBE users;');
  console.log(rows);
  const [users] = await db.query('SELECT user_id, full_name, status FROM users;');
  console.log('Users:', users);
  process.exit();
}

test();
