# Daily Checklist Feature - Backend/Frontend Structure

This folder has been rearranged to match your project format:

```text
backend/
  controllers/dailyChecklistController.js
  models/dailyChecklistModel.js
  routes/dailyChecklistRoutes.js
  data/dailyChecklist.json

frontend/
  pages/dailyChecklist.html
  styles/dailyChecklist.css
  src/habitTracker.js
  src/app.js
  assets/images/rp-logo.png
```

## How to add this into your feature branch

From your project branch, copy these files into the same matching folders.

Example:

```bash
git checkout main
git pull origin main
git checkout -b feature-daily-checklist
```

Then copy the files into your project.

## Backend server.js update

In `backend/server.js`, add this near your other route imports:

```js
const dailyChecklistRoutes = require('./routes/dailyChecklistRoutes');
```

Then add this near your other `app.use(...)` route registrations:

```js
app.use('/api/daily-checklist', dailyChecklistRoutes);
```

## Frontend navigation update

Add this link to your dashboard/sidebar/nav where needed:

```html
<a href="dailyChecklist.html">Daily Checklist</a>
```

## Important notes

- The actual checklist progress uses browser `localStorage`, so it does not require a database.
- The backend API only stores/serves the feature configuration from `backend/data/dailyChecklist.json`.
- Do not copy `app.py` or `requirements.txt`; those were only for the old Flask version.
- After copying, test locally before pushing:

```bash
docker compose up --build
```

Then commit and push:

```bash
git add .
git commit -m "Add daily checklist feature"
git push -u origin feature-daily-checklist
```
