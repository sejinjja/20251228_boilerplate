const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', '..', 'data');
const dbFile = process.env.DATABASE_FILE || path.join(dataDir, 'spaces_v3.sqlite');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new sqlite3.Database(dbFile);

// minimal migrations
const migrations = [
  `CREATE TABLE IF NOT EXISTS users (
    email TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    displayName TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt TEXT DEFAULT (datetime('now'))
  );`,
  `CREATE TABLE IF NOT EXISTS spaces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ownerUsername TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    title TEXT,
    bio TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT,
    FOREIGN KEY (ownerUsername) REFERENCES users(username)
  );`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT,
    authorUsername TEXT NOT NULL,
    spaceSlug TEXT NOT NULL,
    slug TEXT NOT NULL,
    isPublished INTEGER DEFAULT 1,
    publishedAt TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT,
    deletedAt TEXT,
    FOREIGN KEY (spaceSlug) REFERENCES spaces(slug),
    FOREIGN KEY (authorUsername) REFERENCES users(username)
  );`,
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_spaces_slug ON spaces(slug);",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_spaces_owner_username ON spaces(ownerUsername);",
  "CREATE INDEX IF NOT EXISTS idx_posts_spaceSlug ON posts(spaceSlug);",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_posts_space_slug ON posts(spaceSlug, slug);"
];

db.serialize(() => migrations.forEach(sql => db.run(sql, () => {})));

module.exports = db;
