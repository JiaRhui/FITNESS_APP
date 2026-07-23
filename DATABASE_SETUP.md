# Database Migration — Setup & Verification Guide

This covers **only** the database piece. Trivy/security scanning is intentionally
left out of the pipeline for now — we'll add that once this is confirmed working.

## What changed

| File | Change |
|---|---|
| `docker-compose.yml` / `docker-compose.staging.yml` | Added a `mysql` service (with healthcheck) and wired `backend` to depend on it |
| `backend/models/schema.sql` | New — table definitions, auto-loaded by MySQL on first boot |
| `backend/config/db.js` | New — MySQL connection pool + boot-time connectivity check |
| `backend/models/userModel.js` | Rewritten from flat-file JSON reads/writes to real SQL queries, with **bcrypt password hashing** added (your JSON file was storing plaintext passwords) |
| `backend/controllers/authController.js` | Updated to `async/await` against the new model (signup/login) |
| `backend/controllers/adminController.js` | User-related parts (`getUsers`, `deleteUser`, `userOverview`) updated to use the DB; workout/nutrition/plan file cleanup left untouched for now |
| `backend/server.js` | Waits for MySQL to be reachable before accepting traffic, so it doesn't crash on boot if MySQL is still initializing |
| `backend/scripts/migrate-json-to-mysql.js` | One-time script to move your existing `users.json` records into MySQL (hashing their passwords along the way) |
| `backend/package.json` | Added `mysql2` and `bcryptjs` |

**Important — only `users` is fully migrated.** Workouts, workout plans, nutrition,
calorie tracker, and daily checklist still read/write their JSON files exactly as
before. Their tables already exist in `schema.sql` so you can migrate them the
same way, model by model, whenever you're ready — just say the word and I'll do
the next one with you.

## How to run it locally

1. Drop these files into your repo at the matching paths (they overwrite the
   equivalents you already have).
2. Install the new backend dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Start just the database first and wait for it to be healthy:
   ```bash
   docker compose up -d mysql
   docker compose ps   # wait until mysql shows "healthy"
   ```
4. Migrate your existing users out of `users.json` into MySQL:
   ```bash
   cd backend
   MYSQL_HOST=localhost MYSQL_PORT=3306 MYSQL_DATABASE=fitness_app \
   MYSQL_USER=fitness MYSQL_PASSWORD=password \
   npm run migrate:users
   ```
   You should see `Migration complete. Migrated: 3, skipped (already existed): 0`
   (or similar, matching your current `users.json`).
5. Bring everything up:
   ```bash
   cd ..
   docker compose up -d --build
   ```

## How to verify it's actually working

- **Health check:** `curl http://localhost:3001/health` → `{"status":"OK", ...}`
- **Login with an existing (migrated) account** through the app UI — it should
  work with the same email/password you signed up with before.
- **Check the data landed in MySQL:**
  ```bash
  docker exec -it fitness-mysql mysql -u fitness -ppassword fitness_app \
    -e "SELECT id, email, created_at, last_login FROM users;"
  ```
- **Confirm passwords are hashed, not plaintext** — the `password_hash` column
  should look like `$2a$10$...`, never the original password.
- **Sign up a brand-new account** through the app and confirm it also lands in
  the `users` table (not in `users.json` anymore).

## If something goes wrong

- Backend won't start / keeps retrying "MySQL not ready" → check
  `docker compose logs mysql` and confirm the healthcheck passed before backend
  started (the `depends_on: condition: service_healthy` should handle ordering,
  but first boots can be slow while MySQL initializes its data directory).
- Migration script errors on connection → double check the `MYSQL_*` env vars
  match what's in your `.env` file, and that port 3306 isn't already used by
  another local MySQL instance.
- Old `users.json` is left untouched by the migration (it's read-only, never
  deleted), so nothing is destroyed if you need to re-run or roll back.

## Next step

Once you've confirmed login/signup work end-to-end against MySQL, come back
and we'll layer Trivy image scanning into the Jenkins pipeline.
