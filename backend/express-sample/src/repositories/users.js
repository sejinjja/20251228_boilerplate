const db = require('./db');

function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function create(user) {
  return new Promise((resolve, reject) => {
    const { email, displayName, password, role = 'user' } = user;
    db.run(
      'INSERT INTO users (email, displayName, password, role) VALUES (?, ?, ?, ?)',
      [email, displayName, password, role],
      err => {
        if (err) return reject(err);
        resolve({ email, displayName, role });
      }
    );
  });
}

module.exports = { findByEmail, create };
