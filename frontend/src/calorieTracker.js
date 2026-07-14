const API_BASE = '/api/calorie-tracker';

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

let currentUserEmail = '';
let serverToday = '';
let currentTracker = {
  date: '',
  goal: null,
  recommendedData: null,
  foodEntries: [],
  totalCalories: 0
};
let calendarRecords = {};
let calendarDate = new Date();

async function requestJSON(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: 'The server returned an invalid response.' };
  }

  if (response.status === 401) {
    window.location.href = '/pages/login.html';
    throw new Error('Login required');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Unable to complete the request.');
  }

  return data;
}

async function loadCurrentUser() {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  const data = await response.json();

  if (!response.ok || !data.loggedIn || !data.email || data.email === 'admin') {
    window.location.href = '/pages/login.html';
    throw new Error('Login required');
  }

  currentUserEmail = String(data.email).trim().toLowerCase();
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function setButtonBusy(button, isBusy, busyText = 'Saving...') {
  if (!button) return;
  if (isBusy) {
    button.dataset.originalText = button.textContent;
    button.textContent = busyText;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function applyTracker(tracker) {
  const trackerDate = String(tracker.date || serverToday);
  if (trackerDate && trackerDate !== serverToday) {
    serverToday = trackerDate;
    const [year, month, day] = serverToday.split('-').map(Number);
    calendarDate = new Date(year, month - 1, day);
    enforceTodayInputs();
  }

  currentTracker = {
    date: trackerDate,
    goal: Number(tracker.goal) > 0 ? Number(tracker.goal) : null,
    recommendedData: tracker.recommendedData || null,
    foodEntries: Array.isArray(tracker.foodEntries) ? tracker.foodEntries : [],
    totalCalories: Number(tracker.totalCalories) || 0
  };
}

function enforceTodayInputs() {
  if (!serverToday) return;
  goalDateInput.value = serverToday;
  foodDateInput.value = serverToday;
  goalDateInput.min = serverToday;
  goalDateInput.max = serverToday;
  foodDateInput.min = serverToday;
  foodDateInput.max = serverToday;
}

function fillRecommendationForm() {
  const recommendedData = currentTracker.recommendedData;
  if (!recommendedData || !recommendedData.recommended) {
    recommendationResult.textContent = '';
    return;
  }

  recommendationResult.textContent = `Recommended intake: ${recommendedData.recommended} calories.`;
  ageInput.value = recommendedData.age || '';
  genderInput.value = recommendedData.gender || 'male';
  heightInput.value = recommendedData.height || '';
  weightInput.value = recommendedData.weight || '';
  exerciseLevelInput.value = recommendedData.exerciseLevel || 'exercise regularly';
}

async function loadCalendarData() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth() + 1;
  const data = await requestJSON(`${API_BASE}/calendar?year=${year}&month=${month}`);
  calendarRecords = {};
  (data.records || []).forEach((record) => {
    calendarRecords[record.date] = record;
  });
}

async function loadTrackerData() {
  const data = await requestJSON(API_BASE);
  serverToday = data.today;
  applyTracker(data.tracker || {});
  const [year, month, day] = serverToday.split('-').map(Number);
  calendarDate = new Date(year, month - 1, day);
  enforceTodayInputs();
  fillRecommendationForm();
  await loadCalendarData();
}

async function initCalorieTracker() {
  goalMessage.textContent = 'Loading your calorie tracker...';

  await loadTrackerData();

  saveGoalButton.addEventListener('click', saveGoal);
  clearGoalButton.addEventListener('click', clearGoal);
  calculateRecommendationButton.addEventListener('click', calculateRecommendation);
  useRecommendedButton.addEventListener('click', useRecommendedGoal);
  addFoodButton.addEventListener('click', addFoodEntry);
  goalDateInput.addEventListener('change', enforceTodayInputs);
  foodDateInput.addEventListener('change', enforceTodayInputs);

  goalMessage.textContent = `Signed in as ${currentUserEmail}. Today's data is saved to the backend.`;
  renderAll();
}

async function refreshAfterChange(result) {
  if (result.tracker) applyTracker(result.tracker);
  if (result.calendarRecord) calendarRecords[result.calendarRecord.date] = result.calendarRecord;
  fillRecommendationForm();
  await loadCalendarData();
  renderAll();
}

async function saveGoal() {
  const goalValue = getNumber(calorieGoalInput.value);

  if (!goalValue || goalValue <= 0) {
    goalMessage.textContent = 'Enter a valid calorie goal.';
    return;
  }

  setButtonBusy(saveGoalButton, true, 'Saving goal...');
  try {
    const data = await requestJSON(`${API_BASE}/goal`, {
      method: 'PUT',
      body: JSON.stringify({ goal: goalValue })
    });
    goalMessage.textContent = data.message;
    await refreshAfterChange(data);
  } catch (error) {
    goalMessage.textContent = error.message;
  } finally {
    setButtonBusy(saveGoalButton, false);
  }
}

async function clearGoal() {
  setButtonBusy(clearGoalButton, true, 'Clearing...');
  try {
    const data = await requestJSON(`${API_BASE}/goal`, { method: 'DELETE' });
    calorieGoalInput.value = '';
    goalMessage.textContent = data.message;
    await refreshAfterChange(data);
  } catch (error) {
    goalMessage.textContent = error.message;
  } finally {
    setButtonBusy(clearGoalButton, false);
  }
}

async function calculateRecommendation() {
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
  setButtonBusy(calculateRecommendationButton, true, 'Calculating...');

  try {
    const data = await requestJSON(`${API_BASE}/recommendation`, {
      method: 'PUT',
      body: JSON.stringify({ age, gender, height, weight, exerciseLevel, recommended })
    });
    recommendationResult.textContent = `Recommended intake: ${recommended} calories.`;
    await refreshAfterChange(data);
  } catch (error) {
    recommendationResult.textContent = error.message;
  } finally {
    setButtonBusy(calculateRecommendationButton, false);
  }
}

async function useRecommendedGoal() {
  const recommendedData = currentTracker.recommendedData;
  if (!recommendedData || !recommendedData.recommended) {
    recommendationResult.textContent = 'Calculate the recommendation first.';
    return;
  }

  calorieGoalInput.value = recommendedData.recommended;
  await saveGoal();
}

async function addFoodEntry() {
  const name = foodNameInput.value.trim();
  const calories = getNumber(foodCaloriesInput.value);

  if (!name || !calories || calories <= 0) {
    foodSummary.textContent = 'Provide a food name and calorie amount.';
    return;
  }

  setButtonBusy(addFoodButton, true, 'Logging food...');
  try {
    const data = await requestJSON(`${API_BASE}/food`, {
      method: 'POST',
      body: JSON.stringify({ name, calories })
    });
    foodNameInput.value = '';
    foodCaloriesInput.value = '';
    foodSummary.textContent = data.message;
    await refreshAfterChange(data);
  } catch (error) {
    foodSummary.textContent = error.message;
  } finally {
    setButtonBusy(addFoodButton, false);
  }
}

async function deleteFoodEntry(itemId, button) {
  setButtonBusy(button, true, 'Deleting...');
  try {
    const data = await requestJSON(`${API_BASE}/food/${encodeURIComponent(itemId)}`, {
      method: 'DELETE'
    });
    foodSummary.textContent = data.message;
    await refreshAfterChange(data);
  } catch (error) {
    foodSummary.textContent = error.message;
    setButtonBusy(button, false);
  }
}

function getCurrentStatus() {
  const goal = currentTracker.goal;
  const eaten = currentTracker.totalCalories;

  if (!goal) return { state: 'no-goal', label: 'No goal set', color: 'grey' };
  if (eaten === goal) return { state: 'reached', label: 'Goal reached', color: 'green' };
  if (eaten < goal) return { state: 'under', label: 'Under goal', color: 'red' };
  return { state: 'over', label: 'Over goal', color: 'red' };
}

function getCalendarStatus(dateKey) {
  const record = calendarRecords[dateKey];
  if (!record) return { state: 'no-goal', label: 'No goal set', color: 'grey' };
  return {
    state: record.status || 'no-goal',
    label: record.statusLabel || 'No goal set',
    color: record.color || 'grey'
  };
}

function renderGoalPanel() {
  const goal = currentTracker.goal;
  progressGoalValue.textContent = goal ? `${goal} calories` : 'Not set';
  calorieGoalInput.value = goal || '';
}

function renderFoodList() {
  const entries = currentTracker.foodEntries || [];
  foodList.innerHTML = '';

  if (!entries.length) {
    const emptyItem = document.createElement('li');
    emptyItem.className = 'empty-state';
    emptyItem.textContent = 'No food entries for today.';
    foodList.appendChild(emptyItem);
    return;
  }

  entries.forEach((item) => {
    const listItem = document.createElement('li');
    listItem.className = 'food-item';

    const description = document.createElement('span');
    description.textContent = `${item.name}: ${item.calories} calories`;

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'danger-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => deleteFoodEntry(item.id, deleteButton));

    listItem.appendChild(description);
    listItem.appendChild(deleteButton);
    foodList.appendChild(listItem);
  });
}

function renderProgress() {
  const goal = currentTracker.goal;
  const eaten = currentTracker.totalCalories;

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
    calendarDays.appendChild(createCalendarDay(prevMonthDays - i, null, true));
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDate(new Date(year, month, day));
    const status = getCalendarStatus(dateKey);
    calendarDays.appendChild(createCalendarDay(day, status, false, dateKey));
  }

  const totalCells = firstDayIndex + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);

  for (let i = 1; i <= remainingCells; i += 1) {
    calendarDays.appendChild(createCalendarDay(i, null, true));
  }
}

