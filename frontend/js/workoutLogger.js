const SPORTS = [
  { key: 'Gym', label: 'Gym / Weightlifting', emoji: '🏋️' },
  { key: 'Running', label: 'Running', emoji: '🏃' },
  { key: 'Cycling', label: 'Cycling', emoji: '🚴' },
  { key: 'Swimming', label: 'Swimming', emoji: '🏊' },
  { key: 'Football', label: 'Football / Soccer', emoji: '⚽' },
  { key: 'Basketball', label: 'Basketball', emoji: '🏀' },
  { key: 'Tennis', label: 'Tennis / Badminton', emoji: '🎾' },
  { key: 'Boxing', label: 'Boxing / Martial Arts', emoji: '🥊' },
  { key: 'Yoga', label: 'Yoga / Stretching', emoji: '🧘' },
  { key: 'Hiking', label: 'Hiking / Trekking', emoji: '🏔️' },
  { key: 'Water Sports', label: 'Water Sports', emoji: '🏄' },
  { key: 'Other', label: 'Other', emoji: '🎿' }
];

const STORAGE_KEY = 'rpFitness_workouts';
const MAX_HISTORY = 10;
let workouts = [];
let selectedSport = 'Gym';
let editingId = null;

function init() {
  renderSportGrid();
  setDefaultDateTime();
  bindEvents();
  loadWorkouts();
}

function bindEvents() {
  document.getElementById('workoutForm').addEventListener('submit', handleSubmit);
  document.getElementById('cancelWorkoutBtn').addEventListener('click', resetForm);
  document.getElementById('historySportFilter').addEventListener('change', renderHistory);
  document.getElementById('historySort').addEventListener('change', renderHistory);
  document.getElementById('workoutRpe').addEventListener('input', updateRpeLabel);
  document.getElementById('workoutCalories').addEventListener('input', estimateCaloriesFromDuration);
  document.getElementById('loadMoreBtn').addEventListener('click', () => {
    MAX_HISTORY += 10;
    renderHistory();
  });
}

function renderSportGrid() {
  const container = document.getElementById('sportGrid');
  container.innerHTML = SPORTS.map((sport) => `
    <button type="button" class="sport-card ${sport.key === selectedSport ? 'active' : ''}" data-sport="${sport.key}">
      <span class="emoji">${sport.emoji}</span>
      <span>${sport.label}</span>
    </button>
  `).join('');
  container.querySelectorAll('.sport-card').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedSport = btn.dataset.sport;
      renderSportGrid();
      renderSportSpecificFields();
    });
  });
}

function setDefaultDateTime() {
  const input = document.getElementById('workoutDate');
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16);
  input.value = local;
}

function updateRpeLabel() {
  const slider = document.getElementById('workoutRpe');
  const hint = document.getElementById('rpeHint');
  const value = Number(slider.value);
  const labels = [
    ['😴 Easy', 'Easy'],
    ['😤 Moderate', 'Moderate'],
    ['💪 Hard', 'Hard'],
    ['🔥 Max Effort', 'Max Effort']
  ];
  const label = value <= 3 ? labels[0] : value <= 6 ? labels[1] : value <= 8 ? labels[2] : labels[3];
  hint.textContent = `${label[0]} (${label[1]})`;
}

