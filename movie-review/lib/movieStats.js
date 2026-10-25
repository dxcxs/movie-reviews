const Movie = require('../models/Movie');

// Movies + average rating + review count, via aggregation
module.exports = function movieStats(match = {}, sort = { _id: 1 }) {
  return Movie.aggregate([
    { $match: match },
    { $lookup: { from: 'reviews', localField: '_id', foreignField: 'movie', as: 'r' } },
    { $addFields: {
        avgRating: { $round: [{ $ifNull: [{ $avg: '$r.rating' }, 0] }, 1] },
        reviewCount: { $size: '$r' }
    } },
    { $project: { r: 0 } },
    { $sort: sort }
  ]);
};
