const db = require("../../config/db");
const { parseJSON } = require("../../utils");

// GET /api/profiles/:username
exports.getProfile = (req, res, next) => {
  try {
    const row = db.prepare(
      `SELECT u.id, u.name, u.username, u.avatar_url, u.bio, u.role, u.verified,
              u.followers_count, u.following_count,
              p.cover_url, p.category, p.tags, p.is_trending, p.recommendation_score,
              p.country, p.website, p.social_links, p.public_metadata
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.username = ?`
    ).get(req.params.username);

    if (!row) return res.status(404).json({ error: "Profile not found." });

    const profile = {
      ...row,
      tags:          parseJSON(row.tags, []),
      social_links:  parseJSON(row.social_links, {}),
      public_metadata: parseJSON(row.public_metadata, {}),
      is_trending:   row.is_trending === 1,
      verified:      row.verified === 1,
    };

    if (req.userId) {
      profile.is_following = !!db.prepare(
        "SELECT id FROM follows WHERE follower_id=? AND following_id=?"
      ).get(req.userId, row.id);
    }

    res.json({ data: profile });
  } catch (err) { next(err); }
};

// PATCH /api/profiles/me
exports.updateProfile = (req, res, next) => {
  try {
    const allowed = ["cover_url", "category", "country", "website"];
    const updates = [];
    const params  = [];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates.push(`${field}=?`);
        params.push(String(req.body[field]).trim());
      }
    }

    // Handle JSON fields
    if (req.body.tags !== undefined) {
      updates.push("tags=?");
      params.push(JSON.stringify(Array.isArray(req.body.tags) ? req.body.tags.slice(0, 10) : []));
    }
    if (req.body.social_links !== undefined && typeof req.body.social_links === "object") {
      updates.push("social_links=?");
      params.push(JSON.stringify(req.body.social_links));
    }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update." });

    updates.push("updated_at=?");
    params.push(Date.now(), req.userId);

    db.prepare(`UPDATE profiles SET ${updates.join(",")} WHERE user_id=?`).run(...params);
    const profile = db.prepare("SELECT * FROM profiles WHERE user_id=?").get(req.userId);
    res.json({ data: profile });
  } catch (err) { next(err); }
};
