const express = require('express');
const router = express.Router();
const { NutritionMeal, readNutritionMeals, saveNutritionMeals } = require('../models/nutritionModel');

let meals = readNutritionMeals();

function getTotals(items = meals) {
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
    protein: {
      min: Math.round(weight * 1.6),
      max: Math.round(weight * 2.2),
      unit: 'g/day'
    },
    carbs: {
      min: Math.round(weight * 3),
      max: Math.round(weight * 5),
      unit: 'g/day'
    },
    fat: {
      min: Math.round(weight * 0.5),
      max: Math.round(weight * 1),
      unit: 'g/day'
    }
  };
}

// GET suggested daily protein, carbs and fat based on body weight
router.get('/recommendations', (req, res) => {
  const weight = Number(req.query.weight);

  if (!weight || weight <= 0) {
    return res.status(400).json({
      message: 'Please provide a valid weight in kg, for example /api/nutrition/recommendations?weight=60'
    });
  }

  res.json(getRecommendations(weight));
});

// GET all meals
router.get('/', (req, res) => {
  meals = readNutritionMeals();
  res.json({
    meals,
    totals: getTotals(meals)
  });
});

// POST add meal
router.post('/', (req, res) => {
  const { mealName, calories, protein, carbs, fat, date } = req.body;

  if (!mealName || calories === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return res.status(400).json({
      message: 'Meal name, calories, protein, carbs, and fat are required.'
    });
  }

  meals = readNutritionMeals();
  const newId = meals.length > 0 ? Math.max(...meals.map((meal) => meal.id)) + 1 : 1;
  const newMeal = new NutritionMeal(newId, mealName, calories, protein, carbs, fat, date);

  meals.push(newMeal);
  saveNutritionMeals(meals);

  res.status(201).json({
    message: 'Meal added successfully.',
    meal: newMeal,
    totals: getTotals(meals)
  });
});

// DELETE meal
router.delete('/:id', (req, res) => {
  meals = readNutritionMeals();
  const mealId = Number(req.params.id);
  const oldLength = meals.length;

  meals = meals.filter((meal) => meal.id !== mealId);

  if (meals.length === oldLength) {
    return res.status(404).json({ message: 'Meal not found.' });
  }

  saveNutritionMeals(meals);

  res.json({
    message: 'Meal deleted successfully.',
    totals: getTotals(meals)
  });
});

// GET macro summary
router.get('/summary/macros', (req, res) => {
  meals = readNutritionMeals();
  res.json(getTotals(meals));
});

module.exports = router;
