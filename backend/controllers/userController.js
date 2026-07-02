const { readUsers, sanitizeUser } = require('../models/userModel');
const { normalizeEmail } = require('../middleware/helpers');

function getCurrentUser(req, res) {
  const email = normalizeEmail(req.session.user);
  const user = readUsers().find((item) => normalizeEmail(item.email) === email);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  return res.json({ success: true, user: sanitizeUser(user) });
}

function listUsers(req, res) {
  const users = readUsers().map(sanitizeUser);
  return res.json({ success: true, users });
}

module.exports = { getCurrentUser, listUsers };
