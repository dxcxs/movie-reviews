const router = require('express').Router();
const mongoose = require('mongoose');
const Movie = require('../models/Movie');
const Review = require('../models/Review');
const User = require('../models/User');
const movieStats = require('../lib/movieStats');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id) ? next() : res.status(400).json({ error: 'Invalid id' });
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const pickMovie = b => ({
  title: b.title, genre: b.genre, releaseDate: b.releaseDate,
  description: b.description, posterUrl: b.posterUrl,
  director: b.director, tagline: b.tagline, trailerUrl: b.trailerUrl,
  cast: Array.isArray(b.cast) ? b.cast : String(b.cast || '').split(',').map(x => x.trim()).filter(Boolean),
  backdropUrl: b.backdropUrl, runtime: String(b.runtime || '').trim()
});

// Cookie 'recent' = comma-separated ids of the last movies this browser opened (max 10)
const readRecent = req => String(req.cookies.recent || '').split(',').filter(id => /^[0-9a-f]{24}$/.test(id));

// GET /api/movies?q=&genre=&sort=rating|date|title
router.get('/', async (req, res) => {
  const { q = '', genre = '', sort = 'rating' } = req.query;
  const match = {};
  if (q) match.title = { $regex: escapeRegex(String(q)), $options: 'i' };
  if (genre) match.genre = String(genre);
  const order = sort === 'date' ? { releaseDate: -1 }
              : sort === 'title' ? { title: 1 }
              : { avgRating: -1, reviewCount: -1, title: 1 };
  res.json(await movieStats(match, order));
});

router.get('/genres', async (req, res) => {
  res.json((await Movie.distinct('genre')).sort());
});

// Movies from the 'recent' cookie, newest first
router.get('/recent', async (req, res) => {
  const ids = readRecent(req);
  if (!ids.length) return res.json([]);
  const movies = await movieStats({ _id: { $in: ids.map(i => new mongoose.Types.ObjectId(i)) } });
  movies.sort((a, b) => ids.indexOf(String(a._id)) - ids.indexOf(String(b._id)));
  res.json(movies);
});

router.get('/:id', validId, async (req, res) => {
  const [movie] = await movieStats({ _id: new mongoose.Types.ObjectId(req.params.id) });
  if (!movie) return res.status(404).json({ error: 'Movie not found' });
  // remember this visit in a cookie (most recent first, no duplicates, max 10)
  const id = String(movie._id);
  const recent = [id, ...readRecent(req).filter(x => x !== id)].slice(0, 10);
  res.cookie('recent', recent.join(','), { maxAge: 1000 * 60 * 60 * 24 * 30, httpOnly: true, sameSite: 'lax' });
  res.json(movie);
});

router.get('/:id/reviews', validId, async (req, res) => {
  const reviews = await Review.find({ movie: req.params.id })
    .sort('-createdAt').populate('user', 'username');
  res.json(reviews);
});

// Create or update the logged-in user's review for this movie
router.post('/:id/reviews', requireLogin, validId, async (req, res) => {
  if (!(await Movie.exists({ _id: req.params.id }))) return res.status(404).json({ error: 'Movie not found' });
  const review = await Review.findOneAndUpdate(
    { user: req.session.user.id, movie: req.params.id },
    { rating: Number(req.body.rating), comment: String(req.body.comment || '').trim() },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(review);
});

// Admin CRUD
router.post('/', requireAdmin, async (req, res) => {
  res.status(201).json(await Movie.create(pickMovie(req.body)));
});

router.put('/:id', requireAdmin, validId, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, pickMovie(req.body), { new: true, runValidators: true });
  movie ? res.json(movie) : res.status(404).json({ error: 'Movie not found' });
});

router.delete('/:id', requireAdmin, validId, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  await Review.deleteMany({ movie: req.params.id });
  await User.updateMany({}, { $pull: { favorites: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
