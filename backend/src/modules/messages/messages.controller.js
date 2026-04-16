const db = require("../../config/db");
const { uid, paginate, paginationMeta } = require("../../utils");

// GET /api/messages/conversations
exports.listConversations = (req, res, next) => {
  try {
    const convs = db.prepare(
      `SELECT c.id, c.updated_at, c.last_message_id,
              u.id AS other_id, u.name AS other_name, u.username AS other_username, u.avatar_url AS other_avatar,
              m.text AS last_text, m.created_at AS last_at,
              (SELECT COUNT(*) FROM messages WHERE conversation_id=c.id AND is_read=0 AND sender_id!=?) AS unread
       FROM conversations c
       JOIN conversation_participants cp1 ON cp1.conversation_id=c.id AND cp1.user_id=?
       JOIN conversation_participants cp2 ON cp2.conversation_id=c.id AND cp2.user_id!=?
       JOIN users u ON u.id=cp2.user_id
       LEFT JOIN messages m ON m.id=c.last_message_id
       ORDER BY c.updated_at DESC`
    ).all(req.userId, req.userId, req.userId);

    res.json({ data: convs });
  } catch (err) { next(err); }
};

// POST /api/messages/conversations  { userId }
exports.getOrCreateConversation = (req, res, next) => {
  try {
    const otherId = String(req.body.userId || "").trim();
    if (!otherId || otherId === req.userId)
      return res.status(400).json({ error: "Invalid recipient." });

    const other = db.prepare("SELECT id FROM users WHERE id=?").get(otherId);
    if (!other) return res.status(404).json({ error: "User not found." });

    // Find existing conversation between the two
    const existing = db.prepare(
      `SELECT c.id FROM conversations c
       JOIN conversation_participants p1 ON p1.conversation_id=c.id AND p1.user_id=?
       JOIN conversation_participants p2 ON p2.conversation_id=c.id AND p2.user_id=?`
    ).get(req.userId, otherId);

    if (existing) return res.json({ data: { id: existing.id } });

    const convId = uid();
    const now    = Date.now();
    db.transaction(() => {
      db.prepare("INSERT INTO conversations (id,created_at,updated_at) VALUES (?,?,?)").run(convId, now, now);
      db.prepare("INSERT INTO conversation_participants (conversation_id,user_id,joined_at) VALUES (?,?,?)").run(convId, req.userId, now);
      db.prepare("INSERT INTO conversation_participants (conversation_id,user_id,joined_at) VALUES (?,?,?)").run(convId, otherId, now);
    })();

    res.status(201).json({ data: { id: convId } });
  } catch (err) { next(err); }
};

// GET /api/messages/conversations/:convId
exports.getMessages = (req, res, next) => {
  try {
    const member = db.prepare(
      "SELECT conversation_id FROM conversation_participants WHERE conversation_id=? AND user_id=?"
    ).get(req.params.convId, req.userId);
    if (!member) return res.status(403).json({ error: "Not a participant." });

    const { page, limit, offset } = paginate(req);
    const total = db.prepare("SELECT COUNT(*) as n FROM messages WHERE conversation_id=?").get(req.params.convId).n;
    const msgs  = db.prepare(
      `SELECT m.*, u.name, u.username, u.avatar_url
       FROM messages m JOIN users u ON u.id=m.sender_id
       WHERE m.conversation_id=? ORDER BY m.created_at ASC LIMIT ? OFFSET ?`
    ).all(req.params.convId, limit, offset);

    res.json({ data: msgs, meta: paginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

// POST /api/messages/conversations/:convId
exports.sendMessage = (req, res, next) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Message text is required." });

    const member = db.prepare(
      "SELECT conversation_id FROM conversation_participants WHERE conversation_id=? AND user_id=?"
    ).get(req.params.convId, req.userId);
    if (!member) return res.status(403).json({ error: "Not a participant." });

    const msgId = uid();
    const now   = Date.now();
    db.transaction(() => {
      db.prepare("INSERT INTO messages (id,conversation_id,sender_id,text,is_read,created_at) VALUES (?,?,?,?,0,?)").run(msgId, req.params.convId, req.userId, text, now);
      db.prepare("UPDATE conversations SET last_message_id=?,updated_at=? WHERE id=?").run(msgId, now, req.params.convId);
    })();

    const msg = db.prepare(
      "SELECT m.*, u.name, u.username, u.avatar_url FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?"
    ).get(msgId);
    res.status(201).json({ data: msg });
  } catch (err) { next(err); }
};

// PATCH /api/messages/conversations/:convId/read
exports.markRead = (req, res, next) => {
  try {
    db.prepare(
      "UPDATE messages SET is_read=1 WHERE conversation_id=? AND sender_id!=? AND is_read=0"
    ).run(req.params.convId, req.userId);
    res.json({ data: { marked: true } });
  } catch (err) { next(err); }
};
