const fs = require('fs');
const path = require('path');
const { readUsers, saveUsers } = require('../models/userModel');
const { readNutritionMeals, saveNutritionMeals } = require('../models/nutritionModel');
const { normalizeEmail } = require('../middleware/helpers');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readArrayFile(fileName) {
  const filePath = path.join(DATA_DIR, fileName);

  try {
    if (!fs.existsSync(filePath)) return [];
    const rawData = fs.readFileSync(filePath, 'utf8').trim();
    if (!rawData) return [];

    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Unable to read ${fileName}:`, error);
    return [];
  }
}

function saveArrayFile(fileName, records) {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
}

function belongsToUser(record, email) {
  return normalizeEmail(record && record.ownerEmail) === email;
}

function getUsers(req, res) {
  const users = readUsers().map((user) => ({ email: user.email }));
  return res.json({ success: true, users });
}

function deleteUser(req, res) {
  const email = normalizeEmail(req.body && req.body.email);
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const users = readUsers();
  const remainingUsers = users.filter((user) => normalizeEmail(user.email) !== email);

  if (remainingUsers.length === users.length) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  saveUsers(remainingUsers);

  const nutritionMeals = readNutritionMeals();
  saveNutritionMeals(nutritionMeals.filter((meal) => !belongsToUser(meal, email)));

  const workouts = readArrayFile('workoutData.json');
  saveArrayFile('workoutData.json', workouts.filter((workout) => !belongsToUser(workout, email)));

  const workoutPlans = readArrayFile('workoutPlanData.json');
  saveArrayFile('workoutPlanData.json', workoutPlans.filter((plan) => !belongsToUser(plan, email)));

  return res.json({
    success: true,
    message: 'User and associated fitness data deleted successfully'
  });
}

function userOverview(req, res) {
  const email = normalizeEmail(req.body && req.body.email);
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const user = readUsers().find((item) => normalizeEmail(item.email) === email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const foods = readNutritionMeals().filter((meal) => belongsToUser(meal, email));
  const totalCalories = foods.reduce(
    (total, food) => total + (Number.isFinite(Number(food.calories)) ? Number(food.calories) : 0),
    0
  );

  const workoutCount = readArrayFile('workoutData.json')
    .filter((workout) => belongsToUser(workout, email)).length;

  const workoutPlanCount = readArrayFile('workoutPlanData.json')
    .filter((plan) => belongsToUser(plan, email)).length;

  return res.json({
    success: true,
    overview: {
      email: user.email,
      createdAt: user.createdAt || 'Unknown',
      lastLogin: user.lastLogin || 'Never',
      foodCount: foods.length,
      totalCalories,
      workoutCount,
      workoutPlanCount
    }
  });
}

module.exports = { getUsers, deleteUser, userOverview };
