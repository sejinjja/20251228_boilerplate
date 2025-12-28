const db = require('./db');
const spacesRepo = require('./spaces');

function list({ page = 1, pageSize = 10, spaceId, includeUnpublished = false } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * size;
  const publishClause = includeUnpublished ? '' : 'AND p.isPublished = 1 AND (p.publishedAt IS NULL OR p.publishedAt <= datetime(\'now\'))';
  const where = ['p.deletedAt IS NULL'];
  const params = [];
  if (spaceId) {
    where.push('p.spaceId = ?');
    params.push(spaceId);
  }
  params.push(size, offset);
  const countParams = spaceId ? [spaceId] : [];
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.id, p.title, p.content, p.tags, p.authorId, p.spaceId, p.isPublished, p.publishedAt, p.createdAt, p.updatedAt,
              au.username as authorUsername, su.username as spaceUsername
       FROM posts p
       JOIN users au ON au.id = p.authorId
       JOIN spaces s ON s.id = p.spaceId
       JOIN users su ON su.id = s.ownerId
       WHERE ${where.join(' AND ')} ${publishClause}
       ORDER BY p.createdAt DESC
       LIMIT ? OFFSET ?`,
      params,
      (err, rows) => {
        if (err) return reject(err);
        const parsed = rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
        db.get(
          `SELECT COUNT(*) as total FROM posts p WHERE ${where.join(' AND ')} ${publishClause}`,
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
      `SELECT p.id, p.title, p.content, p.tags, p.authorId, p.spaceId, p.isPublished, p.publishedAt, p.createdAt, p.updatedAt, p.deletedAt,
              au.username as authorUsername, su.username as spaceUsername
       FROM posts p
       JOIN users au ON au.id = p.authorId
       JOIN spaces s ON s.id = p.spaceId
       JOIN users su ON su.id = s.ownerId
       WHERE p.id = ?`,
      [id],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({ ...row, tags: row.tags ? JSON.parse(row.tags) : [] });
      }
    );
  });
}

async function create({ title, content, tags = [], spaceId, authorId, isPublished = true, publishedAt = null }) {
  if (!spaceId) throw new Error('SPACE_REQUIRED');
  if (!authorId) throw new Error('AUTHOR_REQUIRED');
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (title, content, tags, authorId, spaceId, isPublished, publishedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, content, JSON.stringify(tags), authorId, spaceId, isPublished ? 1 : 0, publishedAt],
      function (err) {
        if (err) return reject(err);
        findById(this.lastID).then(resolve).catch(reject);
      }
    );
  });
}

function update(id, data) {
  const { title, content, tags, spaceId, isPublished, publishedAt } = data;
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE posts SET title = ?, content = ?, tags = ?, spaceId = ?, isPublished = ?, publishedAt = ?, updatedAt = datetime('now') WHERE id = ?",
      [title, content, JSON.stringify(tags), spaceId, isPublished ? 1 : 0, publishedAt, id],
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
