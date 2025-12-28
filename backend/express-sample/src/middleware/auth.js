const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

module.exports = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: { code: 'UNAUTHENTICATED' } });
  const token = auth.slice(7);
  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID_OR_EXPIRED' } });
  }
};
