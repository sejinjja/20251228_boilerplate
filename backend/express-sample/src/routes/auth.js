const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const router = express.Router();
const usersRepo = require('../repositories/users');
const spacesRepo = require('../repositories/spaces');

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

function slugify(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'email/password/username required' } });
    const normalizedUsername = slugify(username);
    const existing = await usersRepo.findByEmail(email);
    if (existing) return res.status(409).json({ error: { code: 'USER_EXISTS' } });
    const existingUsername = await usersRepo.findByUsername(normalizedUsername);
    if (existingUsername) return res.status(409).json({ error: { code: 'USERNAME_EXISTS' } });
    const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS) || 12);
    const user = await usersRepo.create({ email, username: normalizedUsername, password: hashed, role: 'user' });
    const space = await spacesRepo.ensureForUser({ ownerId: user.id });
    return res.status(201).json({
      ok: true,
      space,
      user: { id: user.id, email, username: normalizedUsername, role: 'user', spaceId: space.id, space: { id: space.id, username: space.username } }
    });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await usersRepo.findByEmail(email);
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' } });
    const fallbackUsername = slugify(user.username || email.split('@')[0] || 'user');
    if (!user.username) await usersRepo.updateUsername(email, fallbackUsername);
    const space = await spacesRepo.ensureForUser({ ownerId: user.id });
    const accessToken = jwt.sign({ sub: email, userId: user.id, username: user.username || fallbackUsername, role: user.role }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '30m'
    });
    const refreshToken = jwt.sign({ sub: email }, jwtSecret, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' });
    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email,
        username: user.username || fallbackUsername,
        role: user.role,
        spaceId: space.id,
        space: { id: space.id, username: space.username }
      }
    });
  } catch (err) { next(err); }
});

router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'refreshToken required' } });
  try {
    const payload = jwt.verify(refreshToken, jwtSecret);
    usersRepo.findByEmail(payload.sub).then(async user => {
      const fallbackUsername = slugify(user?.username || payload.sub?.split('@')[0] || 'user');
      if (user && !user.username) await usersRepo.updateUsername(payload.sub, fallbackUsername);
      const space = await spacesRepo.ensureForUser({ ownerId: user?.id });
      const accessToken = jwt.sign(
        { sub: payload.sub, userId: user?.id, username: user?.username || fallbackUsername, role: user?.role || 'user' },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '30m' }
      );
      return res.json({
        accessToken,
        user: {
          id: user?.id,
          email: payload.sub,
          username: user?.username || fallbackUsername,
          role: user?.role || 'user',
          spaceId: space.id,
          space: { id: space.id, username: space.username }
        }
      });
    });
  } catch (err) {
    return res.status(401).json({ error: { code: 'TOKEN_INVALID_OR_EXPIRED' } });
  }
});

module.exports = router;
