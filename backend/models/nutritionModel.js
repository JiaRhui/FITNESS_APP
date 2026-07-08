class NutritionMeal {
  constructor(id, mealName, calories, protein, carbs, fat, date) {
    this.id = id;
    this.mealName = mealName;
    this.calories = Number(calories);
    this.protein = Number(protein);
    this.carbs = Number(carbs);
    this.fat = Number(fat);
    this.date = date || new Date().toISOString().split("T")[0];
  }
}

module.exports = NutritionMeal;
