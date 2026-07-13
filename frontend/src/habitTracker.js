const HABIT_STORAGE_KEY = 'daily-habit-checklist';
let currentUserEmail = '';

function userHabitStorageKey() { return `${HABIT_STORAGE_KEY}:${currentUserEmail}`; }

async function loadCurrentUser() {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  const data = await response.json();
  if (!response.ok || !data.loggedIn || !data.email || data.email === 'admin') {
    window.location.href = '/pages/login.html';
    throw new Error('Login required');
  }
  currentUserEmail = String(data.email).trim().toLowerCase();
}
const HABIT_DEFINITIONS = [
  { key: 'calorieGoal', label: 'Calorie Goal', icon: '🎯', description: 'Met your daily calorie goal' },
  { key: 'fitnessWorkout', label: 'Fitness Workout', icon: '💪', description: 'Completed a workout' }
];

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getDateLabel(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function createEmptyMonthState(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const days = {};
  const totalDays = getDaysInMonth(year, month - 1);

  for (let day = 1; day <= totalDays; day += 1) {
    const dayLabel = String(day).padStart(2, '0');
    const dateLabel = `${year}-${String(month).padStart(2, '0')}-${dayLabel}`;
    days[dayLabel] = {
      date: dateLabel,
      habits: {
        calorieGoal: false,
        fitnessWorkout: false
      }
    };
  }

  return { monthKey, days };
}

function loadHabitState() {
  try {
    const storedState = window.localStorage.getItem(userHabitStorageKey());
    if (!storedState) return createEmptyMonthState(getMonthKey());

    const parsedState = JSON.parse(storedState);
    const monthKey = getMonthKey();
    if (!parsedState || parsedState.monthKey !== monthKey) {
      return createEmptyMonthState(monthKey);
    }

    const [year, month] = monthKey.split('-').map(Number);
    const totalDays = getDaysInMonth(year, month - 1);
    const days = { ...(parsedState.days || {}) };

    for (let day = 1; day <= totalDays; day += 1) {
      const dayLabel = String(day).padStart(2, '0');
      if (!days[dayLabel]) {
        const dateLabel = `${year}-${String(month).padStart(2, '0')}-${dayLabel}`;
        days[dayLabel] = {
          date: dateLabel,
          habits: {
            calorieGoal: false,
            fitnessWorkout: false
          }
        };
      }
    }

    return { monthKey, days };
  } catch (error) {
    console.error('Unable to load habit state', error);
    return createEmptyMonthState(getMonthKey());
  }
}

function saveHabitState(state) {
  window.localStorage.setItem(userHabitStorageKey(), JSON.stringify(state));
}

function calculateHabitProgress(dayEntries, todayDateLabel = getDateLabel()) {
  const entries = Array.isArray(dayEntries) ? dayEntries : Object.values(dayEntries || {});
  const filteredEntries = entries.filter((entry) => entry && entry.date <= todayDateLabel);
  let completed = 0;
  let possible = 0;

  filteredEntries.forEach((entry) => {
    const habits = entry.habits || {};
    Object.keys(habits).forEach((habitKey) => {
      possible += 1;
      if (habits[habitKey]) completed += 1;
    });
  });

  const percentage = possible === 0 ? 0 : (completed / possible) * 100;
  return { completed, possible, percentage };
}

function getRankFromPercentage(percentage) {
  if (percentage <= 25) return 'Iron';
  if (percentage <= 50) return 'Bronze';
  if (percentage <= 75) return 'Silver';
  return 'Gold';
}

function getRankMeta(percentage) {
  const rank = getRankFromPercentage(percentage);
  const config = {
    Iron: { icon: '🔴', label: 'Iron' },
    Bronze: { icon: '🥉', label: 'Bronze' },
    Silver: { icon: '🥈', label: 'Silver' },
    Gold: { icon: '🥇', label: 'Gold' }
  };
  return config[rank];
}

function getCurrentDayEntry(state, dateLabel = getDateLabel()) {
  const dayKey = dateLabel.slice(-2);
  return state.days[dayKey] || { date: dateLabel, habits: { calorieGoal: false, fitnessWorkout: false } };
}

function getDayStatus(entry) {
  const completedCount = Object.values(entry.habits || {}).filter(Boolean).length;
  if (completedCount === HABIT_DEFINITIONS.length) return 'complete';
  if (completedCount > 0) return 'partial';
  return 'empty';
}

function renderHabitTracker() {
  const root = document.getElementById('habitTrackerRoot');
  if (!root) return;

  const state = loadHabitState();
  const todayDateLabel = getDateLabel();
  const todayEntry = getCurrentDayEntry(state, todayDateLabel);
  const progress = calculateHabitProgress(Object.values(state.days), todayDateLabel);
  const rankMeta = getRankMeta(progress.percentage);

  root.innerHTML = `
    <section class="tracker-header">
      <div>
        <p class="eyebrow">Daily habit checklist</p>
        <h2>Build your streak for the month</h2>
        <p>Track your calorie goal and workout each day. Every day starts fresh and contributes to your monthly progress.</p>
      </div>
      <div class="tracker-badge">
        <span>${rankMeta.icon}</span>
        <strong>${rankMeta.label}</strong>
      </div>
    </section>

    <section class="tracker-summary grid">
      <article class="card span-7">
        <div class="progress-row">
          <div>
            <p class="eyebrow">Current progress</p>
            <h3>${progress.percentage.toFixed(1)}%</h3>
          </div>
          <div class="progress-figure">
            <strong>${progress.completed}/${progress.possible}</strong>
            <span>completed checkboxes</span>
          </div>
        </div>
        <div class="progress-bar" aria-label="Monthly progress">
          <span style="width:${Math.min(progress.percentage, 100)}%"></span>
        </div>
      </article>
      <article class="card span-5">
        <p class="eyebrow">Today</p>
        <h3>${new Date(todayDateLabel).toLocaleDateString('en', { month: 'long', day: 'numeric' })}</h3>
        <div class="habit-list">
          ${HABIT_DEFINITIONS.map((habit) => `
            <label class="habit-item">
              <div>
                <strong>${habit.icon} ${habit.label}</strong>
                <small>${habit.description}</small>
              </div>
              <input type="checkbox" data-habit-key="${habit.key}" ${todayEntry.habits[habit.key] ? 'checked' : ''}>
            </label>
          `).join('')}
        </div>
      </article>
    </section>

    <section class="card tracker-calendar-card">
      <div class="calendar-header">
        <div>
          <p class="eyebrow">Month calendar</p>
          <h3>${new Date(todayDateLabel).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</h3>
        </div>
        <div class="calendar-legend">
          <span><i class="legend-dot complete"></i> Full</span>
          <span><i class="legend-dot partial"></i> Partial</span>
          <span><i class="legend-dot empty"></i> None</span>
        </div>
      </div>
      <div class="tracker-calendar">
        ${Object.values(state.days).map((entry) => {
          const status = getDayStatus(entry);
          const isToday = entry.date === todayDateLabel;
          return `
            <div class="day-cell ${status} ${isToday ? 'today' : ''}">
              <span>${new Date(entry.date).getDate()}</span>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;

  const checkboxes = root.querySelectorAll('input[data-habit-key]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', (event) => {
      const habitKey = event.target.getAttribute('data-habit-key');
      const nextState = loadHabitState();
      const currentDateLabel = getDateLabel();
      const entry = getCurrentDayEntry(nextState, currentDateLabel);
      entry.habits[habitKey] = event.target.checked;
      nextState.days[currentDateLabel.slice(-2)] = entry;
      saveHabitState(nextState);
      renderHabitTracker();
    });
  });
}

function initHabitTracker() {
  const root = document.getElementById('habitTrackerRoot');
  if (!root) return;
  renderHabitTracker();
}

if (typeof window !== 'undefined') {
  window.addEventListener('load', async () => {
    await loadCurrentUser();
    initHabitTracker();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateHabitProgress,
    getRankFromPercentage
  };
}
