# RP Fitness Project - Remaining Content (No Daily Checklist)

This folder keeps the original full-stack project format with the Daily Checklist feature removed.

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
