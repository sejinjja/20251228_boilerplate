const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();

// TODO: replace with real user store
const users = new Map();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'email/password required' } });
    if (users.has(email)) return res.status(409).json({ error: { code: 'USER_EXISTS' } });
    const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
    users.set(email, { email, displayName, password: hashed, role: 'user' });
    return res.status(201).json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = users.get(email);
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    const accessToken = jwt.sign({ sub: email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30m' });
    const refreshToken = jwt.sign({ sub: email }, process.env.JWT_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
    return res.json({ accessToken, refreshToken, user: { email, displayName, role: user.role } });
  } catch (err) { next(err); }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken required' } });
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const accessToken = jwt.sign({ sub: payload.sub }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '30m' });
    return res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID_OR_EXPIRED' } });
  }
});

module.exports = router;
