const fs = require('fs');
const path = require('path');
const { findUserByEmail, getAllUsers, deleteUserByEmail } = require('../models/userModel');
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

async function getUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.json({ success: true, users: users.map((user) => ({ email: user.email })) });
  } catch (err) {
    console.error('getUsers error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching users' });
  }
}

async function deleteUser(req, res) {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const existing = await findUserByEmail(email);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await deleteUserByEmail(email);

    // NOTE: workouts / workout plans / nutrition data still live in the JSON
    // files below until those models are migrated to MySQL too (their tables
    // already exist in schema.sql, ready for when you get to them).
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
  } catch (err) {
    console.error('deleteUser error:', err);
    return res.status(500).json({ success: false, message: 'Server error deleting user' });
  }
}

async function userOverview(req, res) {
  try {
    const email = normalizeEmail(req.body && req.body.email);
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await findUserByEmail(email);
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
        createdAt: user.created_at || 'Unknown',
        lastLogin: user.last_login || 'Never',
        foodCount: foods.length,
        totalCalories,
        workoutCount,
        workoutPlanCount
      }
    });
  } catch (err) {
    console.error('userOverview error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching overview' });
  }
}

module.exports = { getUsers, deleteUser, userOverview };
