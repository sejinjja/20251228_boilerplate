const db = require('./db');

function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function findByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function create(user) {
  return new Promise((resolve, reject) => {
    const { email, username, displayName, password, role = 'user' } = user;
    db.run(
      'INSERT INTO users (email, username, displayName, password, role) VALUES (?, ?, ?, ?, ?)',
      [email, username, displayName, password, role],
      err => {
        if (err) return reject(err);
        resolve({ email, username, displayName, role });
      }
    );
  });
}

module.exports = { findByEmail, findByUsername, create };
