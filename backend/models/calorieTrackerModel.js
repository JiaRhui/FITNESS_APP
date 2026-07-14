const fs = require('fs');
const path = require('path');

const TRACKER_DATA_FILE = path.join(__dirname, '..', 'data', 'CalorieTracker.json');
const CALENDAR_DATA_FILE = path.join(__dirname, '..', 'data', 'CalorieCalender.json');

function ensureJsonArrayFile(dataFile) {
  const dataDir = path.dirname(dataFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]\n');
}

function readJsonArray(dataFile) {
  ensureJsonArrayFile(dataFile);
  const rawData = fs.readFileSync(dataFile, 'utf8').trim();
  if (!rawData) return [];

  try {
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to read ${path.basename(dataFile)}:`, error.message);
    return [];
  }
}

function writeJsonArray(dataFile, records) {
  ensureJsonArrayFile(dataFile);
  fs.writeFileSync(dataFile, `${JSON.stringify(records, null, 2)}\n`);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function getSingaporeDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function createEmptyTracker(ownerEmail, date = getSingaporeDate()) {
  return {
    ownerEmail: normalizeEmail(ownerEmail),
    date,
    goal: null,
    recommendedData: null,
    foodEntries: [],
    totalCalories: 0,
    updatedAt: new Date().toISOString()
  };
}

function calculateTotal(foodEntries = []) {
  return foodEntries.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
}

function normalizeTracker(tracker) {
  const foodEntries = Array.isArray(tracker.foodEntries)
    ? tracker.foodEntries.map((item) => ({
      id: String(item.id),
      name: String(item.name || '').trim(),
      calories: Number(item.calories) || 0
    }))
    : [];

  return {
    ownerEmail: normalizeEmail(tracker.ownerEmail),
    date: String(tracker.date || getSingaporeDate()),
    goal: Number(tracker.goal) > 0 ? Number(tracker.goal) : null,
    recommendedData: tracker.recommendedData && typeof tracker.recommendedData === 'object'
      ? tracker.recommendedData
      : null,
    foodEntries,
    totalCalories: calculateTotal(foodEntries),
    updatedAt: tracker.updatedAt || new Date().toISOString()
  };
}

function getStatus(goal, totalCalories) {
  const numericGoal = Number(goal);
  const numericTotal = Number(totalCalories) || 0;

  if (!numericGoal || numericGoal <= 0) {
    return { state: 'no-goal', label: 'No goal set', color: 'grey', metGoal: false };
  }
  if (numericTotal === numericGoal) {
    return { state: 'reached', label: 'Goal reached', color: 'green', metGoal: true };
  }
  if (numericTotal < numericGoal) {
    return { state: 'under', label: 'Under goal', color: 'red', metGoal: false };
  }
  return { state: 'over', label: 'Over goal', color: 'red', metGoal: false };
}

function trackerToCalendarRecord(tracker) {
  const normalized = normalizeTracker(tracker);
  const status = getStatus(normalized.goal, normalized.totalCalories);

  return {
    ownerEmail: normalized.ownerEmail,
    date: normalized.date,
    goal: normalized.goal,
    caloriesConsumed: normalized.totalCalories,
    status: status.state,
    statusLabel: status.label,
    color: status.color,
    metGoal: status.metGoal,
    updatedAt: new Date().toISOString()
  };
}

function readTrackers(dataFile = TRACKER_DATA_FILE) {
  return readJsonArray(dataFile).map(normalizeTracker);
}

function saveTrackers(trackers, dataFile = TRACKER_DATA_FILE) {
  writeJsonArray(dataFile, trackers.map(normalizeTracker));
}

function readCalendarRecords(dataFile = CALENDAR_DATA_FILE) {
  return readJsonArray(dataFile).map((record) => ({
    ownerEmail: normalizeEmail(record.ownerEmail),
    date: String(record.date || ''),
    goal: Number(record.goal) > 0 ? Number(record.goal) : null,
    caloriesConsumed: Number(record.caloriesConsumed) || 0,
    status: String(record.status || 'no-goal'),
    statusLabel: String(record.statusLabel || 'No goal set'),
    color: String(record.color || 'grey'),
    metGoal: Boolean(record.metGoal),
    updatedAt: record.updatedAt || new Date().toISOString()
  }));
}

function saveCalendarRecords(records, dataFile = CALENDAR_DATA_FILE) {
  writeJsonArray(dataFile, records);
}

function upsertCalendarRecord(tracker, calendarDataFile = CALENDAR_DATA_FILE) {
  const record = trackerToCalendarRecord(tracker);
  const records = readCalendarRecords(calendarDataFile);
  const index = records.findIndex(
    (item) => item.ownerEmail === record.ownerEmail && item.date === record.date
  );

  if (index >= 0) records[index] = record;
  else records.push(record);

  records.sort((a, b) => a.date.localeCompare(b.date) || a.ownerEmail.localeCompare(b.ownerEmail));
  saveCalendarRecords(records, calendarDataFile);
  return record;
}

function ensureCurrentTracker(
  ownerEmail,
  trackerDataFile = TRACKER_DATA_FILE,
  calendarDataFile = CALENDAR_DATA_FILE
) {
  const email = normalizeEmail(ownerEmail);
  const today = getSingaporeDate();
  const trackers = readTrackers(trackerDataFile);
  const index = trackers.findIndex((tracker) => tracker.ownerEmail === email);

  if (index < 0) {
    const tracker = createEmptyTracker(email, today);
    trackers.push(tracker);
    saveTrackers(trackers, trackerDataFile);
    return tracker;
  }

  const existing = normalizeTracker(trackers[index]);
  if (existing.date !== today) {
    upsertCalendarRecord(existing, calendarDataFile);
    const resetTracker = createEmptyTracker(email, today);
    trackers[index] = resetTracker;
    saveTrackers(trackers, trackerDataFile);
    return resetTracker;
  }

  return existing;
}

function updateCurrentTracker(
  ownerEmail,
  updater,
  trackerDataFile = TRACKER_DATA_FILE,
  calendarDataFile = CALENDAR_DATA_FILE
) {
  const email = normalizeEmail(ownerEmail);
  const current = ensureCurrentTracker(email, trackerDataFile, calendarDataFile);
  const trackers = readTrackers(trackerDataFile);
  const index = trackers.findIndex((tracker) => tracker.ownerEmail === email);
  const updated = normalizeTracker(updater({ ...current, foodEntries: [...current.foodEntries] }) || current);
  updated.ownerEmail = email;
  updated.date = getSingaporeDate();
  updated.totalCalories = calculateTotal(updated.foodEntries);
  updated.updatedAt = new Date().toISOString();

  if (index >= 0) trackers[index] = updated;
  else trackers.push(updated);

  saveTrackers(trackers, trackerDataFile);
  const calendarRecord = upsertCalendarRecord(updated, calendarDataFile);
  return { tracker: updated, calendarRecord };
}

function getCalendarForUser(ownerEmail, year, month, dataFile = CALENDAR_DATA_FILE) {
  const email = normalizeEmail(ownerEmail);
  const monthPrefix = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-`;
  return readCalendarRecords(dataFile).filter(
    (record) => record.ownerEmail === email && record.date.startsWith(monthPrefix)
  );
}

module.exports = {
  TRACKER_DATA_FILE,
  CALENDAR_DATA_FILE,
  getSingaporeDate,
  createEmptyTracker,
  calculateTotal,
  getStatus,
  readTrackers,
  saveTrackers,
  readCalendarRecords,
  saveCalendarRecords,
  upsertCalendarRecord,
  ensureCurrentTracker,
  updateCurrentTracker,
  getCalendarForUser
};
