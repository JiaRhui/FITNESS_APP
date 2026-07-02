const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'users.json');

function ensureDataFile() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
}

function readUsers() {
  ensureDataFile();
  const rawData = fs.readFileSync(DATA_FILE, 'utf8').trim();
  if (!rawData) return [];
  return JSON.parse(rawData);
}

function saveUsers(users) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

function sanitizeUser(user) {
  return {
    email: user.email,
    createdAt: user.createdAt || 'Unknown',
    lastLogin: user.lastLogin || 'Never',
    profile: user.profile || null,
    calories: user.calories || { date: new Date().toISOString().split('T')[0], foods: [] }
  };
}

module.exports = { readUsers, saveUsers, sanitizeUser };
