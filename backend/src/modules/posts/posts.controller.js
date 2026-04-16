const db = require("../../config/db");
const { uid, paginate, paginationMeta } = require("../../utils");

function canAccessPost(post, userId) {
  if (!post.is_premium) return true;
  if (!userId) return false;
  if (post.creator_id === userId) return true;
  const sub = db.prepare(
    "SELECT id FROM subscriptions WHERE creator_id=? AND fan_id=? AND status='active'"
  ).get(post.creator_id, userId);
  return !!sub;
}

// GET /api/posts/feed
exports.getFeed = (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req);
    const total = db.prepare(
      "SELECT COUNT(*) as n FROM posts p JOIN follows f ON f.following_id=p.creator_id WHERE f.follower_id=?"
    ).get(req.userId).n;
    const posts = db.prepare(
      `SELECT p.*, u.name, u.username, u.avatar_url, u.verified
       FROM posts p
       JOIN follows f ON f.following_id=p.creator_id
       JOIN users  u ON u.id=p.creator_id
       WHERE f.follower_id=?
       ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
    ).all(req.userId, limit, offset);

    res.json({ data: posts, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// POST /api/posts
exports.createPost = (req, res, next) => {
  try {
    const caption       = String(req.body.caption    || "").trim();
    const media_type    = req.body.media_type || null;
    const media_url     = req.body.media_url  || null;
    const thumbnail_url = req.body.thumbnail_url || null;
    const is_premium    = req.body.is_premium ? 1 : 0;

    if (!caption && !media_url)
      return res.status(400).json({ error: "Caption or media is required." });

    const postId = uid();
    const now    = Date.now();
    db.prepare(
      "INSERT INTO posts (id,creator_id,caption,media_type,media_url,thumbnail_url,is_premium,likes_count,comments_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?,0,0,?,?)"
    ).run(postId, req.userId, caption, media_type, media_url, thumbnail_url, is_premium, now, now);

    // Boost creator's recommendation score for new content
    db.prepare("UPDATE profiles SET recommendation_score=recommendation_score+1,updated_at=? WHERE user_id=?").run(now, req.userId);

    const post = db.prepare("SELECT * FROM posts WHERE id=?").get(postId);
    res.status(201).json({ data: post });
  } catch (err) { next(err); }
};

// GET /api/posts/:postId
exports.getPost = (req, res, next) => {
  try {
    const post = db.prepare(
      "SELECT p.*, u.name, u.username, u.avatar_url, u.verified FROM posts p JOIN users u ON u.id=p.creator_id WHERE p.id=?"
    ).get(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found." });
    if (!canAccessPost(post, req.userId))
      return res.status(403).json({ error: "This is premium content. Subscribe to access." });

    post.liked_by_me = req.userId
      ? !!db.prepare("SELECT id FROM post_likes WHERE post_id=? AND user_id=?").get(post.id, req.userId)
      : false;

    res.json({ data: post });
  } catch (err) { next(err); }
};

// PATCH /api/posts/:postId
exports.updatePost = (req, res, next) => {
  try {
    const post = db.prepare("SELECT * FROM posts WHERE id=?").get(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found." });
    if (post.creator_id !== req.userId && req.userRole !== "admin")
      return res.status(403).json({ error: "Not authorized." });

    const updates = [];
    const params  = [];
    if (req.body.caption    !== undefined) { updates.push("caption=?");    params.push(String(req.body.caption).trim()); }
    if (req.body.is_premium !== undefined) { updates.push("is_premium=?"); params.push(req.body.is_premium ? 1 : 0); }
    if (!updates.length) return res.status(400).json({ error: "Nothing to update." });

    updates.push("updated_at=?");
    params.push(Date.now(), req.params.postId);
    db.prepare(`UPDATE posts SET ${updates.join(",")} WHERE id=?`).run(...params);
    res.json({ data: db.prepare("SELECT * FROM posts WHERE id=?").get(req.params.postId) });
  } catch (err) { next(err); }
};

// DELETE /api/posts/:postId
exports.deletePost = (req, res, next) => {
  try {
    const post = db.prepare("SELECT creator_id FROM posts WHERE id=?").get(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found." });
    if (post.creator_id !== req.userId && req.userRole !== "admin")
      return res.status(403).json({ error: "Not authorized." });

    db.prepare("DELETE FROM posts WHERE id=?").run(req.params.postId);
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
};

// POST /api/posts/:postId/like
exports.likePost = (req, res, next) => {
  try {
    const post = db.prepare("SELECT id FROM posts WHERE id=?").get(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found." });
    if (db.prepare("SELECT id FROM post_likes WHERE post_id=? AND user_id=?").get(post.id, req.userId))
      return res.status(409).json({ error: "Already liked." });

    db.transaction(() => {
      db.prepare("INSERT INTO post_likes (id,post_id,user_id,created_at) VALUES (?,?,?,?)").run(uid(), post.id, req.userId, Date.now());
      db.prepare("UPDATE posts SET likes_count=likes_count+1 WHERE id=?").run(post.id);
    })();

    res.json({ data: { liked: true } });
  } catch (err) { next(err); }
};

// DELETE /api/posts/:postId/like
exports.unlikePost = (req, res, next) => {
  try {
    const result = db.prepare("DELETE FROM post_likes WHERE post_id=? AND user_id=?").run(req.params.postId, req.userId);
    if (!result.changes) return res.status(404).json({ error: "Like not found." });
    db.prepare("UPDATE posts SET likes_count=MAX(0,likes_count-1) WHERE id=?").run(req.params.postId);
    res.json({ data: { liked: false } });
  } catch (err) { next(err); }
};

// GET /api/posts/:postId/comments
exports.getComments = (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req);
    const total = db.prepare("SELECT COUNT(*) as n FROM comments WHERE post_id=?").get(req.params.postId).n;
    const rows  = db.prepare(
      "SELECT c.*, u.name, u.username, u.avatar_url FROM comments c JOIN users u ON u.id=c.user_id WHERE c.post_id=? ORDER BY c.created_at ASC LIMIT ? OFFSET ?"
    ).all(req.params.postId, limit, offset);
    res.json({ data: rows, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// POST /api/posts/:postId/comments
exports.addComment = (req, res, next) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Comment text is required." });

    const post = db.prepare("SELECT id FROM posts WHERE id=?").get(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found." });

    const commentId = uid();
    const now = Date.now();
    db.prepare("INSERT INTO comments (id,post_id,user_id,text,created_at) VALUES (?,?,?,?,?)").run(commentId, post.id, req.userId, text, now);
    db.prepare("UPDATE posts SET comments_count=comments_count+1 WHERE id=?").run(post.id);

    const comment = db.prepare(
      "SELECT c.*, u.name, u.username, u.avatar_url FROM comments c JOIN users u ON u.id=c.user_id WHERE c.id=?"
    ).get(commentId);
    res.status(201).json({ data: comment });
  } catch (err) { next(err); }
};

// DELETE /api/posts/:postId/comments/:commentId
exports.deleteComment = (req, res, next) => {
  try {
    const comment = db.prepare("SELECT * FROM comments WHERE id=? AND post_id=?").get(req.params.commentId, req.params.postId);
    if (!comment) return res.status(404).json({ error: "Comment not found." });
    if (comment.user_id !== req.userId && req.userRole !== "admin")
      return res.status(403).json({ error: "Not authorized." });

    db.prepare("DELETE FROM comments WHERE id=?").run(req.params.commentId);
    db.prepare("UPDATE posts SET comments_count=MAX(0,comments_count-1) WHERE id=?").run(req.params.postId);
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
};
