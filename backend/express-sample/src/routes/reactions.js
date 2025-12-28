const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router({ mergeParams: true });

const reactions = new Map(); // key: `${postId}:${userId}` -> type

router.post('/', auth, (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  if (!['like', 'dislike'].includes(type)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
  const key = `${id}:${req.user.sub}`;
  reactions.set(key, type);
  return res.status(201).json({ postId: Number(id), user: req.user.sub, type });
});

router.delete('/', auth, (req, res) => {
  const { id } = req.params;
  const key = `${id}:${req.user.sub}`;
  reactions.delete(key);
  return res.status(204).end();
});

module.exports = router;
