const db = require('./db');

function list({ page = 1, pageSize = 10 } = {}) {
  const size = Math.min(Math.max(Number(pageSize) || 10, 1), 50);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * size;
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, title, content, tags, author, createdAt, updatedAt FROM posts WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT ? OFFSET ?',
      [size, offset],
      (err, rows) => {
        if (err) return reject(err);
        const parsed = rows.map(r => ({ ...r, tags: r.tags ? JSON.parse(r.tags) : [] }));
        db.get('SELECT COUNT(*) as total FROM posts WHERE deletedAt IS NULL', (countErr, countRow) => {
          if (countErr) return reject(countErr);
          resolve({ data: parsed, total: countRow.total || 0, page: Math.max(Number(page) || 1, 1), pageSize: size });
        });
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, title, content, tags, author, createdAt, updatedAt, deletedAt FROM posts WHERE id = ?',
      [id],
      (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({ ...row, tags: row.tags ? JSON.parse(row.tags) : [] });
      }
    );
  });
}

function create({ title, content, tags = [], author }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO posts (title, content, tags, author) VALUES (?, ?, ?, ?)',
      [title, content, JSON.stringify(tags), author],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, title, content, tags, author, createdAt: new Date().toISOString() });
      }
    );
  });
}

function update(id, data) {
  return new Promise((resolve, reject) => {
    const { title, content, tags } = data;
    db.run(
      'UPDATE posts SET title = ?, content = ?, tags = ?, updatedAt = datetime(\'now\') WHERE id = ?',
      [title, content, JSON.stringify(tags), id],
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
