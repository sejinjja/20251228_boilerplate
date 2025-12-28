const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// in-memory store for demo
let posts = [];
let idSeq = 1;

router.get('/', (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  const pageNum = Math.max(1, Number(page));
  const sizeNum = Math.min(Math.max(1, Number(pageSize)), 50);
  const start = (pageNum - 1) * sizeNum;
  const paged = posts.slice(start, start + sizeNum);
  return res.json({ data: paged, total: posts.length, page: pageNum, pageSize: sizeNum });
});

router.get('/:id', (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  return res.json(post);
});

router.post('/', auth, (req, res) => {
  const { title, content, tags = [] } = req.body;
  if (!title || !content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
  const post = { id: idSeq++, title, content, tags: tags.slice(0, 5), author: req.user.sub, createdAt: new Date().toISOString() };
  posts.push(post);
  return res.status(201).json(post);
});

router.put('/:id', auth, (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  Object.assign(post, req.body, { updatedAt: new Date().toISOString() });
  return res.json(post);
});

router.delete('/:id', auth, (req, res) => {
  const post = posts.find(p => p.id === Number(req.params.id));
  if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  post.deletedAt = new Date().toISOString();
  return res.status(204).end();
});

module.exports = router;
