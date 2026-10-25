const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const movieStats = require('../lib/movieStats');
const { requireLogin } = require('../middleware/auth');

router.use(requireLogin);

router.get('/reviews', async (req, res) => {
  res.json(await Review.find({ user: req.session.user.id }).sort('-createdAt').populate('movie', 'title'));
});

router.get('/favorites', async (req, res) => {
  const user = await User.findById(req.session.user.id).select('favorites');
  res.json(await movieStats({ _id: { $in: user.favorites } }, { title: 1 }));
});

router.put('/favorites/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  await User.updateOne({ _id: req.session.user.id }, { $addToSet: { favorites: req.params.id } });
  res.json({ ok: true });
});

router.delete('/favorites/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  await User.updateOne({ _id: req.session.user.id }, { $pull: { favorites: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
