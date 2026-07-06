const express = require('express');
const path = require('path');
const session = require('express-session');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const { requireSession, requireAdmin } = require('./middleware/helpers');
const dailyChecklistRoutes = require('./routes/dailyChecklistRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || 'rp-fitness-dev-secret';
const frontendRoot = path.join(__dirname, '..', 'frontend');
const pagesRoot = path.join(frontendRoot, 'pages');

app.use(cors({ origin: process.env.CORS_ORIGIN || true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 }
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/daily-checklist', dailyChecklistRoutes);

app.get('/pages/admin.html', requireAdmin, (req, res) => res.sendFile(path.join(pagesRoot, 'admin.html')));

app.use(express.static(frontendRoot));
app.get('/', (req, res) => res.redirect('/pages/login.html'));
app.get('/daily-checklist', (req, res) => res.sendFile(path.join(pagesRoot, 'dailyChecklist.html')));

['login.html', 'signup.html', 'dashboard.html', 'admin.html'].forEach((page) => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(pagesRoot, page)));
});

app.post('/signup', authController.signup);
app.post('/login', authController.login);
app.get('/check-session', authController.checkSession);
app.get('/logout', authController.logout);
app.get('/get-users', adminController.getUsers);
app.post('/delete-user', adminController.deleteUser);
app.post('/user-overview', adminController.userOverview);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RP Fitness running at http://0.0.0.0:${PORT}/pages/login.html`);
});