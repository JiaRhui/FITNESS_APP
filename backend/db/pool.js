const { Pool } = require('pg');

// Configuration comes from the environment only. Never hardcode credentials.
// See .env.example for the variables required.
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'fitness',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fitness',
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * Waits for the database to accept connections.
 *
 * Even with a compose healthcheck, the backend can start before Postgres is
 * ready to serve queries. Retrying here means the app recovers instead of
 * crash-looping on boot.
 */
async function waitForDatabase(retries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection established.');
      return true;
    } catch (err) {
      console.log(`Database not ready (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

/** Runs a single query. Always use $1, $2 placeholders — never string concatenation. */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Runs several statements in one transaction.
 * Rolls back automatically if the callback throws.
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
}

module.exports = { pool, query, withTransaction, waitForDatabase, close };
