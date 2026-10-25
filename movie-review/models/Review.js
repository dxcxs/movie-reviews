const { Schema, model } = require('mongoose');

const reviewSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '', maxlength: 2000 }
}, { timestamps: true });

reviewSchema.index({ user: 1, movie: 1 }, { unique: true }); // one review per user per movie

module.exports = model('Review', reviewSchema);
