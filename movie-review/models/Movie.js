const { Schema, model } = require('mongoose');

module.exports = model('Movie', new Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  genre: { type: String, required: true, trim: true },
  releaseDate: { type: Date, required: true },
  description: { type: String, default: '', maxlength: 2000 },
  posterUrl: { type: String, default: '' },        // portrait, for cards
  backdropUrl: { type: String, default: '' },      // wide, for banners
  director: { type: String, trim: true, default: '' },
  cast: [{ type: String, trim: true }],
  tagline: { type: String, trim: true, maxlength: 200, default: '' },
  trailerUrl: { type: String, trim: true, default: '' },   // YouTube link (or any video link)
  runtime: { type: String, trim: true, maxlength: 20, default: '' }   // free text, e.g. 1h 30m
}, { timestamps: true }));
