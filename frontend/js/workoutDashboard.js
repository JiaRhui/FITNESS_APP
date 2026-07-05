const STORAGE_KEY = 'rpFitness_workouts';
const PLAN_KEY = 'rpFitness_workoutPlan';
let workouts = [];
let plans = [];
let activeRange = 'week';
let selectedSportForTrend = 'Running';
let charts = {};

const RANGE_LABELS = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'Last 3 Months',
  all: 'All Time'
};

function init() {
  loadData();
  bindEvents();
  renderKpis();
  renderRangeButtons();
  renderAchievements();
  renderTimeline();
  renderWeeklySummary();
  renderAllCharts();
}

function bindEvents() {
  document.getElementById('trendSportSelect').addEventListener('change', (event) => {
    selectedSportForTrend = event.target.value;
    renderTrendChart();
  });
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('detailsModal').addEventListener('click', (event) => {
    if (event.target.id === 'detailsModal') closeModal();
  });
}

function loadData() {
  try {
    workouts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    plans = JSON.parse(localStorage.getItem(PLAN_KEY) || '[]');
  } catch (error) {
    workouts = [];
    plans = [];
  }
  workouts = workouts.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderRangeButtons() {
  const container = document.getElementById('rangeButtons');
  container.innerHTML = Object.entries(RANGE_LABELS).map(([key, label]) => `
    <button class="chip ${activeRange === key ? 'active' : ''}" data-range="${key}" type="button">${label}</button>
  `).join('');
  container.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', () => {
      activeRange = button.dataset.range;
      renderRangeButtons();
      renderAllCharts();
    });
  });
}

function buildFilteredWorkouts() {
  const today = new Date();
  const cutoff = new Date(today);
  if (activeRange === 'week') cutoff.setDate(today.getDate() - 7);
  if (activeRange === 'month') cutoff.setMonth(today.getMonth() - 1);
  if (activeRange === 'quarter') cutoff.setMonth(today.getMonth() - 3);
  return workouts.filter((workout) => new Date(workout.date) >= cutoff);
}

function renderKpis() {
  const filtered = buildFilteredWorkouts();
  const totalWorkouts = filtered.length;
  const totalDuration = filtered.reduce((sum, workout) => sum + Number(workout.duration || 0), 0);
  const totalCalories = filtered.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);
  const streak = calculateStreak();
  const prev = workouts.filter((workout) => {
    const date = new Date(workout.date);
    const start = new Date();
    start.setDate(start.getDate() - 14);
    return date >= start && date < new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
  });
  const prevWorkouts = prev.length;
  const prevDuration = prev.reduce((sum, workout) => sum + Number(workout.duration || 0), 0);
  const prevCalories = prev.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);

  const kpiRow = document.getElementById('kpiRow');
  kpiRow.innerHTML = `
    <div class="kpi"><div class="label">Total Workouts</div><div class="value">${totalWorkouts}</div><div class="delta">${formatDelta(totalWorkouts, prevWorkouts)} vs last week</div></div>
    <div class="kpi"><div class="label">Total Duration</div><div class="value">${formatDuration(totalDuration)}</div><div class="delta">${formatDelta(totalDuration, prevDuration)} vs last week</div></div>
    <div class="kpi"><div class="label">Calories Burned</div><div class="value">${totalCalories.toLocaleString()} kcal</div><div class="delta">${formatDelta(totalCalories, prevCalories)} vs last week</div></div>
    <div class="kpi"><div class="label">Current Streak</div><div class="value">${streak} day${streak === 1 ? '' : 's'}</div><div class="delta">🔥 Consistent momentum</div></div>
  `;
}

