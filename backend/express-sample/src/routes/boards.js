const express = require('express');
const auth = require('../middleware/auth');
const boardsRepo = require('../repositories/boards');
const router = express.Router();

// public: list boards
router.get('/', async (req, res, next) => {
  try {
    const boards = await boardsRepo.ensureDefaults();
    return res.json(boards);
  } catch (err) { next(err); }
});

// admin only: create board
router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const { name, slug, type = 'free', isDefault = 0 } = req.body;
    if (!name || !slug) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'name/slug required' } });
    if (!['free', 'notice', 'trade'].includes(type)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'type must be free|notice|trade' } });
    const created = await boardsRepo.create({ name, slug, type, isDefault });
    return res.status(201).json(created);
  } catch (err) { next(err); }
});

module.exports = router;
