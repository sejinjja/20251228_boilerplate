const db = require('./db');

function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, username, password, role, createdAt FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function findByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, username, password, role, createdAt FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, username, password, role, createdAt FROM users WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function updateUsername(email, username) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET username = ? WHERE email = ?', [username, email], err => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function create(user) {
  return new Promise((resolve, reject) => {
    const { email, username, password, role = 'user' } = user;
    db.run(
      'INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)',
      [email, username, password, role],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, email, username, role });
      }
    );
  });
}

module.exports = { findByEmail, findByUsername, findById, updateUsername, create };
