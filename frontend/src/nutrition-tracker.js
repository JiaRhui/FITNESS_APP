const API_URL = "/api/nutrition";
const RECOMMENDATION_URL = "/api/nutrition/recommendations";

const mealForm = document.getElementById("mealForm");
const mealList = document.getElementById("mealList");
const resetBtn = document.getElementById("resetBtn");

const foodSearchName = document.getElementById("foodSearchName");
const macroGoogleLink = document.getElementById("macroGoogleLink");
const bodyWeight = document.getElementById("bodyWeight");
const suggestedProtein = document.getElementById("suggestedProtein");
const suggestedCarbs = document.getElementById("suggestedCarbs");
const suggestedFat = document.getElementById("suggestedFat");

const totalCalories = document.getElementById("totalCalories");
const totalProtein = document.getElementById("totalProtein");
const totalCarbs = document.getElementById("totalCarbs");
const totalFat = document.getElementById("totalFat");

const proteinBar = document.getElementById("proteinBar");
const carbsBar = document.getElementById("carbsBar");
const fatBar = document.getElementById("fatBar");

const DAILY_GOALS = {
  protein: 120,
  carbs: 250,
  fat: 70
};

let meals = [];
document.getElementById("mealDate").value = new Date().toISOString().split("T")[0];

foodSearchName.addEventListener("input", () => {
  const food = foodSearchName.value.trim();

  if (!food) {
    macroGoogleLink.style.display = "none";
    macroGoogleLink.href = "#";
    return;
  }

  macroGoogleLink.style.display = "inline-block";
  macroGoogleLink.href = `https://www.google.com/search?q=${encodeURIComponent(food + " protein carbs fat nutrition")}`;
});

bodyWeight.addEventListener("input", async () => {
  const weight = Number(bodyWeight.value);

  if (!weight || weight <= 0) {
    suggestedProtein.textContent = "1.6g - 2.2g / kg";
    suggestedCarbs.textContent = "3g - 5g / kg";
    suggestedFat.textContent = "0.5g - 1g / kg";
    return;
  }

  try {
    const response = await fetch(`${RECOMMENDATION_URL}?weight=${weight}`);

    if (!response.ok) {
      throw new Error("Backend not connected");
    }

    const data = await response.json();
    suggestedProtein.textContent = `${data.protein.min}g - ${data.protein.max}g / day`;
    suggestedCarbs.textContent = `${data.carbs.min}g - ${data.carbs.max}g / day`;
    suggestedFat.textContent = `${data.fat.min}g - ${data.fat.max}g / day`;
  } catch (error) {
    suggestedProtein.textContent = `${Math.round(weight * 1.6)}g - ${Math.round(weight * 2.2)}g / day`;
    suggestedCarbs.textContent = `${Math.round(weight * 3)}g - ${Math.round(weight * 5)}g / day`;
    suggestedFat.textContent = `${Math.round(weight * 0.5)}g - ${Math.round(weight * 1)}g / day`;
  }
});

async function loadMeals() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Backend not connected");
    }

    const data = await response.json();
    meals = data.meals || [];
  } catch (error) {
    meals = JSON.parse(localStorage.getItem("nutritionMeals")) || [];
  }

  renderMeals();
  updateMacros();
}

async function addMeal(meal) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(meal)
    });

    if (!response.ok) {
      throw new Error("Backend not connected");
    }

    await loadMeals();
  } catch (error) {
    meal.id = Date.now();
    meals.push(meal);
    localStorage.setItem("nutritionMeals", JSON.stringify(meals));
    renderMeals();
    updateMacros();
  }
}

async function deleteMeal(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

    if (!response.ok) {
      throw new Error("Backend not connected");
    }

    await loadMeals();
  } catch (error) {
    meals = meals.filter(meal => meal.id !== id);
    localStorage.setItem("nutritionMeals", JSON.stringify(meals));
    renderMeals();
    updateMacros();
  }
}

function renderMeals() {
  mealList.innerHTML = "";

  if (meals.length === 0) {
    mealList.innerHTML = '<div class="empty">No meals logged yet. Add your first meal above.</div>';
    return;
  }

  meals.slice().reverse().forEach(meal => {
    const item = document.createElement("div");
    item.className = "meal-item";

    item.innerHTML = `
      <div>
        <div class="meal-name">${meal.mealName}</div>
        <div class="meal-details">
          ${meal.date || "-"} |
          ${meal.calories} kcal |
          Protein: ${meal.protein}g |
          Carbs: ${meal.carbs}g |
          Fat: ${meal.fat}g
        </div>
      </div>
      <button class="delete-btn" onclick="deleteMeal(${meal.id})">Delete</button>
    `;

    mealList.appendChild(item);
  });
}

function updateMacros() {
  const totals = meals.reduce(
    (sum, meal) => {
      sum.calories += Number(meal.calories) || 0;
      sum.protein += Number(meal.protein) || 0;
      sum.carbs += Number(meal.carbs) || 0;
      sum.fat += Number(meal.fat) || 0;
      return sum;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  totalCalories.textContent = totals.calories;
  totalProtein.textContent = `${totals.protein}g`;
  totalCarbs.textContent = `${totals.carbs}g`;
  totalFat.textContent = `${totals.fat}g`;

  proteinBar.style.width = `${Math.min((totals.protein / DAILY_GOALS.protein) * 100, 100)}%`;
  carbsBar.style.width = `${Math.min((totals.carbs / DAILY_GOALS.carbs) * 100, 100)}%`;
  fatBar.style.width = `${Math.min((totals.fat / DAILY_GOALS.fat) * 100, 100)}%`;
}

mealForm.addEventListener("submit", event => {
  event.preventDefault();

  const meal = {
    mealName: document.getElementById("mealName").value.trim(),
    calories: Number(document.getElementById("calories").value),
    protein: Number(document.getElementById("protein").value),
    carbs: Number(document.getElementById("carbs").value),
    fat: Number(document.getElementById("fat").value),
    date: document.getElementById("mealDate").value
  };

  addMeal(meal);

  mealForm.reset();
  document.getElementById("mealDate").value = new Date().toISOString().split("T")[0];
});

resetBtn.addEventListener("click", () => {
  localStorage.removeItem("nutritionMeals");
  meals = [];
  renderMeals();
  updateMacros();
});

loadMeals();
