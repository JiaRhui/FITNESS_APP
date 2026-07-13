const STORAGE_KEY = 'rpFitness_workouts';
const PLAN_KEY = 'rpFitness_workoutPlan';
let currentUserEmail = '';

function userStorageKey(baseKey) { return `${baseKey}:${currentUserEmail}`; }

async function loadCurrentUser() {
  const response = await fetch('/api/auth/session', { credentials: 'same-origin' });
  const data = await response.json();
  if (!response.ok || !data.loggedIn || !data.email || data.email === 'admin') {
    window.location.href = '/pages/login.html';
    throw new Error('Login required');
  }
  currentUserEmail = String(data.email).trim().toLowerCase();
}
const SPORT_OPTIONS = [
  { key: 'Gym', label: 'Gym', emoji: '🏋️' },
  { key: 'Running', label: 'Running', emoji: '🏃' },
  { key: 'Cycling', label: 'Cycling', emoji: '🚴' },
  { key: 'Swimming', label: 'Swimming', emoji: '🏊' },
  { key: 'Football', label: 'Football', emoji: '⚽' },
  { key: 'Basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'Tennis', label: 'Tennis', emoji: '🎾' },
  { key: 'Boxing', label: 'Boxing', emoji: '🥊' },
  { key: 'Yoga', label: 'Yoga', emoji: '🧘' },
  { key: 'Hiking', label: 'Hiking', emoji: '🏔️' },
  { key: 'Water Sports', label: 'Water Sports', emoji: '🏄' },
  { key: 'Other', label: 'Other', emoji: '🎿' }
];

let workouts = [];
let plans = [];
let currentDate = new Date();
let viewMode = 'month';
let editingPlanId = null;
let selectedSport = 'Running';

async function init() {
  await loadCurrentUser();
  await loadData();
  renderSportGrid();
  bindEvents();
  renderCalendar();
}

function bindEvents() {
  document.getElementById('prevMonthBtn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
  document.getElementById('nextMonthBtn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
  document.getElementById('todayBtn').addEventListener('click', () => { currentDate = new Date(); renderCalendar(); });
  document.getElementById('monthViewBtn').addEventListener('click', () => { viewMode = 'month'; renderCalendar(); });
  document.getElementById('weekViewBtn').addEventListener('click', () => { viewMode = 'week'; renderCalendar(); });
  document.getElementById('addPlanBtn').addEventListener('click', openPanel);
  document.getElementById('closePanelBtn').addEventListener('click', closePanel);
  document.getElementById('overlay').addEventListener('click', closePanel);
  document.getElementById('planForm').addEventListener('submit', handlePlanSubmit);
  document.getElementById('deletePlanBtn').addEventListener('click', deleteCurrentPlan);
}

async function loadData() {
  try {
    workouts = JSON.parse(localStorage.getItem(userStorageKey(STORAGE_KEY)) || '[]');
    plans = JSON.parse(localStorage.getItem(userStorageKey(PLAN_KEY)) || '[]');
  } catch (error) {
    workouts = [];
    plans = [];
  }

  try {
    const [workoutsResponse, plansResponse] = await Promise.all([
      fetch('/api/workouts').catch(() => null),
      fetch('/api/workouts/plans').catch(() => null)
    ]);

    if (workoutsResponse?.ok) {
      const workoutsData = await workoutsResponse.json();
      if (Array.isArray(workoutsData.workouts)) {
        workouts = workoutsData.workouts;
        localStorage.setItem(userStorageKey(STORAGE_KEY), JSON.stringify(workouts));
      }
    }

    if (plansResponse?.ok) {
      const plansData = await plansResponse.json();
      if (Array.isArray(plansData.plans)) {
        plans = plansData.plans;
        localStorage.setItem(userStorageKey(PLAN_KEY), JSON.stringify(plans));
      }
    }
  } catch (error) {
    console.error('Unable to sync workout planner data', error);
  }

  plans = plans.map((plan) => ({ ...plan, status: getPlanStatus(plan) }));
}

function renderSportGrid() {
  const container = document.getElementById('plannerSportGrid');
  container.innerHTML = SPORT_OPTIONS.map((sport) => `
    <button type="button" class="sport-card ${sport.key === selectedSport ? 'active' : ''}" data-sport="${sport.key}">
      <span class="emoji">${sport.emoji}</span>
      <span>${sport.label}</span>
    </button>
  `).join('');
  container.querySelectorAll('.sport-card').forEach((button) => {
    button.addEventListener('click', () => {
      selectedSport = button.dataset.sport;
      renderSportGrid();
    });
  });
}

function renderCalendar() {
  plans = plans.map((plan) => ({ ...plan, status: getPlanStatus(plan) }));
  const container = document.getElementById('calendarContainer');
  document.getElementById('calendarTitle').textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return day;
  });

  if (viewMode === 'week') {
    container.innerHTML = `
      <div class="week-grid">
        ${weekDays.map((day) => renderWeekColumn(day)).join('')}
      </div>
    `;
  } else {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const totalCells = Math.ceil((startDay + lastDay.getDate()) / 7) * 7;
    const cells = [];
    for (let index = 0; index < totalCells; index += 1) {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() - startDay + index);
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      cells.push(renderDayCell(date, isCurrentMonth));
    }
    container.innerHTML = `
      <div class="calendar-grid">
        ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => `<div class="muted">${day}</div>`).join('')}
        ${cells.join('')}
      </div>
    `;
  }

  updateSummary();
  bindDayClicks();
}

