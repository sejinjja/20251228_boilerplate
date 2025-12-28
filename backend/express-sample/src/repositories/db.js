const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'forum.sqlite');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbFile);

// minimal migrations
const migrations = [
  `CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'free',
    isDefault INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    displayName TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    author TEXT NOT NULL,
    boardId INTEGER NOT NULL,
    publishStart TEXT,
    publishEnd TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT,
    deletedAt TEXT,
    FOREIGN KEY (boardId) REFERENCES boards(id)
  );`,
  "CREATE INDEX IF NOT EXISTS idx_posts_boardId ON posts(boardId);"
];

db.serialize(() => migrations.forEach(sql => db.run(sql, () => {})));

module.exports = db;
