const express = require("express");
const { db, uid, mapMessage } = require("../database");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /api/messages  – send a message
router.post("/", requireAuth, (req, res) => {
  const toUserId = String(req.body.toUserId || "").trim();
  const text     = String(req.body.text     || "").trim();

  if (!text) {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  if (!toUserId || toUserId === req.userId) {
    return res.status(400).json({ error: "Invalid recipient." });
  }

  const recipient = db.prepare("SELECT id FROM users WHERE id = ?").get(toUserId);
  if (!recipient) return res.status(404).json({ error: "Recipient not found." });

  const id  = uid("msg");
  const now = Date.now();

  db.prepare(
    "INSERT INTO messages (id, from_user_id, to_user_id, text, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, req.userId, toUserId, text, now);

  const message = mapMessage(db.prepare("SELECT * FROM messages WHERE id = ?").get(id));
  res.status(201).json({ message });
});

module.exports = router;