function renderWeekColumn(day) {
  const dayPlans = plans.filter((plan) => plan.date === dateToKey(day));
  const dayKey = dateToKey(day);
  const dayWorkouts = workouts.filter((workout) => workout.date?.slice(0, 10) === dayKey);
  return `
    <div class="week-card">
      <h4>${day.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</h4>
      <div class="muted">${day.toLocaleDateString('en-US', { month: 'short' })}</div>
      <div class="week-plan">
        ${dayPlans.length ? dayPlans.map((plan) => `<div class="week-plan-item"><strong>${plan.title}</strong><div class="muted">${plan.sport} • ${plan.plannedDuration} min</div></div>`).join('') : '<div class="muted">No plans</div>'}
      </div>
      <button class="btn-ghost" data-day="${dayKey}" type="button">+ Add</button>
    </div>
  `;
}

function renderDayCell(date, isCurrentMonth) {
  const dayKey = dateToKey(date);
  const dayPlans = plans.filter((plan) => plan.date === dayKey);
  const logged = workouts.some((workout) => workout.date?.slice(0, 10) === dayKey);
  const isToday = dayKey === dateToKey(new Date());
  const classes = ['calendar-day'];
  if (!isCurrentMonth) classes.push('muted');
  if (isToday) classes.push('today');
  return `
    <div class="${classes.join(' ')}" data-day="${dayKey}">
      <div class="day-number">${date.getDate()}</div>
      ${dayPlans.slice(0, 2).map((plan) => {
        const statusClass = plan.status === 'completed' ? 'completed' : plan.status === 'missed' ? 'missed' : 'planned';
        return `<button class="day-chip ${statusClass}" data-plan-id="${plan.id}" title="${plan.title}" type="button">${plan.emoji || '🏋️'} ${plan.sport}</button>`;
      }).join('')}
      ${dayPlans.length > 2 ? `<div class="muted">+${dayPlans.length - 2} more</div>` : ''}
    </div>
  `;
}

function bindDayClicks() {
  document.querySelectorAll('[data-day]').forEach((dayCell) => {
    dayCell.addEventListener('click', (event) => {
      if (event.target.closest('[data-plan-id]')) return;
      openPanel(dayCell.dataset.day);
    });
  });
  document.querySelectorAll('[data-plan-id]').forEach((planButton) => {
    planButton.addEventListener('click', (event) => {
      event.stopPropagation();
      const plan = plans.find((item) => item.id === planButton.dataset.planId);
      if (!plan) return;
      editingPlanId = plan.id;
      selectedSport = plan.sport;
      document.getElementById('planDate').value = plan.date;
      document.getElementById('planTitle').value = plan.title;
      document.getElementById('planTarget').value = plan.targetDetails || '';
      document.getElementById('planTime').value = plan.plannedTime || '';
      document.getElementById('planDuration').value = plan.plannedDuration || '';
      document.getElementById('planNotes').value = plan.notes || '';
      document.getElementById('planPriority').value = plan.priority || 'Medium';
      renderSportGrid();
      openPanel(plan.date);
    });
  });
}

function openPanel(date, planId) {
  const overlay = document.getElementById('overlay');
  const sidePanel = document.getElementById('sidePanel');
  document.getElementById('planDate').value = date || dateToKey(new Date());
  document.getElementById('planFormError').textContent = '';
  if (planId) {
    const plan = plans.find((item) => item.id === planId);
    if (plan) {
      editingPlanId = plan.id;
      selectedSport = plan.sport || selectedSport;
      document.getElementById('planTitle').value = plan.title || '';
      document.getElementById('planTarget').value = plan.targetDetails || '';
      document.getElementById('planTime').value = plan.plannedTime || '';
      document.getElementById('planDuration').value = plan.plannedDuration || '';
      document.getElementById('planNotes').value = plan.notes || '';
      document.getElementById('planPriority').value = plan.priority || 'Medium';
      renderSportGrid();
    }
  }
  overlay.classList.add('open');
  sidePanel.classList.add('open');
}

