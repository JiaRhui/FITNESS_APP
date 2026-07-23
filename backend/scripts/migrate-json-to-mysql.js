// backend/scripts/migrate-json-to-mysql.js
//
// One-time migration: reads the existing backend/data/users.json file
// and inserts each user into MySQL, hashing their plaintext password
// along the way. Safe to re-run — existing emails are skipped.
//
// Usage (from the backend/ folder, with MYSQL_* env vars set):
//   node scripts/migrate-json-to-mysql.js

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const USERS_FILE = path.join(__dirname, '..', 'data', 'users.json');
const SALT_ROUNDS = 10;

async function migrate() {
  if (!fs.existsSync(USERS_FILE)) {
    console.log('No users.json found — nothing to migrate.');
    return;
  }

  const raw = fs.readFileSync(USERS_FILE, 'utf8').trim();
  const users = raw ? JSON.parse(raw) : [];

  let migrated = 0;
  let skipped = 0;

  for (const user of users) {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [user.email]);
    if (existing.length > 0) {
      skipped += 1;
      continue;
    }

    const passwordHash = await bcrypt.hash(String(user.password || ''), SALT_ROUNDS);
    await pool.query(
      'INSERT INTO users (email, password_hash, created_at, last_login, profile) VALUES (?, ?, ?, ?, ?)',
      [
        user.email,
        passwordHash,
        user.createdAt ? new Date(user.createdAt) : new Date(),
        user.lastLogin && user.lastLogin !== 'Never' ? new Date(user.lastLogin) : null,
        user.profile ? JSON.stringify(user.profile) : null,
      ]
    );
    migrated += 1;
  }

  console.log(`Migration complete. Migrated: ${migrated}, skipped (already existed): ${skipped}`);
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
