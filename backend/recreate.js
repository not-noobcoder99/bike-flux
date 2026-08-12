const db = require('./src/config/db');
async function create() {
  await db.query(`CREATE TABLE maintenance_logs (
    log_id int NOT NULL AUTO_INCREMENT,
    scooty_id int NOT NULL,
    reported_by int DEFAULT NULL,
    issue_description text NOT NULL,
    status enum('open','in_progress','resolved') DEFAULT 'open',
    created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at timestamp NULL DEFAULT NULL,
    PRIMARY KEY (log_id),
    KEY scooty_id (scooty_id),
    KEY reported_by (reported_by),
    CONSTRAINT maintenance_logs_ibfk_1 FOREIGN KEY (scooty_id) REFERENCES scooties (scooty_id) ON DELETE CASCADE,
    CONSTRAINT maintenance_logs_ibfk_2 FOREIGN KEY (reported_by) REFERENCES users (user_id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);
  console.log('Created maintenance_logs');
  process.exit();
}
create();
