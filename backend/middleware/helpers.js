function getToday() {
  return new Date().toISOString().split('T')[0];
}

function isValidRpEmail(email) {
  return /^\d{8}@myrp\.edu\.sg$/.test(String(email || '').trim().toLowerCase());
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function requireSession(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Please login first' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Please login first' });
  }
  if (req.session.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}

module.exports = { getToday, isValidRpEmail, normalizeEmail, requireSession, requireAdmin };
