const express = require('express');
const router = express.Router();
const { requireSession, normalizeEmail } = require('../middleware/helpers');
const {
  getSingaporeDate,
  ensureCurrentTracker,
  updateCurrentTracker,
  getCalendarForUser,
  upsertCalendarRecord
} = require('../models/calorieTrackerModel');

router.use(requireSession);

function getCurrentUserEmail(req) {
  return normalizeEmail(req.session.user);
}

function isNormalUser(email) {
  return Boolean(email) && email !== 'admin';
}

function rejectAdmin(req, res, next) {
  const email = getCurrentUserEmail(req);
  if (!isNormalUser(email)) {
    return res.status(403).json({ success: false, message: 'Calorie Tracker is for user accounts only.' });
  }
  next();
}

router.use(rejectAdmin);

router.get('/', (req, res) => {
  const email = getCurrentUserEmail(req);
  const tracker = ensureCurrentTracker(email);
  const calendarRecord = upsertCalendarRecord(tracker);
  return res.json({ success: true, tracker, calendarRecord, today: getSingaporeDate() });
});

router.get('/calendar', (req, res) => {
  const email = getCurrentUserEmail(req);
  const today = getSingaporeDate();
  const defaultYear = Number(today.slice(0, 4));
  const defaultMonth = Number(today.slice(5, 7));
  const year = Number(req.query.year) || defaultYear;
  const month = Number(req.query.month) || defaultMonth;

  if (year < 2000 || year > 2100 || month < 1 || month > 12) {
    return res.status(400).json({ success: false, message: 'Please provide a valid year and month.' });
  }

  const tracker = ensureCurrentTracker(email);
  upsertCalendarRecord(tracker);
  const records = getCalendarForUser(email, year, month);
  return res.json({ success: true, year, month, records });
});

router.put('/goal', (req, res) => {
  const goal = Number(req.body.goal);
  if (!Number.isFinite(goal) || goal <= 0 || goal > 20000) {
    return res.status(400).json({ success: false, message: 'Enter a valid calorie goal.' });
  }

  const result = updateCurrentTracker(getCurrentUserEmail(req), (tracker) => {
    tracker.goal = Math.round(goal);
    return tracker;
  });

  return res.json({
    success: true,
    message: `Saved ${result.tracker.goal} calories for today.`,
    ...result
  });
});

router.delete('/goal', (req, res) => {
  const result = updateCurrentTracker(getCurrentUserEmail(req), (tracker) => {
    tracker.goal = null;
    return tracker;
  });

  return res.json({ success: true, message: 'Today\'s calorie goal was cleared.', ...result });
});

router.put('/recommendation', (req, res) => {
  const age = Number(req.body.age);
  const gender = String(req.body.gender || '');
  const height = Number(req.body.height);
  const weight = Number(req.body.weight);
  const exerciseLevel = String(req.body.exerciseLevel || '');
  const recommended = Number(req.body.recommended);

  if (
    !Number.isFinite(age) || age < 10 || age > 120 ||
    !['male', 'female'].includes(gender) ||
    !Number.isFinite(height) || height < 100 || height > 260 ||
    !Number.isFinite(weight) || weight < 30 || weight > 500 ||
    !exerciseLevel ||
    !Number.isFinite(recommended) || recommended <= 0 || recommended > 20000
  ) {
    return res.status(400).json({ success: false, message: 'Please provide valid recommendation details.' });
  }

  const result = updateCurrentTracker(getCurrentUserEmail(req), (tracker) => {
    tracker.recommendedData = {
      age: Math.round(age),
      gender,
      height,
      weight,
      exerciseLevel,
      recommended: Math.round(recommended),
      date: getSingaporeDate()
    };
    return tracker;
  });

  return res.json({ success: true, message: 'Recommendation saved.', ...result });
});

router.post('/food', (req, res) => {
  const name = String(req.body.name || '').trim();
  const calories = Number(req.body.calories);

  if (!name || name.length > 100) {
    return res.status(400).json({ success: false, message: 'Enter a food name of 100 characters or fewer.' });
  }
  if (!Number.isFinite(calories) || calories <= 0 || calories > 20000) {
    return res.status(400).json({ success: false, message: 'Enter a valid calorie amount.' });
  }

  const foodEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    calories: Math.round(calories)
  };

  const result = updateCurrentTracker(getCurrentUserEmail(req), (tracker) => {
    tracker.foodEntries.push(foodEntry);
    return tracker;
  });

  return res.status(201).json({
    success: true,
    message: `Added ${foodEntry.name} (${foodEntry.calories} calories).`,
    foodEntry,
    ...result
  });
});

router.delete('/food/:id', (req, res) => {
  const itemId = String(req.params.id || '');
  const current = ensureCurrentTracker(getCurrentUserEmail(req));
  const exists = current.foodEntries.some((item) => item.id === itemId);

  if (!exists) {
    return res.status(404).json({ success: false, message: 'Food entry not found.' });
  }

  const result = updateCurrentTracker(getCurrentUserEmail(req), (tracker) => {
    tracker.foodEntries = tracker.foodEntries.filter((item) => item.id !== itemId);
    return tracker;
  });

  return res.json({ success: true, message: 'Food entry deleted.', ...result });
});

module.exports = router;
