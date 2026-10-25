require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Review = require('./models/Review');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User.deleteMany(), Movie.deleteMany(), Review.deleteMany()]);

  const [admin, user1, user2] = await User.create([
    { username: 'admin', password: await bcrypt.hash('admin123', 10), role: 'admin' },
    { username: 'user1', password: await bcrypt.hash('user123', 10) },
    { username: 'user2', password: await bcrypt.hash('user123', 10) }
  ]);

  const details = require('./lib/movieDetails');
  const movies = await Movie.create([
    { title: 'Inception', runtime: '2h 28m', genre: 'Sci-Fi', releaseDate: '2010-07-16', description: 'A thief who steals secrets from dreams is offered a chance to plant an idea instead.' },
    { title: 'The Dark Knight', runtime: '2h 32m', genre: 'Action', releaseDate: '2008-07-18', description: 'Batman faces the Joker, a criminal who wants to push Gotham into chaos.' },
    { title: 'Parasite', runtime: '2h 12m', genre: 'Drama', releaseDate: '2019-05-30', description: 'A poor family slowly works its way into the life of a wealthy household.' },
    { title: 'Spirited Away', runtime: '2h 05m', genre: 'Animation', releaseDate: '2001-07-20', description: 'A girl enters a world of spirits and must work in a bathhouse to free her parents.' },
    { title: 'Get Out', runtime: '1h 44m', genre: 'Horror', releaseDate: '2017-02-24', description: 'A young man visits his girlfriend\'s family and finds something is deeply wrong.' },
    { title: 'Superbad', runtime: '1h 53m', genre: 'Comedy', releaseDate: '2007-08-17', description: 'Two high school friends try to get alcohol for a party before graduation.' },
    { title: 'Mad Max: Fury Road', runtime: '2h 00m', genre: 'Action', releaseDate: '2015-05-15', description: 'In a desert wasteland, a drifter helps a rebel escape a tyrant in a long chase.' },
    { title: 'The Conjuring', runtime: '1h 52m', genre: 'Horror', releaseDate: '2013-07-19', description: 'Paranormal investigators help a family terrorized by a dark presence in their farmhouse.' },
    { title: 'Her', runtime: '2h 06m', genre: 'Drama', releaseDate: '2013-12-18', description: 'A lonely writer falls in love with an AI operating system.' },
    { title: 'Paddington 2', runtime: '1h 43m', genre: 'Comedy', releaseDate: '2017-11-10', description: 'Paddington is wrongly jailed for a theft and his family sets out to clear his name.' }
  ].map(m => ({ ...m, ...details[m.title] })));

  const r = (u, i, rating, comment) => ({ user: u._id, movie: movies[i]._id, rating, comment });
  await Review.create([
    r(user1, 0, 5, 'Layered plot and a great score. Needs a second watch.'),
    r(user2, 0, 4, 'Smart and fun, a bit heavy on exposition.'),
    r(user1, 1, 5, 'The Joker carries the whole film.'),
    r(user2, 2, 5, 'Sharp, funny, then devastating.'),
    r(user1, 3, 5, 'Beautiful animation, rewatch every year.'),
    r(user2, 4, 4, 'Tense and clever.'),
    r(user1, 5, 3, 'Funny in parts, dated in others.'),
    r(user2, 6, 4, 'Non-stop action, very little dialogue needed.')
  ]);

  console.log('Seeded. Login: admin / admin123, user1 / user123, user2 / user123');
  await mongoose.disconnect();
})();
