const router = require('express').Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');
const Movie = require('../models/Movie');
const movieStats = require('../lib/movieStats');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// Dashboard numbers (MongoDB aggregation)
router.get('/stats', async (req, res) => {
  const [movies, users, reviews, avg, ratingDist, genres, topRated, mostFavorited] = await Promise.all([
    Movie.countDocuments(),
    User.countDocuments(),
    Review.countDocuments(),
    Review.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' } } }]),
    Review.aggregate([{ $group: { _id: '$rating', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
    Movie.aggregate([{ $group: { _id: '$genre', count: { $sum: 1 } } }, { $sort: { count: -1, _id: 1 } }]),
    movieStats({}, { avgRating: -1, reviewCount: -1 }).then(list => list.filter(m => m.reviewCount).slice(0, 5)),
    User.aggregate([
      { $unwind: '$favorites' },
      { $group: { _id: '$favorites', count: { $sum: 1 } } },
      { $sort: { count: -1 } }, { $limit: 5 },
      { $lookup: { from: 'movies', localField: '_id', foreignField: '_id', as: 'm' } },
      { $unwind: '$m' },
      { $project: { title: '$m.title', count: 1 } }
    ])
  ]);
  res.json({
    movies, users, reviews,
    avgRating: avg[0] ? Math.round(avg[0].avg * 10) / 10 : 0,
    ratingDist, genres,
    topRated: topRated.map(m => ({ _id: m._id, title: m.title, avgRating: m.avgRating, reviewCount: m.reviewCount })),
    mostFavorited
  });
});

router.get('/users', async (req, res) => {
  res.json(await User.find().select('-password -favorites').sort('username'));
});

router.patch('/users/:id/role', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  if (req.params.id === req.session.user.id) return res.status(400).json({ error: "You can't change your own role" });
  if (!['user', 'admin'].includes(req.body.role)) return res.status(400).json({ error: 'Invalid role' });
  res.json(await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true }).select('-password'));
});

router.delete('/users/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  if (req.params.id === req.session.user.id) return res.status(400).json({ error: "You can't delete yourself" });
  await User.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ user: req.params.id });
  res.json({ ok: true });
});

router.get('/reviews', async (req, res) => {
  res.json(await Review.find().sort('-createdAt').populate('user', 'username').populate('movie', 'title'));
});

module.exports = router;
