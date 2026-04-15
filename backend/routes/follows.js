const express = require("express");
const { db, uid } = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/follows/:userId  – follow a user
router.post("/:userId", requireAuth, (req, res) => {
  const followerId  = req.userId;
  const followingId = req.params.userId;

  if (followerId === followingId) {
    return res.status(400).json({ error: "You cannot follow yourself." });
  }

  const target = db.prepare("SELECT id FROM users WHERE id = ?").get(followingId);
  if (!target) return res.status(404).json({ error: "User not found." });

  const existing = db.prepare(
    "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?"
  ).get(followerId, followingId);

  if (existing) {
    return res.status(409).json({ error: "Already following." });
  }

  db.prepare(
    "INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, ?)"
  ).run(uid("follow"), followerId, followingId, Date.now());

  res.json({ ok: true });
});

// DELETE /api/follows/:userId  – unfollow a user
router.delete("/:userId", requireAuth, (req, res) => {
  const followerId  = req.userId;
  const followingId = req.params.userId;

  const result = db.prepare(
    "DELETE FROM follows WHERE follower_id = ? AND following_id = ?"
  ).run(followerId, followingId);

  if (result.changes === 0) {
    return res.status(404).json({ error: "Follow relationship not found." });
  }

  res.json({ ok: true });
});

module.exports = router;
