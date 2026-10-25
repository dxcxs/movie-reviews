const router = require('express').Router();
const mongoose = require('mongoose');
const Review = require('../models/Review');
const { requireLogin } = require('../middleware/auth');

const loadReview = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  req.review = review;
  next();
};
const isOwner = (req) => String(req.review.user) === req.session.user.id;

// Edit own review
router.put('/:id', requireLogin, loadReview, async (req, res) => {
  if (!isOwner(req)) return res.status(403).json({ error: 'You can only edit your own review' });
  req.review.rating = Number(req.body.rating);
  req.review.comment = String(req.body.comment || '').trim();
  await req.review.save();
  res.json(req.review);
});

// Delete own review (admin can delete any)
router.delete('/:id', requireLogin, loadReview, async (req, res) => {
  if (!isOwner(req) && req.session.user.role !== 'admin')
    return res.status(403).json({ error: 'You can only delete your own review' });
  await req.review.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
