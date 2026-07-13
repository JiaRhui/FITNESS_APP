const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'dailyChecklist.json');
const HABITS = ['calorieGoal', 'fitnessWorkout'];

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getDateLabel(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function createEmptyMonth(ownerEmail, monthKey = getMonthKey()) {
  const [year, month] = monthKey.split('-').map(Number);
  const totalDays = getDaysInMonth(year, month - 1);
  const days = {};

  for (let day = 1; day <= totalDays; day += 1) {
    const dayKey = String(day).padStart(2, '0');
    days[dayKey] = {
      date: `${monthKey}-${dayKey}`,
      habits: {
        calorieGoal: false,
        fitnessWorkout: false
      }
    };
  }

  return { ownerEmail, monthKey, days };
}

function readAll() {
  if (!fs.existsSync(dataPath)) return [];
  const rawData = fs.readFileSync(dataPath, 'utf8').trim();
  if (!rawData) return [];
  const parsed = JSON.parse(rawData);
  return Array.isArray(parsed) ? parsed : [];
}

function saveAll(records) {
  fs.writeFileSync(dataPath, JSON.stringify(records, null, 2));
}

function getCurrentMonthForUser(ownerEmail) {
  const email = String(ownerEmail).trim().toLowerCase();
  const currentMonth = getMonthKey();
  const records = readAll();
  const userIndex = records.findIndex(
    (record) => String(record.ownerEmail || '').trim().toLowerCase() === email
  );

  // First visit: create this user's current-month checklist.
  if (userIndex === -1) {
    const newRecord = createEmptyMonth(email, currentMonth);
    records.push(newRecord);
    saveAll(records);
    return newRecord;
  }

  // New calendar month: replace this user's old month with a fresh month.
  if (records[userIndex].monthKey !== currentMonth) {
    records[userIndex] = createEmptyMonth(email, currentMonth);
    saveAll(records);
  }

  return records[userIndex];
}

function updateTodayHabit(ownerEmail, habitKey, completed) {
  if (!HABITS.includes(habitKey)) {
    const error = new Error('Invalid habit');
    error.status = 400;
    throw error;
  }

  const email = String(ownerEmail).trim().toLowerCase();
  const currentRecord = getCurrentMonthForUser(email);
  const records = readAll();
  const userIndex = records.findIndex(
    (record) => String(record.ownerEmail || '').trim().toLowerCase() === email
  );

  const today = getDateLabel();
  const dayKey = today.slice(-2);
  records[userIndex] = currentRecord;
  records[userIndex].days[dayKey].habits[habitKey] = Boolean(completed);
  saveAll(records);

  return records[userIndex];
}

module.exports = {
  getCurrentMonthForUser,
  updateTodayHabit
};
