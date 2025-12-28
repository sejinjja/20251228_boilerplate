const express = require('express');
const auth = require('../middleware/auth');
const spacesRepo = require('../repositories/spaces');
const router = express.Router();

// public: list spaces
router.get('/', async (req, res, next) => {
  try {
    const spaces = await spacesRepo.list();
    return res.json(spaces.map(s => ({ id: s.id, ownerId: s.ownerId, username: s.username, createdAt: s.createdAt, updatedAt: s.updatedAt })));
  } catch (err) {
    next(err);
  }
});

// public: get single space
router.get('/:username', async (req, res, next) => {
  try {
    const space = await spacesRepo.findByUsername(req.params.username);
    if (!space) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return res.json({ id: space.id, ownerId: space.ownerId, username: space.username, createdAt: space.createdAt, updatedAt: space.updatedAt });
  } catch (err) {
    next(err);
  }
});

// auth: create/claim space for current user (idempotent)
router.post('/', auth, async (req, res, next) => {
  try {
    const space = await spacesRepo.ensureForUser({ ownerId: req.user.userId });
    return res.status(201).json({ id: space.id, ownerId: space.ownerId, username: space.username, createdAt: space.createdAt, updatedAt: space.updatedAt });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
