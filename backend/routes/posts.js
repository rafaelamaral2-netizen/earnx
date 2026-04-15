const express = require("express");
const { db, uid, mapPost } = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/posts  – create a new post
router.post("/", requireAuth, (req, res) => {
  const content   = String(req.body.content  || "").trim();
  const monetized = req.body.monetized ? 1 : 0;

  if (!content) {
    return res.status(400).json({ error: "Write something before publishing." });
  }

  const id  = uid("post");
  const now = Date.now();

  db.prepare(
    "INSERT INTO posts (id, user_id, content, monetized, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.userId, content, monetized, now);

  const post = mapPost(db.prepare("SELECT * FROM posts WHERE id = ?").get(id));
  res.status(201).json({ post });
});

module.exports = router;
