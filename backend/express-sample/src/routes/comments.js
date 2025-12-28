const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router({ mergeParams: true });

const comments = [];
let idSeq = 1;

router.get('/', (req, res) => {
  const { id } = req.params;
  const filtered = comments.filter(c => c.postId === Number(id));
  return res.json(filtered);
});

router.post('/', auth, (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
  const comment = { id: idSeq++, postId: Number(id), content, author: req.user.sub, createdAt: new Date().toISOString() };
  comments.push(comment);
  return res.status(201).json(comment);
});

router.put('/:commentId', auth, (req, res) => {
  const comment = comments.find(c => c.id === Number(req.params.commentId));
  if (!comment) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (comment.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  comment.content = req.body.content || comment.content;
  comment.updatedAt = new Date().toISOString();
  return res.json(comment);
});

router.delete('/:commentId', auth, (req, res) => {
  const comment = comments.find(c => c.id === Number(req.params.commentId));
  if (!comment) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
  if (comment.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
  comment.deletedAt = new Date().toISOString();
  return res.status(204).end();
});

module.exports = router;
