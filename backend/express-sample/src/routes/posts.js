const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const postsRepo = require('../repositories/posts');
const boardsRepo = require('../repositories/boards');
const router = express.Router({ mergeParams: true });

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

async function boardFromSlug(slug) {
  const board = await boardsRepo.findBySlug(slug);
  if (!board) throw Object.assign(new Error('BOARD_NOT_FOUND'), { status: 404 });
  return board;
}

function getUserFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try { return jwt.verify(authHeader.slice(7), jwtSecret); } catch { return null; }
}

function canSee(post, user) {
  if (!post || post.deletedAt) return false;
  const now = new Date();
  const start = post.publishStart ? new Date(post.publishStart) : null;
  const end = post.publishEnd ? new Date(post.publishEnd) : null;
  const within = (!start || start <= now) && (!end || end >= now);
  if (within) return true;
  if (user?.role === 'admin' || user?.sub === post.author) return true;
  return false;
}

// list posts under a board
router.get('/boards/:slug/posts', async (req, res, next) => {
  try {
    const board = await boardFromSlug(req.params.slug);
    const { page = 1, pageSize = 10 } = req.query;
    const user = getUserFromHeader(req);
    const includeUnpublished = user?.role === 'admin';
    const result = await postsRepo.list({ page, pageSize, boardId: board.id, includeUnpublished });
    return res.json({ board, ...result });
  } catch (err) { next(err); }
});

// get single post under board
router.get('/boards/:slug/posts/:id', async (req, res, next) => {
  try {
    const board = await boardFromSlug(req.params.slug);
    const post = await postsRepo.findById(req.params.id);
    const user = getUserFromHeader(req);
    if (!post || post.boardId !== board.id || !canSee(post, user)) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    return res.json({ board, ...post });
  } catch (err) { next(err); }
});

// create post in board
router.post('/boards/:slug/posts', auth, async (req, res, next) => {
  try {
    const board = await boardFromSlug(req.params.slug);
    if (board.type === 'notice' && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const { title, content, tags = [], publishStart, publishEnd } = req.body;
    if (!title || !content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
    const post = await postsRepo.create({
      title,
      content,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
      boardId: board.id,
      publishStart: publishStart || null,
      publishEnd: publishEnd || null,
      author: req.user.sub
    });
    return res.status(201).json({ board, ...post });
  } catch (err) { next(err); }
});

// update post
router.put('/boards/:slug/posts/:id', auth, async (req, res, next) => {
  try {
    const board = await boardFromSlug(req.params.slug);
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.boardId !== board.id || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    if (board.type === 'notice' && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const { title = post.title, content = post.content, tags = post.tags, publishStart = post.publishStart, publishEnd = post.publishEnd } = req.body;
    const updated = await postsRepo.update(req.params.id, {
      title,
      content,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
      boardId: board.id,
      publishStart: publishStart || null,
      publishEnd: publishEnd || null
    });
    return res.json({ board, ...updated });
  } catch (err) { next(err); }
});

// delete post
router.delete('/boards/:slug/posts/:id', auth, async (req, res, next) => {
  try {
    const board = await boardFromSlug(req.params.slug);
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.boardId !== board.id || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (board.type === 'notice' && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    if (post.author !== req.user.sub && req.user.role !== 'admin') return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    await postsRepo.softDelete(req.params.id);
    return res.status(204).end();
  } catch (err) { next(err); }
});

module.exports = router;