function renderSportSpecificFields() {
  const container = document.getElementById('sportSpecificFields');
  if (!container) return;
  const baseFields = {
    Gym: `
      <div class="form-grid">
        <div class="form-group full"><label>Muscle groups targeted</label><div class="chip-group" id="muscleChips"></div></div>
        <div class="form-group full"><label for="exerciseDescription">Exercise description</label><textarea id="exerciseDescription" placeholder="Squats, deadlifts, pull-ups"></textarea></div>
        <div class="form-group"><label for="exerciseCount">Number of exercises</label><input id="exerciseCount" type="number" min="1" /></div>
        <div class="form-group"><label for="setsPerExercise">Sets per exercise</label><input id="setsPerExercise" type="number" min="1" /></div>
        <div class="form-group"><label for="repsPerSet">Reps per set</label><input id="repsPerSet" type="number" min="1" /></div>
        <div class="form-group"><label for="weightUsed">Weight used (kg)</label><input id="weightUsed" type="number" min="1" /></div>
        <div class="form-group"><label for="restTime">Rest time between sets (sec)</label><input id="restTime" type="number" min="1" /></div>
        <div class="form-group"><label for="personalBest">Personal best</label><input id="personalBest" type="checkbox" /></div>
      </div>
    `,
    Running: `
      <div class="form-grid">
        <div class="form-group"><label for="runDistance">Distance (km)</label><input id="runDistance" type="number" min="0.1" step="0.1" /></div>
        <div class="form-group"><label for="runDuration">Duration (minutes)</label><input id="runDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="runPace">Pace (min/km)</label><input id="runPace" type="number" min="0.1" step="0.1" /></div>
        <div class="form-group"><label for="runHrAvg">Avg heart rate (bpm)</label><input id="runHrAvg" type="number" min="1" /></div>
        <div class="form-group"><label for="runHrMax">Max heart rate (bpm)</label><input id="runHrMax" type="number" min="1" /></div>
        <div class="form-group"><label for="runElevation">Elevation gain (m)</label><input id="runElevation" type="number" min="0" /></div>
        <div class="form-group"><label for="runType">Run type</label><select id="runType"><option>Easy Run</option><option>Tempo</option><option>Interval</option><option>Long Run</option><option>Race</option></select></div>
        <div class="form-group"><label for="runRoute">Route / description</label><input id="runRoute" type="text" /></div>
        <div class="form-group full"><label for="runShoes">Shoes used</label><input id="runShoes" type="text" placeholder="Optional" /></div>
      </div>
    `,
    Cycling: `
      <div class="form-grid">
        <div class="form-group"><label for="rideDistance">Distance (km)</label><input id="rideDistance" type="number" min="1" step="0.1" /></div>
        <div class="form-group"><label for="rideDuration">Duration (minutes)</label><input id="rideDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="rideSpeed">Average speed (km/h)</label><input id="rideSpeed" type="number" min="1" step="0.1" /></div>
        <div class="form-group"><label for="rideMaxSpeed">Max speed (km/h)</label><input id="rideMaxSpeed" type="number" min="1" step="0.1" /></div>
        <div class="form-group"><label for="rideElevation">Elevation gain (m)</label><input id="rideElevation" type="number" min="0" /></div>
        <div class="form-group"><label for="rideHrAvg">Avg heart rate (bpm)</label><input id="rideHrAvg" type="number" min="1" /></div>
        <div class="form-group"><label for="rideType">Ride type</label><select id="rideType"><option>Leisure</option><option>Training</option><option>Race</option><option>Commute</option></select></div>
        <div class="form-group full"><label for="rideBike">Bike used</label><input id="rideBike" type="text" placeholder="Optional" /></div>
      </div>
    `,
    Swimming: `
      <div class="form-grid">
        <div class="form-group"><label for="swimLaps">Number of laps</label><input id="swimLaps" type="number" min="1" /></div>
        <div class="form-group"><label for="swimPoolLength">Pool length</label><select id="swimPoolLength"><option>25m</option><option>50m</option><option>Open Water</option></select></div>
        <div class="form-group"><label for="swimDistance">Total distance</label><input id="swimDistance" type="number" min="0.1" step="0.1" /></div>
        <div class="form-group"><label for="swimStroke">Stroke type</label><select id="swimStroke"><option>Freestyle</option><option>Breaststroke</option><option>Backstroke</option><option>Butterfly</option><option>Mixed</option></select></div>
        <div class="form-group"><label for="swimPace">Pace / 100m</label><input id="swimPace" type="number" min="0.1" step="0.1" /></div>
        <div class="form-group"><label for="swimHrAvg">Avg heart rate (bpm)</label><input id="swimHrAvg" type="number" min="1" /></div>
      </div>
    `,
    Football: `
      <div class="form-grid">
        <div class="form-group"><label for="footballMode">Match / Training</label><select id="footballMode"><option>Match</option><option>Training</option><option>Friendly</option></select></div>
        <div class="form-group"><label for="footballDuration">Duration (minutes)</label><input id="footballDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="footballPosition">Position played</label><select id="footballPosition"><option>GK</option><option>Defender</option><option>Midfielder</option><option>Forward</option><option>Winger</option></select></div>
        <div class="form-group"><label for="footballDistance">Distance covered (km)</label><input id="footballDistance" type="number" min="1" step="0.1" /></div>
        <div class="form-group"><label for="footballGoals">Goals scored</label><input id="footballGoals" type="number" min="0" /></div>
        <div class="form-group"><label for="footballAssists">Assists</label><input id="footballAssists" type="number" min="0" /></div>
        <div class="form-group full"><label for="footballIntensity">Intensity</label><select id="footballIntensity"><option>Easy</option><option>Medium</option><option>High</option></select></div>
      </div>
    `,
    Basketball: `
      <div class="form-grid">
        <div class="form-group"><label for="basketballMode">Match / Training</label><select id="basketballMode"><option>Match</option><option>Training</option><option>Scrimmage</option></select></div>
        <div class="form-group"><label for="basketballDuration">Duration (minutes)</label><input id="basketballDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="basketballPoints">Points scored</label><input id="basketballPoints" type="number" min="0" /></div>
        <div class="form-group"><label for="basketballRebounds">Rebounds</label><input id="basketballRebounds" type="number" min="0" /></div>
        <div class="form-group"><label for="basketballAssists">Assists</label><input id="basketballAssists" type="number" min="0" /></div>
        <div class="form-group"><label for="basketballQuarters">Quarters played</label><input id="basketballQuarters" type="number" min="1" /></div>
      </div>
    `,
    Tennis: `
      <div class="form-grid">
        <div class="form-group"><label for="tennisSport">Sport</label><select id="tennisSport"><option>Tennis</option><option>Badminton</option><option>Squash</option><option>Table Tennis</option></select></div>
        <div class="form-group"><label for="tennisMode">Match / Training</label><select id="tennisMode"><option>Match</option><option>Training</option><option>Rally</option></select></div>
        <div class="form-group"><label for="tennisDuration">Duration (minutes)</label><input id="tennisDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="tennisSetsWon">Sets won</label><input id="tennisSetsWon" type="number" min="0" /></div>
        <div class="form-group"><label for="tennisSetsLost">Sets lost</label><input id="tennisSetsLost" type="number" min="0" /></div>
        <div class="form-group"><label for="tennisSurface">Surface</label><select id="tennisSurface"><option>Hard</option><option>Clay</option><option>Grass</option><option>Indoor</option></select></div>
      </div>
    `,
    Boxing: `
      <div class="form-grid">
        <div class="form-group"><label for="boxingDiscipline">Discipline</label><select id="boxingDiscipline"><option>Boxing</option><option>Muay Thai</option><option>BJJ</option><option>MMA</option><option>Kickboxing</option><option>Karate</option><option>Judo</option><option>Wrestling</option></select></div>
        <div class="form-group"><label for="boxingSessionType">Session type</label><select id="boxingSessionType"><option>Sparring</option><option>Bag Work</option><option>Drills</option><option>Conditioning</option><option>Competition</option></select></div>
        <div class="form-group"><label for="boxingRounds">Rounds</label><input id="boxingRounds" type="number" min="1" /></div>
        <div class="form-group"><label for="boxingRoundDuration">Round duration (min)</label><input id="boxingRoundDuration" type="number" min="1" /></div>
        <div class="form-group full"><label for="boxingIntensity">Intensity</label><select id="boxingIntensity"><option>Easy</option><option>Medium</option><option>High</option><option>Max</option></select></div>
      </div>
    `,
    Yoga: `
      <div class="form-grid">
        <div class="form-group"><label for="yogaStyle">Style</label><select id="yogaStyle"><option>Hatha</option><option>Vinyasa</option><option>Yin</option><option>Power</option><option>Restorative</option><option>Pilates</option><option>General Stretching</option></select></div>
        <div class="form-group"><label for="yogaDuration">Duration (minutes)</label><input id="yogaDuration" type="number" min="1" /></div>
        <div class="form-group full"><label>Focus area</label><div class="chip-group" id="focusChips"></div></div>
        <div class="form-group full"><label for="yogaNotes">Session notes / poses</label><textarea id="yogaNotes" placeholder="Sun salutations, mobility flow"></textarea></div>
        <div class="form-group full"><label for="yogaInstructor">Instructor / class name</label><input id="yogaInstructor" type="text" placeholder="Optional" /></div>
      </div>
    `,
    Hiking: `
      <div class="form-grid">
        <div class="form-group"><label for="hikeName">Trail name</label><input id="hikeName" type="text" /></div>
        <div class="form-group"><label for="hikeDistance">Distance (km)</label><input id="hikeDistance" type="number" min="1" step="0.1" /></div>
        <div class="form-group"><label for="hikeDuration">Duration (minutes)</label><input id="hikeDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="hikeElevation">Elevation gain (m)</label><input id="hikeElevation" type="number" min="0" /></div>
        <div class="form-group"><label for="hikeDifficulty">Difficulty</label><select id="hikeDifficulty"><option>Easy</option><option>Moderate</option><option>Hard</option><option>Expert</option></select></div>
        <div class="form-group"><label for="hikeTerrain">Terrain</label><select id="hikeTerrain"><option>Forest</option><option>Mountain</option><option>Coastal</option><option>Desert</option><option>Urban</option></select></div>
        <div class="form-group full"><label for="hikeWeather">Weather conditions</label><input id="hikeWeather" type="text" placeholder="Optional" /></div>
      </div>
    `,
    'Water Sports': `
      <div class="form-grid">
        <div class="form-group"><label for="waterSportType">Sport type</label><select id="waterSportType"><option>Surfing</option><option>Kayaking</option><option>Paddleboarding</option><option>Rowing</option><option>Sailing</option><option>Snorkeling</option><option>Diving</option></select></div>
        <div class="form-group"><label for="waterDuration">Duration (minutes)</label><input id="waterDuration" type="number" min="1" /></div>
        <div class="form-group"><label for="waterDistance">Distance (km)</label><input id="waterDistance" type="number" min="0" step="0.1" /></div>
        <div class="form-group"><label for="waterConditions">Conditions</label><select id="waterConditions"><option>Calm</option><option>Moderate</option><option>Rough</option></select></div>
        <div class="form-group full"><label for="waterNotes">Notes</label><textarea id="waterNotes"></textarea></div>
      </div>
    `,
    Other: `
      <div class="form-grid">
        <div class="form-group"><label for="otherActivity">Sport / activity name</label><input id="otherActivity" type="text" /></div>
        <div class="form-group"><label for="otherDuration">Duration (minutes)</label><input id="otherDuration" type="number" min="1" /></div>
        <div class="form-group full"><label for="otherIntensity">Intensity</label><select id="otherIntensity"><option>Easy</option><option>Medium</option><option>High</option></select></div>
        <div class="form-group full"><label for="otherDescription">Free description</label><textarea id="otherDescription"></textarea></div>
      </div>
    `
  };

  container.innerHTML = baseFields[selectedSport] || baseFields.Gym;

  if (selectedSport === 'Gym') {
    renderChipSelector('muscleChips', ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Full Body']);
  }
  if (selectedSport === 'Yoga') {
    renderChipSelector('focusChips', ['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Back', 'Hips']);
  }

  attachAutoCalculations();
}

function renderChipSelector(containerId, options) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = options.map((option) => `<button type="button" class="chip" data-chip="${option}">${option}</button>`).join('');
  container.querySelectorAll('[data-chip]').forEach((chip) => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });
}

