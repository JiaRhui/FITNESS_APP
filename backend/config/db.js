// backend/config/db.js
// Central MySQL connection pool. All models should require this
// instead of touching the filesystem directly.

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'mysql',
  port: process.env.MYSQL_PORT || 3306,
  database: process.env.MYSQL_DATABASE || 'fitness_app',
  user: process.env.MYSQL_USER || 'fitness',
  password: process.env.MYSQL_PASSWORD || 'password',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Small helper used at boot (see server.js) so the app fails fast
// with a clear error if the database isn't reachable yet, instead
// of surfacing confusing errors on the first request.
async function verifyConnection(retries = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await pool.getConnection();
      conn.release();
      console.log('MySQL connection established.');
      return;
    } catch (err) {
      console.warn(`MySQL not ready (attempt ${attempt}/${retries}): ${err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error('Could not connect to MySQL after multiple attempts.');
}

module.exports = { pool, verifyConnection };
