const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireSession, normalizeEmail } = require('../middleware/helpers');

const router = express.Router();
router.use(requireSession);

function readJson(fileName) {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', fileName), 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(__dirname, '..', 'data', fileName), JSON.stringify(data, null, 2));
}

function currentUserEmail(req) {
  return normalizeEmail(req.session.user);
}

function belongsTo(record, email) {
  return normalizeEmail(record.ownerEmail) === email;
}

function withoutOwnership(record) {
  const { ownerEmail, ...safeRecord } = record;
  return safeRecord;
}

router.get('/', (req, res) => {
  const email = currentUserEmail(req);
  const workouts = readJson('workoutData.json').filter((item) => belongsTo(item, email)).map(withoutOwnership);
  res.json({ success: true, workouts });
});

router.post('/', (req, res) => {
  const email = currentUserEmail(req);
  const workouts = readJson('workoutData.json');
  const savedWorkout = { ...req.body, id: String(req.body.id || Date.now()), ownerEmail: email };
  workouts.unshift(savedWorkout);
  writeJson('workoutData.json', workouts);
  const userWorkouts = workouts.filter((item) => belongsTo(item, email)).map(withoutOwnership);
  res.status(201).json({ success: true, workout: withoutOwnership(savedWorkout), workouts: userWorkouts });
});

router.put('/', (req, res) => {
  const email = currentUserEmail(req);
  const allWorkouts = readJson('workoutData.json');
  const otherUsersWorkouts = allWorkouts.filter((item) => !belongsTo(item, email));
  const userWorkouts = Array.isArray(req.body.workouts)
    ? req.body.workouts.map((item) => ({ ...item, id: String(item.id || Date.now()), ownerEmail: email }))
    : [];
  writeJson('workoutData.json', [...userWorkouts, ...otherUsersWorkouts]);
  res.json({ success: true, workouts: userWorkouts.map(withoutOwnership) });
});

router.get('/plans', (req, res) => {
  const email = currentUserEmail(req);
  const plans = readJson('workoutPlanData.json').filter((item) => belongsTo(item, email)).map(withoutOwnership);
  res.json({ success: true, plans });
});

router.post('/plans', (req, res) => {
  const email = currentUserEmail(req);
  const plans = readJson('workoutPlanData.json');
  const savedPlan = { ...req.body, id: String(req.body.id || Date.now()), ownerEmail: email };
  plans.unshift(savedPlan);
  writeJson('workoutPlanData.json', plans);
  const userPlans = plans.filter((item) => belongsTo(item, email)).map(withoutOwnership);
  res.status(201).json({ success: true, plan: withoutOwnership(savedPlan), plans: userPlans });
});

router.put('/plans', (req, res) => {
  const email = currentUserEmail(req);
  const allPlans = readJson('workoutPlanData.json');
  const otherUsersPlans = allPlans.filter((item) => !belongsTo(item, email));
  const userPlans = Array.isArray(req.body.plans)
    ? req.body.plans.map((item) => ({ ...item, id: String(item.id || Date.now()), ownerEmail: email }))
    : [];
  writeJson('workoutPlanData.json', [...userPlans, ...otherUsersPlans]);
  res.json({ success: true, plans: userPlans.map(withoutOwnership) });
});

module.exports = router;
