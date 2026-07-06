# RP Fitness Project

This project includes the RP Fitness student portal with login, dashboard, daily checklist, admin view, and a new calorie tracker page.

## Folder Structure

```text
remaining_content_no_checklist/
├── backend/
│   ├── controllers/
│   ├── data/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── assets/
│   ├── pages/
│   │   ├── admin.html
│   │   ├── dashboard.html
│   │   ├── login.html
|   |   ├── calorie-Tracker.html
│   │   └── signup.html
│   ├── public/
│   ├── src/
│   │   └── app.js
│   └── styles/
│       └── style.css
├── Dockerfile
├── docker-compose.yml
├── index.js
├── package.json
└── package-lock.json
```

## Included Pages

- Login
- Sign up
- Student dashboard
- Admin dashboard / user management

## Removed Daily Checklist Files

- `frontend/pages/DailyHabits.html`
- `frontend/src/habitTracker.js`
- Dashboard links/buttons that opened the Daily Checklist page
- The Daily Checklist route from `backend/server.js`

## Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/pages/login.html
```

## Fitness Activity Module (vBanal)

- Feature 1: Workout Activity Logger
  Log workouts for 12 sport types with smart dynamic fields, auto-calculations, personal best detection, and RPE rating.
- Feature 2: Workout Progress Dashboard
  Strava-inspired analytics with Chart.js graphs, streaks, personal bests, sport breakdown, and calorie trends.
- Feature 3: Workout Planner and Calendar
  Full interactive monthly/weekly calendar with planned vs actual tracking, drag-and-drop, and auto-completion detection.
- Pages: WorkoutLogger.html, WorkoutDashboard.html, WorkoutPlanner.html
- Data: localStorage (rpFitness_workouts, rpFitness_workoutPlan)
- How to use: Open WorkoutLogger to log, WorkoutDashboard to analyse, and WorkoutPlanner to schedule ahead.

## New Feature

- `frontend/pages/Calorie-Tracker.html`
- Daily Calorie Goal with date input, save, edit, and clear controls
- Recommended Daily Calorie Intake using age, gender, height, weight, and exercise level
- Daily Calorie Progress showing goal, food eaten, remaining calories, and status
- Food Calorie Tracker with date-based logging and delete buttons for each entry
- Real monthly calendar grid with day boxes and goal status coloring
- Sidebar navigation link to the Calorie Tracker page
- Dashboard card button opens `Calorie-Tracker.html`
- Data persistence using `localStorage`

## Run Locally

```bash
npm install
npm start
```

Then open:

```text
http://localhost:3000/pages/login.html
```
