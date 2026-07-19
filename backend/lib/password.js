/**
 * Password hashing.
 *
 * Replaces plaintext password storage. Uses Node's built-in crypto.scrypt,
 * so no extra dependency (no bcrypt/argon2 install required).
 *
 * Stored format:  scrypt$<salt-hex>$<hash-hex>
 * The salt is random per password, so identical passwords hash differently.
 */
const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

/** Hashes a plaintext password. Returns the string to store in password_hash. */
async function hashPassword(plaintext) {
  if (typeof plaintext !== 'string' || plaintext.length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const derived = await scrypt(plaintext, salt, KEY_LENGTH);
  return `${PREFIX}$${salt}$${derived.toString('hex')}`;
}

/**
 * Verifies a plaintext password against a stored hash.
 * Uses timingSafeEqual so the comparison does not leak information
 * through how long it takes to fail.
 */
async function verifyPassword(plaintext, stored) {
  if (typeof plaintext !== 'string' || typeof stored !== 'string') return false;

  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;

  const [, salt, expectedHex] = parts;

  let derived;
  try {
    derived = await scrypt(plaintext, salt, KEY_LENGTH);
  } catch {
    return false;
  }

  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length !== derived.length) return false;

  return crypto.timingSafeEqual(derived, expected);
}

/** True if a stored value is already hashed (used to detect un-migrated rows). */
function isHashed(stored) {
  return typeof stored === 'string' && stored.startsWith(`${PREFIX}$`);
}

module.exports = { hashPassword, verifyPassword, isHashed };
