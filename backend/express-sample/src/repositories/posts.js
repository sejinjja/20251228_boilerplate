const db = require('./db');
const spacesRepo = require('./spaces');

function list({ page = 1, pageSize = 10, spaceSlug, includeUnpublished = false } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * size;
  const publishClause = includeUnpublished ? '' : 'AND isPublished = 1 AND (publishedAt IS NULL OR publishedAt <= datetime(\'now\'))';
  const params = [];
  const where = ['deletedAt IS NULL'];
  if (spaceSlug) {
    where.push('spaceSlug = ?');
    params.push(spaceSlug);
  }
  params.push(size, offset);
  const countParams = spaceSlug ? [spaceSlug] : [];
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, content, tags, authorUsername, spaceSlug, slug, isPublished, publishedAt, createdAt, updatedAt
       FROM posts
       WHERE ${where.join(' AND ')} ${publishClause}
       ORDER BY createdAt DESC
       LIMIT ? OFFSET ?`,
      params,
      (err, rows) => {
        if (err) return reject(err);
        const parsed = rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
        db.get(
          `SELECT COUNT(*) as total FROM posts WHERE ${where.join(' AND ')} ${publishClause}`,
          countParams,
          (countErr, countRow) => {
            if (countErr) return reject(countErr);
            resolve({ data: parsed, total: countRow?.total || 0, page: Math.max(Number(page) || 1, 1), pageSize: size });
          }
        );
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT id, title, content, tags, authorUsername, spaceSlug, slug, isPublished, publishedAt, createdAt, updatedAt, deletedAt
       FROM posts WHERE id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({ ...row, tags: row.tags ? JSON.parse(row.tags) : [] });
      }
    );
  });
}

function slugify(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'post';
}

async function nextSlug(spaceSlug, title) {
  const base = slugify(title);
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM posts WHERE spaceSlug = ? AND slug = ?', [spaceSlug, candidate], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
    if (!existing) break;
    candidate = `${base}-${suffix++}`;
  }
  return candidate;
}

async function create({ title, content, tags = [], spaceSlug, authorUsername, isPublished = true, publishedAt = null }) {
  if (!spaceSlug) throw new Error('SPACE_REQUIRED');
  const postSlug = await nextSlug(spaceSlug, title);
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (title, content, tags, authorUsername, spaceSlug, slug, isPublished, publishedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, JSON.stringify(tags), authorUsername, spaceSlug, postSlug, isPublished ? 1 : 0, publishedAt],
      function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          title,
          content,
          tags,
          authorUsername,
          spaceSlug,
          slug: postSlug,
          isPublished: isPublished ? 1 : 0,
          publishedAt,
          createdAt: new Date().toISOString()
        });
      }
    );
  });
}

function update(id, data) {
  const { title, content, tags, spaceSlug, isPublished, publishedAt } = data;
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE posts SET title = ?, content = ?, tags = ?, spaceSlug = ?, isPublished = ?, publishedAt = ?, updatedAt = datetime('now') WHERE id = ?",
      [title, content, JSON.stringify(tags), spaceSlug, isPublished ? 1 : 0, publishedAt, id],
      err => {
        if (err) return reject(err);
        findById(id).then(resolve).catch(reject);
      }
    );
  });
}

function softDelete(id) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE posts SET deletedAt = datetime('now') WHERE id = ?", [id], err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { list, findById, create, update, softDelete };
