const express = require('express');
const auth = require('../middleware/auth');
const postsRepo = require('../repositories/posts');
const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const result = await postsRepo.list({ page, pageSize });
    return res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return res.json(post);
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { title, content, tags = [] } = req.body;
    if (!title || !content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
    const trimmedTags = Array.isArray(tags) ? tags.slice(0, 5) : [];
    const post = await postsRepo.create({ title, content, tags: trimmedTags, author: req.user.sub });
    return res.status(201).json(post);
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const { title = post.title, content = post.content, tags = post.tags } = req.body;
    const updated = await postsRepo.update(req.params.id, { title, content, tags: Array.isArray(tags) ? tags.slice(0, 5) : [] });
    return res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    await postsRepo.softDelete(req.params.id);
    return res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
