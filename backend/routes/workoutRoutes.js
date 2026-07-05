const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

function readJson(fileName) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', fileName), 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJson(fileName, data) {
  fs.writeFileSync(path.join(__dirname, '..', 'data', fileName), JSON.stringify(data, null, 2));
}

router.get('/', (req, res) => {
  const workouts = readJson('workoutData.json');
  res.json({ success: true, workouts });
});

router.post('/', (req, res) => {
  const workout = req.body;
  const workouts = readJson('workoutData.json');
  const savedWorkout = { id: Date.now().toString(), ...workout };
  workouts.unshift(savedWorkout);
  writeJson('workoutData.json', workouts);
  res.json({ success: true, workout: savedWorkout, workouts });
});

router.put('/', (req, res) => {
  const { workouts } = req.body;
  writeJson('workoutData.json', workouts || []);
  res.json({ success: true, workouts: workouts || [] });
});

router.get('/plans', (req, res) => {
  const plans = readJson('workoutPlanData.json');
  res.json({ success: true, plans });
});

router.post('/plans', (req, res) => {
  const plan = req.body;
  const plans = readJson('workoutPlanData.json');
  const savedPlan = { id: Date.now().toString(), ...plan };
  plans.unshift(savedPlan);
  writeJson('workoutPlanData.json', plans);
  res.json({ success: true, plan: savedPlan, plans });
});

router.put('/plans', (req, res) => {
  const { plans } = req.body;
  writeJson('workoutPlanData.json', plans || []);
  res.json({ success: true, plans: plans || [] });
});

module.exports = router;
