const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'spaces_v5.sqlite');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbFile);

// minimal migrations
const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerId INTEGER NOT NULL UNIQUE,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (ownerId) REFERENCES users(id)
  );`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    authorId INTEGER NOT NULL,
    spaceId INTEGER NOT NULL,
    isPublished INTEGER DEFAULT 1,
    publishedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT,
    deletedAt TEXT,
    FOREIGN KEY (spaceId) REFERENCES spaces(id),
    FOREIGN KEY (authorId) REFERENCES users(id)
  );`,
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_spaces_ownerId ON spaces(ownerId);",
  "CREATE INDEX IF NOT EXISTS idx_posts_spaceId ON posts(spaceId);",
  "CREATE INDEX IF NOT EXISTS idx_posts_authorId ON posts(authorId);"
];

db.serialize(() => migrations.forEach(sql => db.run(sql, () => {})));

module.exports = db;