function attachAutoCalculations() {
  const runDistance = document.getElementById('runDistance');
  const runDuration = document.getElementById('runDuration');
  const runPace = document.getElementById('runPace');
  const rideDistance = document.getElementById('rideDistance');
  const rideDuration = document.getElementById('rideDuration');
  const rideSpeed = document.getElementById('rideSpeed');
  const swimLaps = document.getElementById('swimLaps');
  const swimPoolLength = document.getElementById('swimPoolLength');
  const swimDistance = document.getElementById('swimDistance');
  const swimPace = document.getElementById('swimPace');

  const compute = () => {
    if (runDistance && runDuration && runDistance.value && runDuration.value) {
      const pace = (Number(runDuration.value) / Number(runDistance.value)).toFixed(2);
      if (runPace && !runPace.value) runPace.value = pace;
    }
    if (rideDistance && rideDuration && rideDistance.value && rideDuration.value) {
      const speed = (Number(rideDistance.value) / (Number(rideDuration.value) / 60)).toFixed(2);
      if (rideSpeed && !rideSpeed.value) rideSpeed.value = speed;
    }
    if (swimLaps && swimPoolLength && swimDistance && swimLaps.value) {
      const pool = swimPoolLength.value === 'Open Water' ? 0 : Number(swimPoolLength.value.replace('m', ''));
      if (pool) {
        const total = Number(swimLaps.value) * pool / 1000;
        if (!swimDistance.value) swimDistance.value = total.toFixed(2);
      }
    }
    if (swimDistance && swimDuration && swimDistance.value && swimDuration.value) {
      const pace = (Number(swimDuration.value) / Number(swimDistance.value)).toFixed(2);
      if (swimPace && !swimPace.value) swimPace.value = pace;
    }
  };

  [runDistance, runDuration, rideDistance, rideDuration, swimLaps, swimPoolLength].forEach((element) => {
    if (element) element.addEventListener('input', compute);
  });
}

