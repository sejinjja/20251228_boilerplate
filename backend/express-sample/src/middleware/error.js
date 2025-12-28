module.exports = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  return res.status(status).json({ error: { code, message: err.message || 'Unexpected error' } });
};
