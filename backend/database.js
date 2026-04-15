const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(path.join(__dirname, "earnx.db"));

// Enable WAL mode for better performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    username    TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    bio         TEXT NOT NULL DEFAULT 'Creator on EarnX.',
    country     TEXT NOT NULL DEFAULT 'Global',
    created_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    monetized  INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS follows (
    id           TEXT PRIMARY KEY,
    follower_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   INTEGER NOT NULL,
    UNIQUE(follower_id, following_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id           TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    created_at   INTEGER NOT NULL
  );
`);

// ─── ID generator ─────────────────────────────────────────────────────────────
function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    email: row.email,
    country: row.country,
    bio: row.bio,
    createdAt: row.created_at
  };
}

function mapPost(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    monetized: row.monetized === 1,
    createdAt: row.created_at
  };
}

function mapFollow(row) {
  if (!row) return null;
  return {
    id: row.id,
    followerId: row.follower_id,
    followingId: row.following_id
  };
}

function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    text: row.text,
    createdAt: row.created_at
  };
}

module.exports = { db, uid, mapUser, mapPost, mapFollow, mapMessage };
