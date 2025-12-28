const express = require('express');
const auth = require('../middleware/auth');
const spacesRepo = require('../repositories/spaces');
const router = express.Router();

// public: list spaces
router.get('/', async (req, res, next) => {
  try {
    const spaces = await spacesRepo.list();
    return res.json(spaces);
  } catch (err) {
    next(err);
  }
});

// public: get single space
router.get('/:slug', async (req, res, next) => {
  try {
    const space = await spacesRepo.findBySlug(req.params.slug);
    if (!space) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return res.json(space);
  } catch (err) {
    next(err);
  }
});

// auth: create/claim space for current user (idempotent)
router.post('/', auth, async (req, res, next) => {
  try {
    const space = await spacesRepo.ensureForUser({
      email: req.user.sub,
      username: req.user.username,
      displayName: req.user.displayName,
      desiredSlug: req.body.slug,
      title: req.body.title,
      bio: req.body.bio
    });
    return res.status(201).json(space);
  } catch (err) {
    next(err);
  }
});

// auth: update own space
router.patch('/:slug', auth, async (req, res, next) => {
  try {
    const space = await spacesRepo.findBySlug(req.params.slug);
    if (!space) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (space.ownerEmail !== req.user.sub && req.user.role !== 'admin') {
      return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    }
    const updated = await spacesRepo.update(space.slug, {
      title: req.body.title || space.title,
      bio: req.body.bio ?? space.bio
    });
    return res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
