const db = require('./db');

function list() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name, slug, type, isDefault, createdAt FROM boards ORDER BY isDefault DESC, createdAt ASC', (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, slug, type, isDefault FROM boards WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function findBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, name, slug, type, isDefault FROM boards WHERE slug = ?', [slug], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function create({ name, slug, type = 'free', isDefault = 0 }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO boards (name, slug, type, isDefault) VALUES (?, ?, ?, ?)',
      [name, slug, type, isDefault ? 1 : 0],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, name, slug, type, isDefault: isDefault ? 1 : 0 });
      }
    );
  });
}

async function ensureDefaults() {
  const existing = await list();
  if (existing.length > 0) return existing;
  await create({ name: '자유게시판', slug: 'free', type: 'free', isDefault: 1 });
  await create({ name: '공지사항', slug: 'notice', type: 'notice', isDefault: 0 });
  await create({ name: '중고거래', slug: 'trade', type: 'free', isDefault: 0 });
  return list();
}

module.exports = { list, findById, findBySlug, create, ensureDefaults };
