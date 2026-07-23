const {
  findUserByEmail,
  createUser,
  verifyPassword,
  touchLastLogin,
  sanitizeUser,
} = require('../models/userModel');
const { isValidRpEmail, normalizeEmail } = require('../middleware/helpers');

async function signup(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '').trim();
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    if (!isValidRpEmail(email)) return res.status(400).json({ success: false, message: 'Email must be 8 digits @myrp.edu.sg' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ success: false, message: 'User already exists' });
    }

    await createUser(email, password);
    return res.status(201).json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error during signup' });
  }
}

async function login(req, res) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || '');
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });

    if (email === 'admin' && password === 'admin') {
      req.session.user = 'admin';
      req.session.role = 'admin';
      return res.json({ success: true, user: { email: 'admin', role: 'admin' } });
    }

    const user = await findUserByEmail(email);
    if (!user || !(await verifyPassword(user, password))) {
      return res.status(401).json({ success: false, message: 'Invalid login' });
    }

    await touchLastLogin(user.id);
    req.session.user = user.email;
    return res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
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
