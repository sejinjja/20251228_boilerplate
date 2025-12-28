const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const postsRepo = require('../repositories/posts');
const boardsRepo = require('../repositories/boards');
const router = express.Router();

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

function getUserFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, jwtSecret);
  } catch (err) {
    return null;
  }
}

function isVisible(post, user) {
  if (!post || post.deletedAt) return false;
  const now = new Date();
  const start = post.publishStart ? new Date(post.publishStart) : null;
  const end = post.publishEnd ? new Date(post.publishEnd) : null;
  const withinWindow = (!start || start <= now) && (!end || end >= now);
  if (withinWindow) return true;
  if (user?.role === 'admin' || user?.sub === post.author) return true;
  return false;
}

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 10, boardType, boardId, boardSlug } = req.query;
    const user = getUserFromHeader(req);
    const includeUnpublished = user?.role === 'admin';
    let targetBoardId = boardId;
    if (!targetBoardId && boardSlug) {
      const board = await boardsRepo.findBySlug(boardSlug);
      targetBoardId = board?.id;
    }
    const result = await postsRepo.list({ page, pageSize, boardType, boardId: targetBoardId, includeUnpublished });
    return res.json(result);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const user = getUserFromHeader(req);
    const post = await postsRepo.findById(req.params.id);
    if (!isVisible(post, user)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return res.json(post);
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { title, content, tags = [], boardType = 'free', boardId, publishStart, publishEnd } = req.body;
    if (!title || !content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
    if (!['notice', 'free'].includes(boardType)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'boardType must be notice|free' } });
    if (boardType === 'notice' && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'only admin can post notice' } });
    const trimmedTags = Array.isArray(tags) ? tags.slice(0, 5) : [];
    const post = await postsRepo.create({
      title,
      content,
      tags: trimmedTags,
      boardType,
      boardId,
      publishStart: publishStart || null,
      publishEnd: publishEnd || null,
      author: req.user.sub
    });
    return res.status(201).json(post);
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const { title = post.title, content = post.content, tags = post.tags, boardType = post.boardType, boardId = post.boardId, publishStart = post.publishStart, publishEnd = post.publishEnd } = req.body;
    if (!['notice', 'free'].includes(boardType)) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'boardType must be notice|free' } });
    if (boardType === 'notice' && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'only admin can update notice' } });
    const updated = await postsRepo.update(req.params.id, {
      title,
      content,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
      boardType,
      boardId,
      publishStart: publishStart || null,
      publishEnd: publishEnd || null
    });
    return res.json(updated);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (post.boardType === 'notice' && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'only admin can delete notice' } });
    if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    await postsRepo.softDelete(req.params.id);
    return res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
