const express = require("express");
const { db, mapUser, mapPost, mapFollow, mapMessage } = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/state
// Returns all data the frontend needs in one request
router.get("/", requireAuth, (req, res) => {
  const userId = req.userId;

  const users    = db.prepare("SELECT * FROM users ORDER BY created_at ASC").all().map(mapUser);
  const posts    = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all().map(mapPost);
  const follows  = db.prepare("SELECT * FROM follows").all().map(mapFollow);
  const messages = db.prepare(
    "SELECT * FROM messages WHERE from_user_id = ? OR to_user_id = ? ORDER BY created_at DESC"
  ).all(userId, userId).map(mapMessage);

  res.json({ currentUserId: userId, users, posts, follows, messages });
});

module.exports = router;