function getDurationValue() {
  const durationFields = {
    Gym: document.getElementById('exerciseCount')?.value || '',
    Running: document.getElementById('runDuration')?.value || '',
    Cycling: document.getElementById('rideDuration')?.value || '',
    Swimming: document.getElementById('swimLaps')?.value || '',
    Football: document.getElementById('footballDuration')?.value || '',
    Basketball: document.getElementById('basketballDuration')?.value || '',
    Tennis: document.getElementById('tennisDuration')?.value || '',
    Boxing: document.getElementById('boxingRoundDuration')?.value || '',
    Yoga: document.getElementById('yogaDuration')?.value || '',
    Hiking: document.getElementById('hikeDuration')?.value || '',
    'Water Sports': document.getElementById('waterDuration')?.value || '',
    Other: document.getElementById('otherDuration')?.value || ''
  };
  return durationFields[selectedSport] || '';
}

function estimateCaloriesFromDuration() {
  const caloriesField = document.getElementById('workoutCalories');
  if (!caloriesField || caloriesField.value) return;
  const duration = Number(getDurationValue() || 0);
  const base = { Gym: 450, Running: 600, Cycling: 500, Swimming: 550, Football: 480, Basketball: 520, Tennis: 450, Boxing: 620, Yoga: 250, Hiking: 400, 'Water Sports': 450, Other: 300 }[selectedSport] || 300;
  const estimate = Math.max(120, base * Math.max(1, Math.round(duration / 30)));
  caloriesField.value = estimate;
}

