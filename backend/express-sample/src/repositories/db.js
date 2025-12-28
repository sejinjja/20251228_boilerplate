const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'forum.sqlite');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    displayName TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt TEXT DEFAULT (datetime('now'))
  );`);
  db.run(`CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    author TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT,
    deletedAt TEXT
  );`);
});

module.exports = db;
