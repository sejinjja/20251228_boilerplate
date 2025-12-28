const db = require('./db');
const boardsRepo = require('./boards');

async function list({ page = 1, pageSize = 10, boardType, boardId, includeUnpublished = false } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * size;
  const nowClause = includeUnpublished ? '' : "AND (publishStart IS NULL OR publishStart <= datetime('now')) AND (publishEnd IS NULL OR publishEnd >= datetime('now'))";
  const boardClause = boardType ? 'AND boardType = ?' : '';
  const boardFilterClause = boardId ? 'AND boardId = ?' : '';
  const params = [];
  if (boardType) params.push(boardType);
  if (boardId) params.push(boardId);
  params.push(size, offset);
  const countParams = [];
  if (boardType) countParams.push(boardType);
  if (boardId) countParams.push(boardId);
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT id, title, content, tags, author, boardType, boardId, publishStart, publishEnd, createdAt, updatedAt
       FROM posts
       WHERE deletedAt IS NULL ${boardClause} ${boardFilterClause} ${nowClause}
       ORDER BY boardType DESC, createdAt DESC
       LIMIT ? OFFSET ?`,
      params,
      (err, rows) => {
        if (err) return reject(err);
        const parsed = rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
        db.get(
          `SELECT COUNT(*) as total FROM posts WHERE deletedAt IS NULL ${boardClause} ${boardFilterClause} ${nowClause}`,
          countParams,
          (countErr, countRow) => {
            if (countErr) return reject(countErr);
            resolve({ data: parsed, total: countRow.total || 0, page: Math.max(Number(page) || 1, 1), pageSize: size });
          }
        );
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, title, content, tags, author, boardType, boardId, publishStart, publishEnd, createdAt, updatedAt, deletedAt FROM posts WHERE id = ?',
      [id],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({ ...row, tags: row.tags ? JSON.parse(row.tags) : [] });
      }
    );
  });
}

async function create({ title, content, tags = [], boardType = 'free', boardId, publishStart, publishEnd, author }) {
  let targetBoardId = boardId;
  if (!targetBoardId) {
    const boards = await boardsRepo.ensureDefaults();
    const defaultBoard = boards.find(b => b.slug === boardType) || boards.find(b => b.isDefault);
    targetBoardId = defaultBoard?.id;
  }
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (title, content, tags, author, boardType, boardId, publishStart, publishEnd) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, content, JSON.stringify(tags), author, boardType, targetBoardId || null, publishStart || null, publishEnd || null],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, title, content, tags, author, boardType, boardId: targetBoardId || null, publishStart, publishEnd, createdAt: new Date().toISOString() });
      }
    );
  });
}

function update(id, data) {
  return new Promise((resolve, reject) => {
    const { title, content, tags, boardType, boardId, publishStart, publishEnd } = data;
    db.run(
      "UPDATE posts SET title = ?, content = ?, tags = ?, boardType = ?, boardId = ?, publishStart = ?, publishEnd = ?, updatedAt = datetime('now') WHERE id = ?",
      [title, content, JSON.stringify(tags), boardType, boardId || null, publishStart || null, publishEnd || null, id],
      err => {
        if (err) return reject(err);
        findById(id).then(resolve).catch(reject);
      }
    );
  });
}

function softDelete(id) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE posts SET deletedAt = datetime(\'now\') WHERE id = ?', [id], err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { list, findById, create, update, softDelete };
