const db = require("../../config/db");
const { uid, safeUser, paginate, paginationMeta } = require("../../utils");

// GET /api/users/me
exports.getMe = (req, res, next) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ data: safeUser(user) });
  } catch (err) { next(err); }
};

// PATCH /api/users/me
exports.updateMe = (req, res, next) => {
  try {
    const name       = req.body.name       !== undefined ? String(req.body.name).trim()   : undefined;
    const bio        = req.body.bio        !== undefined ? String(req.body.bio).trim()    : undefined;
    const avatar_url = req.body.avatar_url !== undefined ? String(req.body.avatar_url)    : undefined;

    const updates = [];
    const params  = [];
    if (name       !== undefined) { updates.push("name=?");       params.push(name); }
    if (bio        !== undefined) { updates.push("bio=?");        params.push(bio); }
    if (avatar_url !== undefined) { updates.push("avatar_url=?"); params.push(avatar_url); }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update." });

    updates.push("updated_at=?");
    params.push(Date.now(), req.userId);

    db.prepare(`UPDATE users SET ${updates.join(",")} WHERE id=?`).run(...params);
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.userId);
    res.json({ data: safeUser(user) });
  } catch (err) { next(err); }
};

// GET /api/users/:username
exports.getByUsername = (req, res, next) => {
  try {
    const user = db.prepare(
      "SELECT u.*, p.cover_url, p.category, p.tags, p.is_trending, p.recommendation_score, p.country, p.website, p.social_links FROM users u LEFT JOIN profiles p ON p.user_id=u.id WHERE u.username=?"
    ).get(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found." });

    const safe = safeUser(user);
    if (req.userId) {
      safe.is_following = !!db.prepare(
        "SELECT id FROM follows WHERE follower_id=? AND following_id=?"
      ).get(req.userId, user.id);
    }
    res.json({ data: safe });
  } catch (err) { next(err); }
};

// GET /api/users/:username/posts
exports.getUserPosts = (req, res, next) => {
  try {
    const user = db.prepare("SELECT id FROM users WHERE username=?").get(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found." });

    const { page, limit, offset } = paginate(req);
    const isOwner = req.userId === user.id;
    const filter  = isOwner ? "" : "AND is_premium=0";

    const total = db.prepare(`SELECT COUNT(*) as n FROM posts WHERE creator_id=? ${filter}`).get(user.id).n;
    const posts = db.prepare(
      `SELECT * FROM posts WHERE creator_id=? ${filter} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(user.id, limit, offset);

    res.json({ data: posts, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// GET /api/users/:username/followers
exports.getFollowers = (req, res, next) => {
  try {
    const user = db.prepare("SELECT id FROM users WHERE username=?").get(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found." });

    const { page, limit, offset } = paginate(req);
    const total = db.prepare("SELECT COUNT(*) as n FROM follows WHERE following_id=?").get(user.id).n;
    const rows  = db.prepare(
      "SELECT u.id,u.name,u.username,u.avatar_url,u.verified,u.role FROM users u JOIN follows f ON f.follower_id=u.id WHERE f.following_id=? ORDER BY f.created_at DESC LIMIT ? OFFSET ?"
    ).all(user.id, limit, offset);

    res.json({ data: rows, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// GET /api/users/:username/following
exports.getFollowing = (req, res, next) => {
  try {
    const user = db.prepare("SELECT id FROM users WHERE username=?").get(req.params.username);
    if (!user) return res.status(404).json({ error: "User not found." });

    const { page, limit, offset } = paginate(req);
    const total = db.prepare("SELECT COUNT(*) as n FROM follows WHERE follower_id=?").get(user.id).n;
    const rows  = db.prepare(
      "SELECT u.id,u.name,u.username,u.avatar_url,u.verified,u.role FROM users u JOIN follows f ON f.following_id=u.id WHERE f.follower_id=? ORDER BY f.created_at DESC LIMIT ? OFFSET ?"
    ).all(user.id, limit, offset);

    res.json({ data: rows, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// POST /api/users/:userId/follow
exports.follow = (req, res, next) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.userId) return res.status(400).json({ error: "Cannot follow yourself." });

    const target = db.prepare("SELECT id FROM users WHERE id=?").get(targetId);
    if (!target) return res.status(404).json({ error: "User not found." });

    if (db.prepare("SELECT id FROM follows WHERE follower_id=? AND following_id=?").get(req.userId, targetId))
      return res.status(409).json({ error: "Already following." });

    db.transaction(() => {
      db.prepare("INSERT INTO follows (id,follower_id,following_id,created_at) VALUES (?,?,?,?)").run(uid(), req.userId, targetId, Date.now());
      db.prepare("UPDATE users SET followers_count=followers_count+1 WHERE id=?").run(targetId);
      db.prepare("UPDATE users SET following_count=following_count+1 WHERE id=?").run(req.userId);
      // Boost recommendation score
      db.prepare("UPDATE profiles SET recommendation_score=recommendation_score+2,updated_at=? WHERE user_id=?").run(Date.now(), targetId);
    })();

    res.json({ data: { following: true } });
  } catch (err) { next(err); }
};

// DELETE /api/users/:userId/follow
exports.unfollow = (req, res, next) => {
  try {
    const targetId = req.params.userId;
    const result   = db.prepare("DELETE FROM follows WHERE follower_id=? AND following_id=?").run(req.userId, targetId);
    if (!result.changes) return res.status(404).json({ error: "Not following that user." });

    db.prepare("UPDATE users SET followers_count=MAX(0,followers_count-1) WHERE id=?").run(targetId);
    db.prepare("UPDATE users SET following_count=MAX(0,following_count-1) WHERE id=?").run(req.userId);
    db.prepare("UPDATE profiles SET recommendation_score=MAX(0,recommendation_score-2),updated_at=? WHERE user_id=?").run(Date.now(), targetId);

    res.json({ data: { following: false } });
  } catch (err) { next(err); }
};