function calculateStreak() {
  if (!workouts.length) return 0;
  const uniqueDays = [...new Set(workouts.map((item) => item.date.slice(0, 10)))].sort();
  let streak = 0;
  const today = new Date();
  let cursor = new Date(today);
  while (true) {
    const key = cursor.toISOString().slice(0, 10);
    if (uniqueDays.includes(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function formatDelta(current, previous) {
  if (!previous) return current ? '↗ New data' : '↔ No change';
  const delta = current - previous;
  const symbol = delta >= 0 ? '↗' : '↘';
  return `${symbol} ${Math.abs(delta)} ${delta >= 0 ? 'up' : 'down'}`;
}

function formatDuration(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

function renderAllCharts() {
  const filtered = buildFilteredWorkouts();
  renderFrequencyChart(filtered);
  renderCaloriesChart(filtered);
  renderSportChart(filtered);
  renderTrendChart(filtered);
}

function renderFrequencyChart(workoutsToShow) {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = labels.map((day) => workoutsToShow.filter((workout) => new Date(workout.date).toLocaleDateString('en-US', { weekday: 'short' }) === day).length);
  const ctx = document.getElementById('frequencyChart');
  if (charts.frequency) charts.frequency.destroy();
  charts.frequency = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Workouts',
        data,
        backgroundColor: labels.map((_, index) => index < 5 ? '#19c37d' : '#3ddc8b')
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#9ca89f' }, grid: { color: 'rgba(255,255,255,0.08)' } }, x: { ticks: { color: '#9ca89f' }, grid: { display: false } } } }
  });
}

function renderCaloriesChart(workoutsToShow) {
  const labels = workoutsToShow.slice(0, 8).reverse().map((workout) => new Date(workout.date).toLocaleDateString());
  const data = workoutsToShow.slice(0, 8).reverse().map((workout) => Number(workout.calories || 0));
  const ctx = document.getElementById('caloriesChart');
  if (charts.calories) charts.calories.destroy();
  charts.calories = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data,
        fill: true,
        borderColor: '#19c37d',
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return '#19c37d';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(25,195,125,0.38)');
          gradient.addColorStop(1, 'rgba(25,195,125,0)');
          return gradient;
        },
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#ffffff'
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#9ca89f' }, grid: { color: 'rgba(255,255,255,0.08)' } }, x: { ticks: { color: '#9ca89f' }, grid: { display: false } } } }
  });
}

function renderSportChart(workoutsToShow) {
  const counts = workoutsToShow.reduce((memo, workout) => {
    memo[workout.sport] = (memo[workout.sport] || 0) + 1;
    return memo;
  }, {});
  const labels = Object.keys(counts);
  const data = Object.values(counts);
  const colors = ['#19c37d', '#3ddc8b', '#7ce8aa', '#2d8560', '#64d4a3', '#b0f2c7'];
  const ctx = document.getElementById('sportChart');
  if (charts.sport) charts.sport.destroy();
  charts.sport = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors.slice(0, labels.length) }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#e7f4ea' } } } }
  });
}

function renderTrendChart() {
  const filtered = buildFilteredWorkouts().filter((workout) => workout.sport === selectedSportForTrend);
  const labels = filtered.slice(0, 8).reverse().map((workout) => new Date(workout.date).toLocaleDateString());
  const data = filtered.slice(0, 8).reverse().map((workout) => {
    if (selectedSportForTrend === 'Running') return Number(workout.details?.distance || 0);
    if (selectedSportForTrend === 'Cycling') return Number(workout.details?.distance || 0);
    if (selectedSportForTrend === 'Gym') return Number(workout.details?.weightUsed || 0) || Number(workout.calories || 0);
    if (selectedSportForTrend === 'Swimming') return Number(workout.details?.laps || 0);
    return Number(workout.calories || 0);
  });
  const ctx = document.getElementById('trendChart');
  if (charts.trend) charts.trend.destroy();
  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{ data, borderColor: '#7ce8aa', tension: 0.35, fill: false, pointBackgroundColor: '#ffffff' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { color: '#9ca89f' }, grid: { color: 'rgba(255,255,255,0.08)' } }, x: { ticks: { color: '#9ca89f' }, grid: { display: false } } } }
  });
}

function renderAchievements() {
  const container = document.getElementById('achievementGrid');
  const achievements = [
    { icon: '🏃', title: 'Longest Run', value: getBestValue('Running', 'distance'), detail: 'Distance' },
    { icon: '⏱️', title: 'Fastest Pace', value: getBestValue('Running', 'pace'), detail: 'Min/km' },
    { icon: '🏋️', title: 'Heaviest Lift', value: getBestValue('Gym', 'weightUsed'), detail: 'kg' },
    { icon: '🔥', title: 'Most Calories', value: getBestValue('all', 'calories'), detail: 'kcal' },
    { icon: '⏳', title: 'Longest Session', value: getBestValue('all', 'duration'), detail: 'min' },
    { icon: '🚴', title: 'Longest Ride', value: getBestValue('Cycling', 'distance'), detail: 'km' },
    { icon: '🏊', title: 'Most Laps', value: getBestValue('Swimming', 'laps'), detail: 'laps' },
    { icon: '💪', title: 'Best RPE', value: getBestValue('all', 'rpe'), detail: 'effort' }
  ];
  container.innerHTML = achievements.map((achievement) => `
    <div class="achievement-card">
      <div class="badge success">${achievement.icon} ${achievement.title}</div>
      <strong>${achievement.value || 'No data yet'}</strong>
      <p class="muted">${achievement.detail}</p>
    </div>
  `).join('');
}

