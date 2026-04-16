const db = require("../config/db");

db.exec(`
  -- ── Users ────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS users (
    id               TEXT PRIMARY KEY,
    name             TEXT NOT NULL,
    username         TEXT UNIQUE NOT NULL,
    email            TEXT UNIQUE NOT NULL,
    password_hash    TEXT NOT NULL,
    role             TEXT NOT NULL DEFAULT 'fan',     -- 'creator' | 'fan' | 'admin'
    avatar_url       TEXT,
    bio              TEXT,
    verified         INTEGER NOT NULL DEFAULT 0,
    followers_count  INTEGER NOT NULL DEFAULT 0,
    following_count  INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER NOT NULL,
    updated_at       INTEGER NOT NULL
  );

  -- ── Profiles ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS profiles (
    id                   TEXT PRIMARY KEY,
    user_id              TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cover_url            TEXT,
    category             TEXT,
    tags                 TEXT DEFAULT '[]',            -- JSON array
    is_trending          INTEGER NOT NULL DEFAULT 0,
    recommendation_score REAL    NOT NULL DEFAULT 0,
    country              TEXT,
    website              TEXT,
    social_links         TEXT DEFAULT '{}',            -- JSON
    public_metadata      TEXT DEFAULT '{}',            -- JSON
    created_at           INTEGER NOT NULL,
    updated_at           INTEGER NOT NULL
  );

  -- ── Follows ───────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS follows (
    id           TEXT PRIMARY KEY,
    follower_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   INTEGER NOT NULL,
    UNIQUE(follower_id, following_id)
  );

  -- ── Posts ─────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS posts (
    id             TEXT PRIMARY KEY,
    creator_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    caption        TEXT,
    media_type     TEXT,                               -- 'image' | 'video' | 'audio' | null
    media_url      TEXT,
    thumbnail_url  TEXT,
    is_premium     INTEGER NOT NULL DEFAULT 0,
    likes_count    INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );

  -- ── Post Likes ────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS post_likes (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    UNIQUE(post_id, user_id)
  );

  -- ── Comments ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS comments (
    id         TEXT PRIMARY KEY,
    post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text       TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  -- ── Media ─────────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS media (
    id            TEXT PRIMARY KEY,
    owner_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,                       -- 'image' | 'video' | 'audio'
    url           TEXT NOT NULL,
    thumbnail_url TEXT,
    is_premium    INTEGER NOT NULL DEFAULT 0,
    visibility    TEXT NOT NULL DEFAULT 'public',      -- 'public' | 'subscribers' | 'private'
    size_bytes    INTEGER,
    mime_type     TEXT,
    created_at    INTEGER NOT NULL
  );

  -- ── Conversations ─────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS conversations (
    id              TEXT PRIMARY KEY,
    last_message_id TEXT,
    created_at      INTEGER NOT NULL,
    updated_at      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at       INTEGER NOT NULL,
    PRIMARY KEY(conversation_id, user_id)
  );

  -- ── Messages ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text            TEXT NOT NULL,
    is_read         INTEGER NOT NULL DEFAULT 0,
    created_at      INTEGER NOT NULL
  );

  -- ── Subscriptions ─────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS subscriptions (
    id         TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fan_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan       TEXT NOT NULL DEFAULT 'basic',          -- 'basic' | 'premium' | 'vip'
    status     TEXT NOT NULL DEFAULT 'active',         -- 'active' | 'cancelled' | 'expired'
    started_at INTEGER NOT NULL,
    expires_at INTEGER,
    created_at INTEGER NOT NULL,
    UNIQUE(creator_id, fan_id)
  );

  CREATE TABLE IF NOT EXISTS subscription_plans (
    id           TEXT PRIMARY KEY,
    creator_id   TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    basic_price  REAL NOT NULL DEFAULT 4.99,
    premium_price REAL NOT NULL DEFAULT 9.99,
    vip_price    REAL NOT NULL DEFAULT 19.99,
    currency     TEXT NOT NULL DEFAULT 'USD',
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );

  -- ── Wallets ───────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS wallets (
    id         TEXT PRIMARY KEY,
    user_id    TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available  REAL NOT NULL DEFAULT 0,
    pending    REAL NOT NULL DEFAULT 0,
    reserved   REAL NOT NULL DEFAULT 0,
    paid_out   REAL NOT NULL DEFAULT 0,
    currency   TEXT NOT NULL DEFAULT 'USD',
    updated_at INTEGER NOT NULL
  );

  -- ── Transactions ──────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS transactions (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         TEXT NOT NULL,    -- 'subscription' | 'tip' | 'tip_received' | 'payout' | 'refund' | 'fee'
    amount       REAL NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'completed' | 'failed' | 'refunded'
    source       TEXT,
    reference_id TEXT,
    metadata     TEXT DEFAULT '{}',
    created_at   INTEGER NOT NULL
  );

  -- ── Settings ──────────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS user_settings (
    user_id                TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme                  TEXT    NOT NULL DEFAULT 'dark',
    email_notifications    INTEGER NOT NULL DEFAULT 1,
    push_notifications     INTEGER NOT NULL DEFAULT 1,
    new_follower_notif     INTEGER NOT NULL DEFAULT 1,
    new_message_notif      INTEGER NOT NULL DEFAULT 1,
    new_subscriber_notif   INTEGER NOT NULL DEFAULT 1,
    profile_public         INTEGER NOT NULL DEFAULT 1,
    show_online_status     INTEGER NOT NULL DEFAULT 1,
    allow_messages         TEXT    NOT NULL DEFAULT 'all', -- 'all' | 'subscribers' | 'none'
    updated_at             INTEGER NOT NULL
  );

  -- ── Auth tokens ───────────────────────────────────────────────────────────
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  -- ── Indexes ───────────────────────────────────────────────────────────────
  CREATE INDEX IF NOT EXISTS idx_posts_creator      ON posts(creator_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_follows_follower   ON follows(follower_id);
  CREATE INDEX IF NOT EXISTS idx_follows_following  ON follows(following_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conv      ON messages(conversation_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_txns_user          ON transactions(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_subs_creator       ON subscriptions(creator_id, status);
  CREATE INDEX IF NOT EXISTS idx_subs_fan           ON subscriptions(fan_id, status);
  CREATE INDEX IF NOT EXISTS idx_profiles_score     ON profiles(recommendation_score DESC);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens     ON refresh_tokens(token_hash);
`);

module.exports = db;
