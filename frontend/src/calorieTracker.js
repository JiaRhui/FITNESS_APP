const STORAGE_GOALS = 'rpFitnessCalorieGoals';
const STORAGE_FOOD = 'rpFitnessFoodLogs';
const STORAGE_RECOMMENDED = 'rpFitnessRecommendedIntake';

const goalDateInput = document.getElementById('goalDateInput');
const calorieGoalInput = document.getElementById('calorieGoalInput');
const saveGoalButton = document.getElementById('saveGoalButton');
const clearGoalButton = document.getElementById('clearGoalButton');
const goalMessage = document.getElementById('goalMessage');
const ageInput = document.getElementById('ageInput');
const genderInput = document.getElementById('genderInput');
const heightInput = document.getElementById('heightInput');
const weightInput = document.getElementById('weightInput');
const exerciseLevelInput = document.getElementById('exerciseLevelInput');
const calculateRecommendationButton = document.getElementById('calculateRecommendationButton');
const useRecommendedButton = document.getElementById('useRecommendedButton');
const recommendationResult = document.getElementById('recommendationResult');
const progressGoalValue = document.getElementById('progressGoalValue');
const progressFoodValue = document.getElementById('progressFoodValue');
const progressRemainingValue = document.getElementById('progressRemainingValue');
const progressStatusValue = document.getElementById('progressStatusValue');
const foodDateInput = document.getElementById('foodDateInput');
const foodNameInput = document.getElementById('foodNameInput');
const foodCaloriesInput = document.getElementById('foodCaloriesInput');
const addFoodButton = document.getElementById('addFoodButton');
const foodList = document.getElementById('foodList');
const foodSummary = document.getElementById('foodSummary');
const calendarTitle = document.getElementById('calendarTitle');
const calendarDays = document.getElementById('calendarDays');

let calorieGoals = {};
let foodLogs = {};
let recommendedData = {};
let calendarDate = new Date();

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function saveJSON(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function initCalorieTracker() {
  calorieGoals = loadJSON(STORAGE_GOALS, {});
  foodLogs = loadJSON(STORAGE_FOOD, {});
  recommendedData = loadJSON(STORAGE_RECOMMENDED, {});

  const today = new Date();
  goalDateInput.value = formatDate(today);
  foodDateInput.value = formatDate(today);

  if (recommendedData.recommended) {
    recommendationResult.textContent = `Recommended intake: ${recommendedData.recommended} calories.`;
    ageInput.value = recommendedData.age || '';
    genderInput.value = recommendedData.gender || 'male';
    heightInput.value = recommendedData.height || '';
    weightInput.value = recommendedData.weight || '';
    exerciseLevelInput.value = recommendedData.exerciseLevel || 'exercise regularly';
  }

  saveGoalButton.addEventListener('click', saveGoal);
  clearGoalButton.addEventListener('click', clearGoal);
  calculateRecommendationButton.addEventListener('click', calculateRecommendation);
  useRecommendedButton.addEventListener('click', useRecommendedGoal);
  addFoodButton.addEventListener('click', addFoodEntry);
  goalDateInput.addEventListener('change', () => renderAll());
  foodDateInput.addEventListener('change', () => renderAll());

  renderAll();
}

function saveGoal() {
  const dateKey = goalDateInput.value;
  const goalValue = getNumber(calorieGoalInput.value);

  if (!dateKey) {
    goalMessage.textContent = 'Select a valid date first.';
    return;
  }

  if (!goalValue || goalValue <= 0) {
    goalMessage.textContent = 'Enter a valid calorie goal.';
    return;
  }

  calorieGoals[dateKey] = goalValue;
  saveJSON(STORAGE_GOALS, calorieGoals);
  goalMessage.textContent = `Saved ${goalValue} calories for ${dateKey}.`;
  renderAll();
}

function clearGoal() {
  const dateKey = goalDateInput.value;
  if (!dateKey) return;
  if (dateKey in calorieGoals) {
    delete calorieGoals[dateKey];
    saveJSON(STORAGE_GOALS, calorieGoals);
  }
  goalMessage.textContent = `Cleared goal for ${dateKey}.`;
  renderAll();
}

function calculateRecommendation() {
  const age = getNumber(ageInput.value);
  const gender = genderInput.value;
  const height = getNumber(heightInput.value);
  const weight = getNumber(weightInput.value);
  const exerciseLevel = exerciseLevelInput.value;

  if (!age || !height || !weight) {
    recommendationResult.textContent = 'Enter age, height, weight and exercise level.';
    return;
  }

  let bmr = 10 * weight + 6.25 * height - 5 * age;
  bmr += gender === 'male' ? 5 : -161;
  let activity = 1.2;

  if (exerciseLevel === 'exercise regularly') activity = 1.725;
  else if (exerciseLevel === 'exercise a few times a week') activity = 1.55;
  else if (exerciseLevel === 'exercise sometimes') activity = 1.375;
  else if (exerciseLevel === 'rarely exercise') activity = 1.2;
  else activity = 1.1;

  const recommended = Math.round(bmr * activity);
  recommendationResult.textContent = `Recommended intake: ${recommended} calories.`;
  recommendedData = { age, gender, height, weight, exerciseLevel, recommended, date: formatDate(new Date()) };
  saveJSON(STORAGE_RECOMMENDED, recommendedData);
}

function useRecommendedGoal() {
  if (!recommendedData.recommended) {
    recommendationResult.textContent = 'Calculate the recommendation first.';
    return;
  }
  calorieGoalInput.value = recommendedData.recommended;
  saveGoal();
}

function addFoodEntry() {
  const entryDate = foodDateInput.value;
  const name = foodNameInput.value.trim();
  const calories = getNumber(foodCaloriesInput.value);

  if (!entryDate || !name || !calories || calories <= 0) {
    foodSummary.textContent = 'Provide a food name, date and calorie amount.';
    return;
  }

  if (!foodLogs[entryDate]) {
    foodLogs[entryDate] = [];
  }

  foodLogs[entryDate].push({ id: Date.now().toString(), name, calories });
  saveJSON(STORAGE_FOOD, foodLogs);
  foodNameInput.value = '';
  foodCaloriesInput.value = '';
  foodSummary.textContent = `Added ${name} (${calories} calories).`;
  renderAll();
}

function deleteFoodEntry(dateKey, itemId) {
  if (!foodLogs[dateKey]) return;
  foodLogs[dateKey] = foodLogs[dateKey].filter((item) => item.id !== itemId);
  if (!foodLogs[dateKey].length) {
    delete foodLogs[dateKey];
  }
  saveJSON(STORAGE_FOOD, foodLogs);
  renderAll();
}

function getFoodTotal(dateKey) {
  if (!foodLogs[dateKey]) return 0;
  return foodLogs[dateKey].reduce((sum, item) => sum + Number(item.calories || 0), 0);
}

function getStatusForDate(dateKey) {
  const goal = calorieGoals[dateKey];
  const eaten = getFoodTotal(dateKey);

  if (!goal) return { state: 'no-goal', label: 'No goal set', color: 'grey' };
  if (eaten === goal) return { state: 'reached', label: 'Goal reached', color: 'green' };
  if (eaten < goal) return { state: 'under', label: 'Under goal', color: 'red' };
  return { state: 'over', label: 'Over goal', color: 'red' };
}

function renderGoalPanel(dateKey) {
  const goal = calorieGoals[dateKey];
  progressGoalValue.textContent = goal ? `${goal} calories` : 'Not set';
}

function renderFoodList(dateKey) {
  const entries = foodLogs[dateKey] || [];
  foodList.innerHTML = '';

  if (!entries.length) {
    foodList.innerHTML = '<li class="empty-state">No food entries for this date.</li>';
    return;
  }

  entries.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'food-item';
    listItem.innerHTML = `
      <span>${item.name}: ${item.calories} calories</span>
      <button type="button" class="danger-button">Delete</button>
    `;
    const deleteButton = listItem.querySelector('button');
    deleteButton.addEventListener('click', () => deleteFoodEntry(dateKey, item.id));
    foodList.appendChild(listItem);
  });
}

