const express = require('express');
const session = require('express-session');
const cors = require('cors');

// ← ADD THESE 3 LINES
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facilitiesRoutes = require('./routes/facilities');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const { requireSession, requireAdmin } = require('./middleware/helpers');
const dailyChecklistRoutes = require('./routes/dailyChecklistRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const nutritionRoutes = require('./routes/nutritionRoutes');
const calorieTrackerRoutes = require('./routes/calorieTrackerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'rp-fitness-dev-secret';

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 }
}));

// =========================
// API Routes
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/daily-checklist', dailyChecklistRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/calorie-tracker', calorieTrackerRoutes);

// =========================
// Legacy API Endpoints
// (kept unchanged)
// =========================
app.post('/signup', authController.signup);
app.post('/login', authController.login);
app.get('/check-session', authController.checkSession);
app.get('/logout', authController.logout);
app.get('/get-users', requireSession, requireAdmin, adminController.getUsers);
app.post('/delete-user', requireSession, requireAdmin, adminController.deleteUser);
app.post('/user-overview', requireSession, requireAdmin, adminController.userOverview);

// =========================
// Health Check
// =========================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'fitness-backend' });
});

// ← ADD THESE LINES
// =========================
// Prometheus Metrics
// =========================
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    const metrics = await client.register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err);
  }
});

// =========================
// 404
// =========================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// =========================
// Error Handler
// =========================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server error'
  });
});

// =========================
// Start Server
// =========================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`RP Fitness backend running at http://0.0.0.0:${PORT}`);
});