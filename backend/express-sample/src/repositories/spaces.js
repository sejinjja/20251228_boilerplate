const db = require('./db');

function slugify(text) {
  return (text || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'user';
}

function list() {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT id, ownerUsername, slug, title, bio, createdAt, updatedAt FROM spaces ORDER BY createdAt DESC',
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

function findBySlug(slug) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, ownerUsername, slug, title, bio, createdAt, updatedAt FROM spaces WHERE slug = ?',
      [slug],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function findByOwnerUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, ownerUsername, slug, title, bio, createdAt, updatedAt FROM spaces WHERE ownerUsername = ?',
      [username],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

async function create({ ownerUsername, slug, title, bio = '' }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO spaces (ownerUsername, slug, title, bio) VALUES (?, ?, ?, ?)',
      [ownerUsername, slug, title || slug, bio],
      function (err) {
        if (err) return reject(err);
        resolve({
          id: this.lastID,
          ownerUsername,
          slug,
          title: title || slug,
          bio,
          createdAt: new Date().toISOString()
        });
      }
    );
  });
}

async function ensureForUser({ username, displayName, desiredSlug, title, bio }) {
  const existing = await findByOwnerUsername(username);
  if (existing) {
    if (title || bio) {
      return update(existing.slug, { title: title || existing.title, bio: bio ?? existing.bio });
    }
    return existing;
  }
  const base = slugify(desiredSlug || username || displayName || 'user');
  let candidate = base;
  let suffix = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const taken = await findBySlug(candidate);
    if (!taken) break;
    candidate = `${base}-${suffix++}`;
  }
  return create({ ownerUsername: username, slug: candidate, title: displayName || candidate, bio });
}

async function update(slug, data) {
  const { title, bio } = data;
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE spaces SET title = ?, bio = ?, updatedAt = datetime(\'now\') WHERE slug = ?',
      [title, bio, slug],
      err => {
        if (err) return reject(err);
        findBySlug(slug).then(resolve).catch(reject);
      }
    );
  });
}

module.exports = { list, findBySlug, findByOwnerUsername, ensureForUser, create, update, slugify };
