const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'UNAUTHENTICATED' } });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID_OR_EXPIRED' } });
  }
};
