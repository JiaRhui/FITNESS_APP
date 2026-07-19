-- ============================================================
-- RP Fitness — initial schema
-- One table group per feature. Each feature owner owns their
-- own tables; nobody edits another owner's section.
-- ============================================================

-- ---------- SHARED: users (auth owner) ----------
-- Passwords are stored as a scrypt hash, never plaintext.
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  is_admin      BOOLEAN     NOT NULL DEFAULT FALSE,
  profile       JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login    TIMESTAMPTZ
);

-- Email is matched case-insensitively by the app; store it lowercased.
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);


-- ---------- FEATURE: workouts (vBanal) ----------
-- `details` stays JSONB because the fields differ per sport
-- (running has pace/route/shoes; other sports will not).
CREATE TABLE IF NOT EXISTS workouts (
  id            BIGSERIAL PRIMARY KEY,
  user_id       BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id     TEXT,
  title         TEXT        NOT NULL,
  sport         TEXT        NOT NULL,
  workout_date  TIMESTAMPTZ NOT NULL,
  rpe           SMALLINT    CHECK (rpe BETWEEN 1 AND 10),
  calories      INTEGER     CHECK (calories >= 0),
  duration_min  INTEGER     CHECK (duration_min >= 0),
  notes         TEXT,
  personal_best BOOLEAN     NOT NULL DEFAULT FALSE,
  details       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts (user_id, workout_date DESC);


-- ---------- FEATURE: workout plans (vBanal) ----------
CREATE TABLE IF NOT EXISTS workout_plans (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT        NOT NULL,
  plan_date  DATE        NOT NULL,
  details    JSONB       NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_user_date ON workout_plans (user_id, plan_date);


-- ---------- FEATURE: calorie tracker (iszykun) ----------
-- One tracker row per user per day; foods are child rows.
-- This replaces the embedded `calories: { date, foods[] }` blob
-- that previously lived inside each user record.
CREATE TABLE IF NOT EXISTS calorie_trackers (
  id           BIGSERIAL PRIMARY KEY,
  user_id      BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tracker_date DATE        NOT NULL,
  goal         INTEGER     CHECK (goal >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tracker_date)
);

CREATE TABLE IF NOT EXISTS calorie_foods (
  id         BIGSERIAL PRIMARY KEY,
  tracker_id BIGINT      NOT NULL REFERENCES calorie_trackers(id) ON DELETE CASCADE,
  food_name  TEXT        NOT NULL,
  calories   INTEGER     NOT NULL CHECK (calories >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_tracker ON calorie_foods (tracker_id);


-- ---------- FEATURE: nutrition (nutrition owner) ----------
CREATE TABLE IF NOT EXISTS nutrition_meals (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_name  TEXT         NOT NULL,
  calories   INTEGER      NOT NULL CHECK (calories >= 0),
  protein    NUMERIC(6,2) CHECK (protein >= 0),
  carbs      NUMERIC(6,2) CHECK (carbs   >= 0),
  fat        NUMERIC(6,2) CHECK (fat     >= 0),
  entry_date DATE         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meals_user_date ON nutrition_meals (user_id, entry_date DESC);


-- ---------- FEATURE: daily checklist (JiaRhui) ----------
-- One row per user per habit per day. The UNIQUE constraint makes
-- "tick today's habit" a clean upsert instead of a month-blob rewrite.
CREATE TABLE IF NOT EXISTS habit_logs (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  habit_key  TEXT        NOT NULL,
  log_date   DATE        NOT NULL,
  completed  BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, habit_key, log_date)
);

CREATE INDEX IF NOT EXISTS idx_habits_user_date ON habit_logs (user_id, log_date DESC);


-- ---------- FEATURE: gym locator (Nizam) ----------
CREATE TABLE IF NOT EXISTS curated_facilities (
  id      BIGSERIAL PRIMARY KEY,
  name    TEXT         NOT NULL,
  address TEXT,
  lat     NUMERIC(9,6) NOT NULL,
  lng     NUMERIC(9,6) NOT NULL,
  type    TEXT         NOT NULL CHECK (type IN ('gym', 'track')),
  public  BOOLEAN      NOT NULL DEFAULT TRUE,
  fee     TEXT         NOT NULL CHECK (fee IN ('free', 'paid', 'unknown')),
  UNIQUE (name, lat, lng)
);

CREATE INDEX IF NOT EXISTS idx_curated_public_type ON curated_facilities (public, type);

-- Caches OpenStreetMap (Overpass) responses so repeat searches skip the
-- external API. This is why the gym locator needs a database at all:
-- the curated list is static, but the cache is write-heavy.
CREATE TABLE IF NOT EXISTS facility_cache (
  id          BIGSERIAL PRIMARY KEY,
  query_lat   NUMERIC(9,6) NOT NULL,
  query_lng   NUMERIC(9,6) NOT NULL,
  radius_km   NUMERIC(5,2) NOT NULL,
  type_filter TEXT         NOT NULL,
  payload     JSONB        NOT NULL,
  fetched_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_lookup
  ON facility_cache (query_lat, query_lng, radius_km, type_filter, fetched_at DESC);