function closePanel() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('sidePanel').classList.remove('open');
  editingPlanId = null;
  document.getElementById('planForm').reset();
  document.getElementById('planDate').value = dateToKey(new Date());
  selectedSport = 'Running';
  renderSportGrid();
}

function handlePlanSubmit(event) {
  event.preventDefault();
  const plan = {
    id: editingPlanId || `plan-${Date.now()}`,
    date: document.getElementById('planDate').value,
    sport: selectedSport,
    title: document.getElementById('planTitle').value,
    targetDetails: document.getElementById('planTarget').value,
    plannedTime: document.getElementById('planTime').value,
    plannedDuration: document.getElementById('planDuration').value,
    notes: document.getElementById('planNotes').value,
    priority: document.getElementById('planPriority').value,
    status: 'planned'
  };
  if (!plan.title || !plan.plannedDuration || !plan.date) {
    document.getElementById('planFormError').textContent = 'Please fill the title, date, and duration.';
    return;
  }
  plans = plans.filter((item) => item.id !== plan.id);
  plans.unshift(plan);
  localStorage.setItem(userStorageKey(PLAN_KEY), JSON.stringify(plans));
  fetch('/api/workouts/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plans })
  }).catch(() => {});
  renderCalendar();
  closePanel();
}

function deleteCurrentPlan() {
  if (!editingPlanId) return;
  plans = plans.filter((plan) => plan.id !== editingPlanId);
  localStorage.setItem(userStorageKey(PLAN_KEY), JSON.stringify(plans));
  fetch('/api/workouts/plans', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plans })
  }).catch(() => {});
  renderCalendar();
  closePanel();
}

function updateSummary() {
  const monthPlans = plans.filter((plan) => plan.date?.slice(0, 7) === currentDate.toISOString().slice(0, 7));
  const completed = monthPlans.filter((plan) => getPlanStatus(plan) === 'completed').length;
  const missed = monthPlans.filter((plan) => getPlanStatus(plan) === 'missed').length;
  const completionRate = monthPlans.length ? Math.round((completed / monthPlans.length) * 100) : 0;
  const longestStreak = calculateLongestPlanStreak();
  const sportCounts = monthPlans.reduce((memo, plan) => { memo[plan.sport] = (memo[plan.sport] || 0) + 1; return memo; }, {});
  const mostPlannedSport = Object.entries(sportCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  document.getElementById('plannerSummary').textContent = `${monthPlans.length} plans in ${currentDate.toLocaleDateString('en-US', { month: 'long' })}`;
  document.getElementById('completionLabel').textContent = `${completed}/${monthPlans.length} days planned`;
  document.getElementById('completionBarText').textContent = `${monthPlans.length} workouts planned this month`;
  document.getElementById('weeklyProgressBadge').textContent = `${completionRate}%`;
  document.getElementById('statsRow').innerHTML = `
    <div class="stat-box"><div class="label">Planned</div><div class="value">${monthPlans.length}</div></div>
    <div class="stat-box"><div class="label">Completed</div><div class="value">${completed}</div></div>
    <div class="stat-box"><div class="label">Missed</div><div class="value">${missed}</div></div>
    <div class="stat-box"><div class="label">Longest streak</div><div class="value">${longestStreak} days</div></div>
    <div class="stat-box"><div class="label">Most planned sport</div><div class="value">${mostPlannedSport}</div></div>
  `;
}

function calculateLongestPlanStreak() {
  const dates = [...new Set(plans.map((plan) => plan.date).filter(Boolean))].sort();
  if (!dates.length) return 0;
  let longest = 1;
  let current = 1;
  for (let index = 1; index < dates.length; index += 1) {
    const prev = new Date(dates[index - 1]);
    const next = new Date(dates[index]);
    if ((next - prev) / (1000 * 60 * 60 * 24) === 1) current += 1; else current = 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function getPlanStatus(plan) {
  const planDate = new Date(plan.date);
  const today = new Date();
  const hasLogged = workouts.some((workout) => workout.date?.slice(0, 10) === plan.date && workout.sport === plan.sport);
  if (hasLogged) return 'completed';
  if (planDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) return 'missed';
  return 'planned';
}

function dateToKey(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

window.addEventListener('DOMContentLoaded', () => {
  init();
});
