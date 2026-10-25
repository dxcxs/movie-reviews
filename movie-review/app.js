require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

const app = express();

app.use(express.json());
app.use((req, res, next) => { req.body = req.body || {}; next(); });
app.use(cookieParser());

// Session: login state lives on the server (stored in MongoDB); browser only holds the session id cookie
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 2 }
}));

// Cookie: remember the visitor's theme (light/dark) for 30 days
app.post('/api/theme', (req, res) => {
  const theme = req.body.theme === 'dark' ? 'dark' : 'light';
  res.cookie('theme', theme, { maxAge: 1000 * 60 * 60 * 24 * 30, sameSite: 'lax' });
  res.json({ theme });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/movies', require('./routes/movies'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/me', require('./routes/me'));
app.use('/api/admin', require('./routes/admin'));

// Admin page is only served to admins
app.get('/admin.html', (req, res, next) => {
  if (req.session.user?.role === 'admin') return next();
  res.redirect('/login.html');
});
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.code === 11000) return res.status(409).json({ error: 'Duplicate value' });
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 3000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`http://localhost:${PORT}`)))
  .catch(err => { console.error('Cannot connect to MongoDB:', err.message); process.exit(1); });
