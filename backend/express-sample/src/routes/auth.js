const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const usersRepo = require('../repositories/users');
const spacesRepo = require('../repositories/spaces');

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, displayName, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'email/password/username required' } });
    const existing = await usersRepo.findByEmail(email);
    if (existing) return res.status(409).json({ error: { code: 'USER_EXISTS' } });
    const existingUsername = await usersRepo.findByUsername(username);
    if (existingUsername) return res.status(409).json({ error: { code: 'USERNAME_EXISTS' } });
    const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
    await usersRepo.create({ email, username, displayName, password: hashed, role: 'user' });
    const space = await spacesRepo.ensureForUser({ email, username, displayName });
    return res.status(201).json({ ok: true, space });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await usersRepo.findByEmail(email);
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    const space = await spacesRepo.ensureForUser({ email, username: user.username, displayName: user.displayName });
    const accessToken = jwt.sign({ sub: email, username: user.username, role: user.role, displayName: user.displayName }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30m'
    });
    const refreshToken = jwt.sign({ sub: email }, jwtSecret, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
    return res.json({
      accessToken,
      refreshToken,
      user: { email, username: user.username, displayName: user.displayName, role: user.role, spaceSlug: space.slug }
    });
  } catch (err) { next(err); }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken required' } });
  try {
    const payload = jwt.verify(refreshToken, jwtSecret);
    usersRepo.findByEmail(payload.sub).then(async user => {
      const space = await spacesRepo.ensureForUser({ email: payload.sub, username: user?.username, displayName: user?.displayName });
      const accessToken = jwt.sign(
        { sub: payload.sub, username: user?.username, role: user?.role || 'user', displayName: user?.displayName },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
      );
      return res.json({ accessToken, user: { email: payload.sub, username: user?.username, displayName: user?.displayName, role: user?.role || 'user', spaceSlug: space.slug } });
    });
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID_OR_EXPIRED' } });
  }
});

module.exports = router;