function validateWorkout(data) {
  const errors = [];
  if (!data.title.trim()) data.title = `${data.sport} Session`;
  if (!data.date) errors.push('Select a date and time.');
  if (!data.calories || Number(data.calories) <= 0) errors.push('Calories must be positive.');
  if (!data.duration || Number(data.duration) <= 0) errors.push('Duration must be positive.');
  if (selectedSport === 'Running' && (!data.details?.distance || Number(data.details.distance) <= 0)) errors.push('Distance is required for running.');
  if (selectedSport === 'Cycling' && (!data.details?.distance || Number(data.details.distance) <= 0)) errors.push('Distance is required for cycling.');
  if (selectedSport === 'Swimming' && (!data.details?.laps || Number(data.details.laps) <= 0)) errors.push('Laps are required for swimming.');
  return errors;
}

function collectWorkoutData() {
  const formData = new FormData(document.getElementById('workoutForm'));
  const data = {
    title: formData.get('workoutTitle')?.toString().trim() || '',
    sport: selectedSport,
    date: document.getElementById('workoutDate').value,
    rpe: document.getElementById('workoutRpe').value,
    calories: document.getElementById('workoutCalories').value,
    notes: document.getElementById('workoutNotes').value,
    duration: getDurationValue() || '0',
    createdAt: new Date().toISOString(),
    personalBest: document.getElementById('personalBest')?.checked || false,
    details: {}
  };

  if (selectedSport === 'Gym') {
    data.details = {
      muscleGroups: [...document.querySelectorAll('#muscleChips .active')].map((chip) => chip.dataset.chip),
      exerciseDescription: document.getElementById('exerciseDescription').value,
      exerciseCount: document.getElementById('exerciseCount').value,
      setsPerExercise: document.getElementById('setsPerExercise').value,
      repsPerSet: document.getElementById('repsPerSet').value,
      weightUsed: document.getElementById('weightUsed').value,
      restTime: document.getElementById('restTime').value,
      personalBest: document.getElementById('personalBest').checked
    };
  } else if (selectedSport === 'Running') {
    data.details = {
      distance: document.getElementById('runDistance').value,
      pace: document.getElementById('runPace').value,
      averageHeartRate: document.getElementById('runHrAvg').value,
      maxHeartRate: document.getElementById('runHrMax').value,
      elevationGain: document.getElementById('runElevation').value,
      runType: document.getElementById('runType').value,
      route: document.getElementById('runRoute').value,
      shoes: document.getElementById('runShoes').value
    };
  } else if (selectedSport === 'Cycling') {
    data.details = {
      distance: document.getElementById('rideDistance').value,
      speed: document.getElementById('rideSpeed').value,
      maxSpeed: document.getElementById('rideMaxSpeed').value,
      elevationGain: document.getElementById('rideElevation').value,
      averageHeartRate: document.getElementById('rideHrAvg').value,
      rideType: document.getElementById('rideType').value,
      bike: document.getElementById('rideBike').value
    };
  } else if (selectedSport === 'Swimming') {
    data.details = {
      laps: document.getElementById('swimLaps').value,
      poolLength: document.getElementById('swimPoolLength').value,
      totalDistance: document.getElementById('swimDistance').value,
      stroke: document.getElementById('swimStroke').value,
      pace: document.getElementById('swimPace').value,
      averageHeartRate: document.getElementById('swimHrAvg').value
    };
  } else if (selectedSport === 'Football') {
    data.details = {
      mode: document.getElementById('footballMode').value,
      duration: document.getElementById('footballDuration').value,
      position: document.getElementById('footballPosition').value,
      distance: document.getElementById('footballDistance').value,
      goals: document.getElementById('footballGoals').value,
      assists: document.getElementById('footballAssists').value,
      intensity: document.getElementById('footballIntensity').value
    };
  } else if (selectedSport === 'Basketball') {
    data.details = {
      mode: document.getElementById('basketballMode').value,
      duration: document.getElementById('basketballDuration').value,
      points: document.getElementById('basketballPoints').value,
      rebounds: document.getElementById('basketballRebounds').value,
      assists: document.getElementById('basketballAssists').value,
      quarters: document.getElementById('basketballQuarters').value
    };
  } else if (selectedSport === 'Tennis') {
    data.details = {
      sport: document.getElementById('tennisSport').value,
      mode: document.getElementById('tennisMode').value,
      duration: document.getElementById('tennisDuration').value,
      setsWon: document.getElementById('tennisSetsWon').value,
      setsLost: document.getElementById('tennisSetsLost').value,
      surface: document.getElementById('tennisSurface').value
    };
  } else if (selectedSport === 'Boxing') {
    data.details = {
      discipline: document.getElementById('boxingDiscipline').value,
      sessionType: document.getElementById('boxingSessionType').value,
      rounds: document.getElementById('boxingRounds').value,
      roundDuration: document.getElementById('boxingRoundDuration').value,
      intensity: document.getElementById('boxingIntensity').value
    };
  } else if (selectedSport === 'Yoga') {
    data.details = {
      style: document.getElementById('yogaStyle').value,
      duration: document.getElementById('yogaDuration').value,
      focusAreas: [...document.querySelectorAll('#focusChips .active')].map((chip) => chip.dataset.chip),
      notes: document.getElementById('yogaNotes').value,
      instructor: document.getElementById('yogaInstructor').value
    };
  } else if (selectedSport === 'Hiking') {
    data.details = {
      trail: document.getElementById('hikeName').value,
      distance: document.getElementById('hikeDistance').value,
      duration: document.getElementById('hikeDuration').value,
      elevationGain: document.getElementById('hikeElevation').value,
      difficulty: document.getElementById('hikeDifficulty').value,
      terrain: document.getElementById('hikeTerrain').value,
      weather: document.getElementById('hikeWeather').value
    };
  } else if (selectedSport === 'Water Sports') {
    data.details = {
      sportType: document.getElementById('waterSportType').value,
      duration: document.getElementById('waterDuration').value,
      distance: document.getElementById('waterDistance').value,
      conditions: document.getElementById('waterConditions').value,
      notes: document.getElementById('waterNotes').value
    };
  } else {
    data.details = {
      activityName: document.getElementById('otherActivity').value,
      duration: document.getElementById('otherDuration').value,
      intensity: document.getElementById('otherIntensity').value,
      description: document.getElementById('otherDescription').value
    };
  }

  return data;
}

