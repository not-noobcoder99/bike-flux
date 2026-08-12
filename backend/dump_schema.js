const db = require('./src/config/db');

async function dump() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    let schemaStr = '';
    for (const table of tableNames) {
      const [createTable] = await db.query(`SHOW CREATE TABLE ${table}`);
      schemaStr += createTable[0]['Create Table'] + ';\n\n';
    }
    console.log(schemaStr);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
dump();
