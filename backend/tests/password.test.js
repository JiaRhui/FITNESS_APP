const test = require('node:test');
const assert = require('node:assert');
const { hashPassword, verifyPassword, isHashed } = require('../lib/password');

test('hashing produces the expected stored format', async () => {
  const hash = await hashPassword('testing');
  assert.ok(hash.startsWith('scrypt$'));
  assert.strictEqual(hash.split('$').length, 3);
  assert.ok(!hash.includes('testing'), 'plaintext must never appear in the hash');
});

test('correct password verifies', async () => {
  const hash = await hashPassword('testing');
  assert.strictEqual(await verifyPassword('testing', hash), true);
});

test('wrong password is rejected', async () => {
  const hash = await hashPassword('testing');
  assert.strictEqual(await verifyPassword('Testing', hash), false);
  assert.strictEqual(await verifyPassword('wrong', hash), false);
  assert.strictEqual(await verifyPassword('', hash), false);
});

test('same password hashes differently each time (random salt)', async () => {
  const a = await hashPassword('testing');
  const b = await hashPassword('testing');
  assert.notStrictEqual(a, b, 'salts must differ');
  assert.strictEqual(await verifyPassword('testing', a), true);
  assert.strictEqual(await verifyPassword('testing', b), true);
});

test('malformed or legacy plaintext values are rejected, not crashed on', async () => {
  assert.strictEqual(await verifyPassword('testing', 'testing'), false);
  assert.strictEqual(await verifyPassword('testing', 'garbage$x$y'), false);
  assert.strictEqual(await verifyPassword('testing', ''), false);
});

test('isHashed detects un-migrated plaintext rows', async () => {
  assert.strictEqual(isHashed('testing'), false);
  assert.strictEqual(isHashed(await hashPassword('testing')), true);
});
