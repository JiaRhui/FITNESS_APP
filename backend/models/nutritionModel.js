const fs = require('fs');
const path = require('path');

class NutritionMeal {
  constructor(id, mealName, calories, protein, carbs, fat, date) {
    this.id = id;
    this.mealName = mealName;
    this.calories = Number(calories);
    this.protein = Number(protein);
    this.carbs = Number(carbs);
    this.fat = Number(fat);
    this.date = date || new Date().toISOString().split('T')[0];
  }
}

const DATA_FILE = path.join(__dirname, '..', 'data', 'nutritionData.json');

function ensureDataFile(dataFile = DATA_FILE) {
  const dataDir = path.dirname(dataFile);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, '[]');
}

function readNutritionMeals(dataFile = DATA_FILE) {
  ensureDataFile(dataFile);
  const rawData = fs.readFileSync(dataFile, 'utf8').trim();
  if (!rawData) return [];

  const parsed = JSON.parse(rawData);
  if (!Array.isArray(parsed)) return [];

  return parsed.map((meal) => {
    if (meal instanceof NutritionMeal) return meal;
    return new NutritionMeal(meal.id, meal.mealName, meal.calories, meal.protein, meal.carbs, meal.fat, meal.date);
  });
}

function saveNutritionMeals(meals, dataFile = DATA_FILE) {
  ensureDataFile(dataFile);
  fs.writeFileSync(dataFile, JSON.stringify(meals, null, 2));
}

NutritionMeal.readNutritionMeals = readNutritionMeals;
NutritionMeal.saveNutritionMeals = saveNutritionMeals;

module.exports = {
  NutritionMeal,
  readNutritionMeals,
  saveNutritionMeals
};
