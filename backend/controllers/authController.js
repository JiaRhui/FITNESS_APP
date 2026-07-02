const { readUsers, saveUsers, sanitizeUser } = require('../models/userModel');
const { getToday, isValidRpEmail, normalizeEmail } = require('../middleware/helpers');

function signup(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '').trim();
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
  if (!isValidRpEmail(email)) return res.status(400).json({ success: false, message: 'Email must be 8 digits @myrp.edu.sg' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

  const users = readUsers();
  if (users.some((user) => normalizeEmail(user.email) === email)) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }

  users.push({
    email,
    password,
    createdAt: new Date().toLocaleString(),
    lastLogin: 'Never',
    profile: null,
    calories: { date: getToday(), foods: [] }
  });
  saveUsers(users);
  return res.status(201).json({ success: true, message: 'Account created successfully' });
}

function login(req, res) {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

  const users = readUsers();
  const user = users.find((item) => normalizeEmail(item.email) === email && item.password === password);
  if (!user) return res.status(401).json({ success: false, message: 'Invalid login' });

  req.session.user = user.email;
  user.lastLogin = new Date().toLocaleString();
  user.calories = user.calories || { date: getToday(), foods: [] };
  user.calories.foods = Array.isArray(user.calories.foods) ? user.calories.foods : [];
  saveUsers(users);
  return res.json({ success: true, user: sanitizeUser(user) });
}

function checkSession(req, res) {
  return res.json({ loggedIn: Boolean(req.session.user), email: req.session.user || null });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
}

module.exports = { signup, login, checkSession, logout };
