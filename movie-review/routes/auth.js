const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

router.post('/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (username.length < 3 || username.length > 30) return res.status(400).json({ error: 'Username must be 3-30 characters' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (await User.exists({ username })) return res.status(409).json({ error: 'Username is already taken' });

  const user = await User.create({ username, password: await bcrypt.hash(password, 10) });
  req.session.user = { id: user.id, username: user.username, role: user.role };  // log in right away
  res.status(201).json(req.session.user);
});

router.post('/login', async (req, res) => {
  const user = await User.findOne({ username: String(req.body.username || '').trim() });
  if (!user || !(await bcrypt.compare(String(req.body.password || ''), user.password)))
    return res.status(401).json({ error: 'Wrong username or password' });
  req.session.user = { id: user.id, username: user.username, role: user.role };
  res.json(req.session.user);
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

// Who am I? (null when logged out). Includes favorite ids so the UI can show filled hearts.
router.get('/me', async (req, res) => {
  if (!req.session.user) return res.json(null);
  const user = await User.findById(req.session.user.id).select('favorites');
  if (!user) return res.json(null);
  res.json({ ...req.session.user, favorites: user.favorites.map(String) });
});

module.exports = router;
