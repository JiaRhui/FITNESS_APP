const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
}

async function createUser(email, plainPassword) {
  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  const [result] = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES (?, ?)',
    [email, passwordHash]
  );
  return { id: result.insertId, email };
}

async function verifyPassword(user, plainPassword) {
  return bcrypt.compare(plainPassword, user.password_hash);
}

async function touchLastLogin(userId) {
  await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [userId]);
}

function sanitizeUser(user) {
  return {
    email: user.email,
    createdAt: user.created_at,
    lastLogin: user.last_login || 'Never',
    profile: user.profile || null,
  };
}

async function getAllUsers() {
  const [rows] = await pool.query('SELECT id, email, created_at, last_login, profile FROM users');
  return rows;
}

async function deleteUserByEmail(email) {
  await pool.query('DELETE FROM users WHERE email = ?', [email]);
}

module.exports = {
  findUserByEmail,
  createUser,
  verifyPassword,
  touchLastLogin,
  sanitizeUser,
  getAllUsers,
  deleteUserByEmail,
};