function createCalendarDay(dayNumber, status, isFiller, dateKey) {
  const dayElement = document.createElement('div');
  dayElement.className = 'calendar-day';

  if (isFiller) dayElement.classList.add('filler');
  else if (status) dayElement.classList.add(status.color);

  const dateNumber = document.createElement('span');
  dateNumber.className = 'date-number';
  dateNumber.textContent = dayNumber;
  dayElement.appendChild(dateNumber);

  if (!isFiller && dateKey) {
    const record = calendarRecords[dateKey];
    const meta = document.createElement('div');
    meta.className = 'calendar-meta';

    const amount = document.createElement('span');
    const label = document.createElement('span');

    if (record && record.goal) {
      amount.textContent = `${record.caloriesConsumed} / ${record.goal}`;
      label.textContent = record.statusLabel;
    } else if (record && record.caloriesConsumed > 0) {
      amount.textContent = `${record.caloriesConsumed} calories`;
      label.textContent = 'No goal set';
    } else {
      amount.textContent = 'No goal';
      label.textContent = '--';
    }

    meta.appendChild(amount);
    meta.appendChild(label);
    dayElement.appendChild(meta);
  }

  return dayElement;
}

function renderAll() {
  enforceTodayInputs();
  renderGoalPanel();
  renderFoodList();
  renderProgress();
  renderCalendar();
}

window.addEventListener('load', async () => {
  if (!goalDateInput || !foodDateInput || !saveGoalButton) return;

  try {
    await loadCurrentUser();
    await initCalorieTracker();
  } catch (error) {
    console.error(error);
    goalMessage.textContent = error.message || 'Unable to load Calorie Tracker.';
  }
});
