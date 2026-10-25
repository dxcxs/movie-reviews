exports.requireLogin = (req, res, next) =>
  req.session.user ? next() : res.status(401).json({ error: 'Please log in first' });

exports.requireAdmin = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in first' });
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
};
