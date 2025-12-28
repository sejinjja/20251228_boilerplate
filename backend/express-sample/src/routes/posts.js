const express = require('express');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const postsRepo = require('../repositories/posts');
const spacesRepo = require('../repositories/spaces');
const router = express.Router({ mergeParams: true });

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';

async function spaceFromSlug(slug) {
  const space = await spacesRepo.findBySlug(slug);
  if (!space) throw Object.assign(new Error('SPACE_NOT_FOUND'), { status: 404 });
  return space;
}

function getUserFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), jwtSecret);
  } catch {
    return null;
  }
}

function canSee(post, user) {
  if (!post || post.deletedAt) return false;
  if (post.isPublished) return true;
  if (user?.role === 'admin' || user?.username === post.authorUsername) return true;
  return false;
}

function isOwner(space, user) {
  return user && (user.role === 'admin' || user.username === space.ownerUsername);
}

// list posts under a space
router.get('/spaces/:slug/posts', async (req, res, next) => {
  try {
    const space = await spaceFromSlug(req.params.slug);
    const { page = 1, pageSize = 10 } = req.query;
    const user = getUserFromHeader(req);
    const includeUnpublished = isOwner(space, user);
    const result = await postsRepo.list({ page, pageSize, spaceSlug: space.slug, includeUnpublished });
    return res.json({ space, ...result });
  } catch (err) {
    next(err);
  }
});

// get single post under space
router.get('/spaces/:slug/posts/:id', async (req, res, next) => {
  try {
    const space = await spaceFromSlug(req.params.slug);
    const post = await postsRepo.findById(req.params.id);
    const user = getUserFromHeader(req);
    if (!post || post.spaceSlug !== space.slug || !canSee(post, user)) {
      return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    }
    return res.json({ space, ...post });
  } catch (err) {
    next(err);
  }
});

// create post in space
router.post('/spaces/:slug/posts', auth, async (req, res, next) => {
  try {
    const space = await spaceFromSlug(req.params.slug);
    if (!isOwner(space, req.user)) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const { title, content, tags = [], isPublished = true, publishedAt = null } = req.body;
    if (!title || !content) return res.status(400).json({ error: { code: 'VALIDATION_ERROR' } });
    const post = await postsRepo.create({
      title,
      content,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
      spaceSlug: space.slug,
      authorUsername: req.user.username,
      isPublished,
      publishedAt
    });
      return res.status(201).json({ space, ...post });
  } catch (err) {
    next(err);
  }
});

// update post
router.put('/spaces/:slug/posts/:id', auth, async (req, res, next) => {
  try {
    const space = await spaceFromSlug(req.params.slug);
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.spaceSlug !== space.slug || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (!isOwner(space, req.user) && post.authorUsername !== req.user.username) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    const {
      title = post.title,
      content = post.content,
      tags = post.tags,
      isPublished = post.isPublished,
      publishedAt = post.publishedAt
    } = req.body;
    const updated = await postsRepo.update(req.params.id, {
      title,
      content,
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
      spaceSlug: space.slug,
      isPublished,
      publishedAt
    });
    return res.json({ space, ...updated });
  } catch (err) {
    next(err);
  }
});

// delete post
router.delete('/spaces/:slug/posts/:id', auth, async (req, res, next) => {
  try {
    const space = await spaceFromSlug(req.params.slug);
    const post = await postsRepo.findById(req.params.id);
    if (!post || post.spaceSlug !== space.slug || post.deletedAt) return res.status(404).json({ error: { code: 'NOT_FOUND' } });
    if (!isOwner(space, req.user) && post.authorUsername !== req.user.username) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    await postsRepo.softDelete(req.params.id);
    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
