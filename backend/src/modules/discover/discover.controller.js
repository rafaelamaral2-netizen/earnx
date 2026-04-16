const db = require("../../config/db");
const { paginate, paginationMeta, parseJSON } = require("../../utils");

// GET /api/discover/trending
exports.getTrending = (req, res, next) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const rows = db.prepare(
      `SELECT u.id, u.name, u.username, u.avatar_url, u.verified, u.role,
              u.followers_count,
              p.category, p.tags, p.is_trending, p.recommendation_score, p.country, p.cover_url
       FROM users u
       JOIN profiles p ON p.user_id=u.id
       WHERE u.role='creator' AND p.recommendation_score > 0
       ORDER BY p.recommendation_score DESC
       LIMIT ?`
    ).all(limit);

    const enriched = rows.map(r => ({
      ...r,
      tags: parseJSON(r.tags, []),
      is_trending: r.is_trending === 1,
      post_count: db.prepare("SELECT COUNT(*) as n FROM posts WHERE creator_id=?").get(r.id).n,
    }));

    res.json({ data: enriched });
  } catch (err) { next(err); }
};

// GET /api/discover/creators?category=&country=&page=&limit=
exports.getCreators = (req, res, next) => {
  try {
    const { page, limit, offset } = paginate(req);
    const category = req.query.category || null;
    const country  = req.query.country  || null;

    const where  = ["u.role='creator'"];
    const params = [];
    if (category) { where.push("p.category=?");  params.push(category); }
    if (country)  { where.push("p.country=?");   params.push(country); }

    const whereStr = "WHERE " + where.join(" AND ");

    const total = db.prepare(
      `SELECT COUNT(*) as n FROM users u JOIN profiles p ON p.user_id=u.id ${whereStr}`
    ).get(...params).n;

    const rows = db.prepare(
      `SELECT u.id, u.name, u.username, u.avatar_url, u.verified, u.followers_count,
              p.category, p.tags, p.recommendation_score, p.country, p.cover_url, p.is_trending
       FROM users u JOIN profiles p ON p.user_id=u.id
       ${whereStr}
       ORDER BY p.recommendation_score DESC, u.followers_count DESC
       LIMIT ? OFFSET ?`
    ).all(...params, limit, offset);

    res.json({
      data: rows.map(r => ({ ...r, tags: parseJSON(r.tags, []), is_trending: r.is_trending === 1 })),
      meta: paginationMeta(total, page, limit),
    });
  } catch (err) { next(err); }
};

// GET /api/discover/search?q=&type=users|posts
exports.search = (req, res, next) => {
  try {
    const q    = String(req.query.q || "").trim();
    const type = req.query.type || "users";
    if (!q) return res.status(400).json({ error: "Query parameter 'q' is required." });

    const { page, limit, offset } = paginate(req);
    const like = `%${q}%`;

    if (type === "posts") {
      const total = db.prepare("SELECT COUNT(*) as n FROM posts WHERE caption LIKE ? AND is_premium=0").get(like).n;
      const posts = db.prepare(
        `SELECT p.*, u.name, u.username, u.avatar_url FROM posts p JOIN users u ON u.id=p.creator_id
         WHERE p.caption LIKE ? AND p.is_premium=0 ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
      ).all(like, limit, offset);
      return res.json({ data: posts, meta: paginationMeta(total, page, limit) });
    }

    // Default: search users
    const total = db.prepare(
      "SELECT COUNT(*) as n FROM users WHERE name LIKE ? OR username LIKE ?"
    ).get(like, like).n;
    const users = db.prepare(
      `SELECT u.id, u.name, u.username, u.avatar_url, u.verified, u.role, u.followers_count,
              p.category, p.country, p.recommendation_score
       FROM users u LEFT JOIN profiles p ON p.user_id=u.id
       WHERE u.name LIKE ? OR u.username LIKE ?
       ORDER BY u.followers_count DESC LIMIT ? OFFSET ?`
    ).all(like, like, limit, offset);

    res.json({ data: users, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// GET /api/discover/recommended
exports.getRecommended = (req, res, next) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 6);

    let rows;
    if (req.userId) {
      // Exclude people the user already follows, and the user themselves
      rows = db.prepare(
        `SELECT u.id, u.name, u.username, u.avatar_url, u.verified, u.followers_count,
                p.category, p.tags, p.recommendation_score, p.country, p.cover_url
         FROM users u JOIN profiles p ON p.user_id=u.id
         WHERE u.role='creator'
           AND u.id != ?
           AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id=?)
         ORDER BY p.recommendation_score DESC, RANDOM()
         LIMIT ?`
      ).all(req.userId, req.userId, limit);
    } else {
      rows = db.prepare(
        `SELECT u.id, u.name, u.username, u.avatar_url, u.verified, u.followers_count,
                p.category, p.tags, p.recommendation_score, p.country, p.cover_url
         FROM users u JOIN profiles p ON p.user_id=u.id
         WHERE u.role='creator'
         ORDER BY p.recommendation_score DESC LIMIT ?`
      ).all(limit);
    }

    res.json({ data: rows.map(r => ({ ...r, tags: parseJSON(r.tags, []) })) });
  } catch (err) { next(err); }
};
