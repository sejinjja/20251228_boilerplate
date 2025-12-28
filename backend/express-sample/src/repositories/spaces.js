const db = require('./db');

function list() {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT s.id, s.ownerId, u.username as username, s.createdAt, s.updatedAt
       FROM spaces s
       JOIN users u ON u.id = s.ownerId
       ORDER BY s.createdAt DESC`,
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

function findByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT s.id, s.ownerId, u.username as username, s.createdAt, s.updatedAt
       FROM spaces s
       JOIN users u ON u.id = s.ownerId
       WHERE u.username = ?`,
      [username],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function findByOwnerId(ownerId) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT s.id, s.ownerId, u.username as username, s.createdAt, s.updatedAt
       FROM spaces s
       JOIN users u ON u.id = s.ownerId
       WHERE s.ownerId = ?`,
      [ownerId],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function create({ ownerId }) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO spaces (ownerId) VALUES (?)', [ownerId], function (err) {
      if (err) return reject(err);
      findByOwnerId(ownerId).then(resolve).catch(reject);
    });
  });
}

async function ensureForUser({ ownerId }) {
  if (!ownerId) throw new Error('OWNER_REQUIRED');
  const existing = await findByOwnerId(ownerId);
  if (existing) return existing;
  return create({ ownerId });
}

module.exports = { list, findByUsername, findByOwnerId, ensureForUser, create };
