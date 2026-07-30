const express = require('express');
const router = express.Router();
const { NutritionMeal, readNutritionMeals, saveNutritionMeals } = require('../models/nutritionModel');
const { requireSession, normalizeEmail } = require('../middleware/helpers');

router.use(requireSession);

function getCurrentUserEmail(req) {
  return normalizeEmail(req.session.user);
}

function getUserMeals(allMeals, email) {
  return allMeals.filter((meal) => normalizeEmail(meal.ownerEmail) === email);
}

function getTotals(items = []) {
  return items.reduce(
    (total, meal) => {
      total.calories += Number(meal.calories) || 0;
      total.protein += Number(meal.protein) || 0;
      total.carbs += Number(meal.carbs) || 0;
      total.fat += Number(meal.fat) || 0;
      return total;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

function getRecommendations(weight) {
  return {
    weightKg: weight,
    protein: { min: Math.round(weight * 1.6), max: Math.round(weight * 2.2), unit: 'g/day' },
    carbs: { min: Math.round(weight * 3), max: Math.round(weight * 5), unit: 'g/day' },
    fat: { min: Math.round(weight * 0.5), max: Math.round(weight * 1), unit: 'g/day' }
  };
}

router.get('/recommendations', (req, res) => {
  const weight = Number(req.query.weight);
  if (!weight || weight <= 0) {
    return res.status(400).json({
      message: 'Please provide a valid weight in kg, for example /api/nutrition/recommendations?weight=60'
    });
  }
  return res.json(getRecommendations(weight));
});

router.get('/', (req, res) => {
  const email = getCurrentUserEmail(req);
  const userMeals = getUserMeals(readNutritionMeals(), email);
  return res.json({ meals: userMeals, totals: getTotals(userMeals) });
});

router.post('/', (req, res) => {
  const { mealName, calories, protein, carbs, fat, date } = req.body;
  if (!mealName || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return res.status(400).json({ message: 'Meal name, calories, protein, carbs, and fat are required.' });
  }

  const email = getCurrentUserEmail(req);
  const allMeals = readNutritionMeals();
  const newId = allMeals.length > 0 ? Math.max(...allMeals.map((meal) => Number(meal.id) || 0)) + 1 : 1;
  const newMeal = new NutritionMeal(newId, email, mealName, calories, protein, carbs, fat, date);
  allMeals.push(newMeal);
  saveNutritionMeals(allMeals);

  const userMeals = getUserMeals(allMeals, email);
  return res.status(201).json({
    message: 'Meal added successfully.',
    meal: newMeal,
    totals: getTotals(userMeals)
  });
});

router.delete('/', (req, res) => {
  const email = getCurrentUserEmail(req);
  const allMeals = readNutritionMeals();
  const remainingMeals = allMeals.filter((meal) => normalizeEmail(meal.ownerEmail) !== email);
  saveNutritionMeals(remainingMeals);
  return res.json({ message: 'Your nutrition log was cleared successfully.', totals: getTotals([]) });
});

router.delete('/:id', (req, res) => {
  const email = getCurrentUserEmail(req);
  const mealId = Number(req.params.id);
  const allMeals = readNutritionMeals();
  const targetMeal = allMeals.find((meal) => Number(meal.id) === mealId);

  if (!targetMeal || normalizeEmail(targetMeal.ownerEmail) !== email) {
    return res.status(404).json({ message: 'Meal not found.' });
  }

  const remainingMeals = allMeals.filter((meal) => Number(meal.id) !== mealId);
  saveNutritionMeals(remainingMeals);
  const userMeals = getUserMeals(remainingMeals, email);
  return res.json({ message: 'Meal deleted successfully.', totals: getTotals(userMeals) });
});

router.get('/summary/macros', (req, res) => {
  const email = getCurrentUserEmail(req);
  const userMeals = getUserMeals(readNutritionMeals(), email);
  return res.json(getTotals(userMeals));
});

module.exports = router;