function saveWorkoutToStorage(workout) {
  const nextWorkouts = [workout, ...workouts.filter((item) => item.id !== workout.id)].sort((a, b) => new Date(b.date) - new Date(a.date));
  workouts = nextWorkouts;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  fetch('/api/workouts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(workout) }).catch(() => {});
}

async function loadWorkouts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      workouts = JSON.parse(saved);
    } else {
      const response = await fetch('/api/workouts');
      const data = await response.json();
      workouts = data.workouts || [];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
    }
    renderHistory();
    renderSportSpecificFields();
    updateRpeLabel();
    estimateCaloriesFromDuration();
  } catch (error) {
    console.error(error);
  }
}

function renderHistory() {
  const historyList = document.getElementById('historyList');
  const filterValue = document.getElementById('historySportFilter').value;
  const sortValue = document.getElementById('historySort').value;
  let filtered = [...workouts];
  if (filterValue !== 'All') filtered = filtered.filter((item) => item.sport === filterValue);
  filtered.sort((a, b) => {
    if (sortValue === 'oldest') return new Date(a.date) - new Date(b.date);
    if (sortValue === 'calories') return Number(b.calories) - Number(a.calories);
    if (sortValue === 'duration') return Number(b.duration || 0) - Number(a.duration || 0);
    return new Date(b.date) - new Date(a.date);
  });
  const visible = filtered.slice(0, MAX_HISTORY);
  if (!visible.length) {
    historyList.innerHTML = '<div class="empty-state">No workouts logged yet. Start your first session! 💪</div>';
    return;
  }
  historyList.innerHTML = visible.map((workout) => {
    const isToday = new Date(workout.date).toDateString() === new Date().toDateString();
    const keyStat = getKeyStat(workout);
    const difficulty = getDifficulty(workout.rpe);
    return `
      <article class="history-card ${isToday ? 'today' : ''}">
        <div class="history-top">
          <div>
            <div class="badge-row">
              <span class="badge soft">${workout.sport}</span>
              ${workout.personalBest ? '<span class="badge warning">🏅 PB</span>' : ''}
              <span class="badge ${difficulty.className}">${difficulty.label}</span>
            </div>
            <h3>${workout.title || `${workout.sport} session`}</h3>
            <div class="history-meta">${new Date(workout.date).toLocaleString()}</div>
            <div class="history-meta">Duration: ${workout.duration || '—'} min • Calories: ${workout.calories || '—'} • ${keyStat}</div>
          </div>
          <div class="history-actions">
            <button class="btn-ghost" data-action="edit" data-id="${workout.id}" type="button">Edit</button>
            <button class="btn-secondary" data-action="delete" data-id="${workout.id}" type="button">Delete</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
  historyList.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => editWorkout(button.dataset.id));
  });
  historyList.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => deleteWorkout(button.dataset.id));
  });
}

function getKeyStat(workout) {
  if (workout.sport === 'Running') return `Distance: ${workout.details?.distance || 0} km`;
  if (workout.sport === 'Gym') return `Sets × reps: ${workout.details?.setsPerExercise || 0} × ${workout.details?.repsPerSet || 0}`;
  if (workout.sport === 'Swimming') return `Laps: ${workout.details?.laps || 0}`;
  if (workout.sport === 'Cycling') return `Speed: ${workout.details?.speed || 0} km/h`;
  return `RPE ${workout.rpe}`;
}

function getDifficulty(rpe) {
  const value = Number(rpe || 5);
  if (value >= 8) return { label: 'Hard', className: 'danger' };
  if (value >= 5) return { label: 'Medium', className: 'warning' };
  return { label: 'Easy', className: 'success' };
}

function handleSubmit(event) {
  event.preventDefault();
  const data = collectWorkoutData();
  const errors = validateWorkout(data);
  const errorBox = document.getElementById('formErrors');
  if (errors.length) {
    errorBox.textContent = errors.join(' • ');
    return;
  }
  errorBox.textContent = '';
  if (editingId) {
    data.id = editingId;
    workouts = workouts.map((item) => item.id === editingId ? data : item);
  } else {
    data.id = `workout-${Date.now()}`;
    workouts = [data, ...workouts];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  fetch('/api/workouts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workouts }) }).catch(() => {});
  renderHistory();
  showToast('Workout saved! Keep it up 💪');
  resetForm();
}

function editWorkout(id) {
  const workout = workouts.find((item) => item.id === id);
  if (!workout) return;
  editingId = id;
  selectedSport = workout.sport;
  document.getElementById('workoutTitle').value = workout.title || '';
  document.getElementById('workoutDate').value = workout.date;
  document.getElementById('workoutRpe').value = workout.rpe || 6;
  document.getElementById('workoutCalories').value = workout.calories || '';
  document.getElementById('workoutNotes').value = workout.notes || '';
  renderSportGrid();
  renderSportSpecificFields();
  updateRpeLabel();
  if (workout.sport === 'Gym') {
    document.getElementById('exerciseDescription').value = workout.details?.exerciseDescription || '';
    document.getElementById('exerciseCount').value = workout.details?.exerciseCount || '';
    document.getElementById('setsPerExercise').value = workout.details?.setsPerExercise || '';
    document.getElementById('repsPerSet').value = workout.details?.repsPerSet || '';
    document.getElementById('weightUsed').value = workout.details?.weightUsed || '';
    document.getElementById('restTime').value = workout.details?.restTime || '';
    document.getElementById('personalBest').checked = Boolean(workout.personalBest);
  }
  if (workout.sport === 'Running') {
    document.getElementById('runDistance').value = workout.details?.distance || '';
    document.getElementById('runDuration').value = workout.duration || '';
    document.getElementById('runPace').value = workout.details?.pace || '';
    document.getElementById('runHrAvg').value = workout.details?.averageHeartRate || '';
    document.getElementById('runHrMax').value = workout.details?.maxHeartRate || '';
    document.getElementById('runElevation').value = workout.details?.elevationGain || '';
    document.getElementById('runRoute').value = workout.details?.route || '';
    document.getElementById('runShoes').value = workout.details?.shoes || '';
  }
  document.getElementById('formStatus').textContent = 'Editing workout';
  document.getElementById('formStatus').className = 'badge warning';
}

function deleteWorkout(id) {
  workouts = workouts.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  fetch('/api/workouts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workouts }) }).catch(() => {});
  renderHistory();
}

function resetForm() {
  editingId = null;
  selectedSport = 'Gym';
  document.getElementById('workoutForm').reset();
  setDefaultDateTime();
  document.getElementById('workoutRpe').value = '6';
  updateRpeLabel();
  renderSportGrid();
  renderSportSpecificFields();
  document.getElementById('formStatus').textContent = 'Ready to log';
  document.getElementById('formStatus').className = 'badge success';
  document.getElementById('formErrors').textContent = '';
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}

window.addEventListener('DOMContentLoaded', init);