function getBestValue(sport, field) {
  const relevant = sport === 'all' ? workouts : workouts.filter((workout) => workout.sport === sport);
  if (!relevant.length) return null;
  let best = null;
  for (const workout of relevant) {
    const value = field === 'distance' ? Number(workout.details?.distance || 0) : field === 'pace' ? Number(workout.details?.pace || 0) : field === 'weightUsed' ? Number(workout.details?.weightUsed || 0) : field === 'calories' ? Number(workout.calories || 0) : field === 'duration' ? Number(workout.duration || 0) : field === 'laps' ? Number(workout.details?.laps || 0) : Number(workout.rpe || 0);
    if (value > (best?.value || -Infinity)) best = { value, workout };
  }
  return best ? `${best.value}${field === 'pace' ? ' min/km' : field === 'calories' ? ' kcal' : field === 'duration' ? ' min' : field === 'rpe' ? '/10' : ''}` : null;
}

function renderTimeline() {
  const container = document.getElementById('timeline');
  const recent = workouts.slice(0, 5);
  if (!recent.length) {
    container.innerHTML = '<div class="empty-state">No workouts logged yet. Start your first session!</div>';
    return;
  }
  container.innerHTML = recent.map((workout) => `
    <button class="timeline-item" data-id="${workout.id}" type="button">
      <div class="left">
        <span class="dot"></span>
        <div>
          <strong>${workout.title || workout.sport}</strong>
          <div class="muted">${new Date(workout.date).toLocaleDateString()} • ${workout.sport}</div>
        </div>
      </div>
      <div class="muted">${workout.duration || 0} min</div>
    </button>
  `).join('');
  container.querySelectorAll('[data-id]').forEach((button) => {
    button.addEventListener('click', () => openModal(button.dataset.id));
  });
}

function openModal(id) {
  const workout = workouts.find((item) => item.id === id);
  if (!workout) return;
  document.getElementById('modalContent').innerHTML = `
    <div class="metric-grid">
      <div class="metric-card"><span>Sport</span><strong>${workout.sport}</strong></div>
      <div class="metric-card"><span>Title</span><strong>${workout.title || 'Untitled workout'}</strong></div>
      <div class="metric-card"><span>Duration</span><strong>${workout.duration || 0} min</strong></div>
      <div class="metric-card"><span>Calories</span><strong>${workout.calories || 0} kcal</strong></div>
    </div>
    <p>${workout.notes || 'No notes yet.'}</p>
  `;
  document.getElementById('detailsModal').classList.add('open');
}

function closeModal() {
  document.getElementById('detailsModal').classList.remove('open');
}

function renderWeeklySummary() {
  const container = document.getElementById('weeklySummary');
  const weekWorkouts = workouts.filter((workout) => new Date(workout.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const totalWorkouts = weekWorkouts.length;
  const totalTime = weekWorkouts.reduce((sum, workout) => sum + Number(workout.duration || 0), 0);
  const totalCalories = weekWorkouts.reduce((sum, workout) => sum + Number(workout.calories || 0), 0);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const mostActiveDay = weekWorkouts.length ? dayNames[new Date(weekWorkouts[0].date).getDay() || 0] : '—';
  const mostCommonSport = weekWorkouts.length ? weekWorkouts.reduce((memo, workout) => {
    memo[workout.sport] = (memo[workout.sport] || 0) + 1;
    return memo;
  }, {}) : {};
  const topSport = Object.entries(mostCommonSport).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  const quote = ['Small steps build strong streaks.', 'Progress compounds every session.', 'Today is a great day to move.'][new Date().getDay() % 3];
  container.innerHTML = `
    <div class="stat-box"><div class="label">Total workouts</div><div class="value">${totalWorkouts}</div></div>
    <div class="stat-box"><div class="label">Total time</div><div class="value">${formatDuration(totalTime)}</div></div>
    <div class="stat-box"><div class="label">Total calories</div><div class="value">${totalCalories.toLocaleString()}</div></div>
    <div class="stat-box"><div class="label">Most active day</div><div class="value">${mostActiveDay}</div><div class="muted">${topSport}</div></div>
    <div class="stat-box"><div class="label">Daily motivation</div><div class="value">${quote}</div></div>
  `;
}

window.addEventListener('DOMContentLoaded', init);
