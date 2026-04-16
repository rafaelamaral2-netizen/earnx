const db   = require("../../config/db");
const path = require("path");
const fs   = require("fs");
const { uid } = require("../../utils");

// POST /api/media/upload
exports.upload = (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided or unsupported type." });

    const { filename, mimetype, size } = req.file;
    const type = mimetype.startsWith("video") ? "video"
               : mimetype.startsWith("audio") ? "audio"
               : "image";

    const baseUrl  = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const url      = `${baseUrl}/uploads/${filename}`;
    const is_premium  = req.body.is_premium === "true" ? 1 : 0;
    const visibility  = ["public", "subscribers", "private"].includes(req.body.visibility)
                        ? req.body.visibility : "public";
    const now    = Date.now();
    const mediaId = uid();

    db.prepare(
      "INSERT INTO media (id,owner_id,type,url,thumbnail_url,is_premium,visibility,size_bytes,mime_type,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)"
    ).run(mediaId, req.userId, type, url, req.body.thumbnail_url || null, is_premium, visibility, size, mimetype, now);

    const media = db.prepare("SELECT * FROM media WHERE id=?").get(mediaId);
    res.status(201).json({ data: media });
  } catch (err) { next(err); }
};

// GET /api/media/:mediaId
exports.getMedia = (req, res, next) => {
  try {
    const media = db.prepare("SELECT * FROM media WHERE id=?").get(req.params.mediaId);
    if (!media) return res.status(404).json({ error: "Media not found." });

    if (media.visibility === "private" && media.owner_id !== req.userId)
      return res.status(403).json({ error: "Access denied." });

    if (media.visibility === "subscribers" && media.owner_id !== req.userId) {
      const sub = req.userId
        ? db.prepare("SELECT id FROM subscriptions WHERE creator_id=? AND fan_id=? AND status='active'").get(media.owner_id, req.userId)
        : null;
      if (!sub) return res.status(403).json({ error: "Subscribe to access this content." });
    }

    res.json({ data: media });
  } catch (err) { next(err); }
};

// DELETE /api/media/:mediaId
exports.deleteMedia = (req, res, next) => {
  try {
    const media = db.prepare("SELECT * FROM media WHERE id=?").get(req.params.mediaId);
    if (!media) return res.status(404).json({ error: "Media not found." });
    if (media.owner_id !== req.userId && req.userRole !== "admin")
      return res.status(403).json({ error: "Not authorized." });

    // Remove file from disk
    const filename = path.basename(media.url);
    const filePath = path.join(__dirname, "../../../../uploads", filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare("DELETE FROM media WHERE id=?").run(req.params.mediaId);
    res.json({ data: { deleted: true } });
  } catch (err) { next(err); }
};