function renderProgress(dateKey) {
  const goal = calorieGoals[dateKey];
  const eaten = getFoodTotal(dateKey);

  progressFoodValue.textContent = `${eaten} calories`;

  if (!goal) {
    progressRemainingValue.textContent = 'Set a goal to see progress';
    progressStatusValue.textContent = 'No goal set';
    return;
  }

  const remaining = goal - eaten;
  if (remaining === 0) {
    progressRemainingValue.textContent = '0 calories';
    progressStatusValue.textContent = 'Goal reached';
  } else if (remaining > 0) {
    progressRemainingValue.textContent = `${remaining} calories`; 
    progressStatusValue.textContent = `Under goal by ${remaining}`;
  } else {
    progressRemainingValue.textContent = `${Math.abs(remaining)} calories over`; 
    progressStatusValue.textContent = `Over goal by ${Math.abs(remaining)}`;
  }
}

function renderCalendar() {
  calendarDays.innerHTML = '';
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString('default', { month: 'long' });
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  calendarTitle.textContent = `${monthName} ${year}`;

  for (let i = firstDayIndex - 1; i >= 0; i -= 1) {
    const fillerDate = prevMonthDays - i;
    const dayElement = createCalendarDay(fillerDate, null, true);
    calendarDays.appendChild(dayElement);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDate(new Date(year, month, day));
    const status = getStatusForDate(dateKey);
    const dayElement = createCalendarDay(day, status, false, dateKey);
    calendarDays.appendChild(dayElement);
  }

  const totalCells = firstDayIndex + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  for (let i = 1; i <= remainingCells; i += 1) {
    const dayElement = createCalendarDay(i, null, true);
    calendarDays.appendChild(dayElement);
  }
}

function createCalendarDay(dayNumber, status, isFiller, dateKey) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';
  if (isFiller) {
    dayElement.classList.add('filler');
  } else if (status) {
    dayElement.classList.add(status.color);
  }

  const dateNumber = document.createElement('span');
  dateNumber.className = 'date-number';
  dateNumber.textContent = dayNumber;

  dayElement.appendChild(dateNumber);

  if (!isFiller && dateKey) {
    const goal = calorieGoals[dateKey];
    const eaten = getFoodTotal(dateKey);
    const meta = document.createElement('div');
    meta.className = 'calendar-meta';
    if (goal) {
      meta.innerHTML = `<span>${eaten} / ${goal}</span><span>${getStatusForDate(dateKey).label}</span>`;
    } else if (eaten > 0) {
      meta.innerHTML = `<span>${eaten} calories</span><span>No goal set</span>`;
    } else {
      meta.innerHTML = `<span>No goal</span><span>--</span>`;
    }
    dayElement.appendChild(meta);
  }

  return dayElement;
}

function renderAll() {
  const goalDateKey = goalDateInput.value;
  const foodDateKey = foodDateInput.value;

  renderGoalPanel(goalDateKey);
  renderFoodList(foodDateKey);
  renderProgress(goalDateKey);
  renderCalendar();
}

window.addEventListener('load', () => {
  if (goalDateInput && foodDateInput && saveGoalButton) {
    initCalorieTracker();
  }
});
