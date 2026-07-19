/**
 * Migration runner.
 *
 * Applies every .sql file in ./migrations in filename order, exactly once.
 * Each migration runs inside a transaction, so a failure rolls back cleanly.
 * Safe to run on every deploy — already-applied files are skipped.
 *
 * Usage:  npm run migrate
 */
const fs = require('fs');
const path = require('path');
const { pool, waitForDatabase, close } = require('./pool');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedMigrations(client) {
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  return new Set(rows.map((row) => row.filename));
}

function pendingFiles(applied) {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .filter((file) => !applied.has(file));
}

async function runMigrations() {
  await waitForDatabase();

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await appliedMigrations(client);
    const pending = pendingFiles(applied);

    if (pending.length === 0) {
      console.log('No pending migrations. Database is up to date.');
      return;
    }

    console.log(`Applying ${pending.length} migration(s):`);

    for (const file of pending) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`  applied  ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  FAILED   ${file}: ${err.message}`);
        throw err;
      }
    }

    console.log('All migrations applied successfully.');
  } finally {
    client.release();
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => close())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err.message);
      close().finally(() => process.exit(1));
    });
}

module.exports = { runMigrations };
