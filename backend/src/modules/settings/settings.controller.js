const db = require("../../config/db");

const BOOL_FIELDS = [
  "email_notifications", "push_notifications", "new_follower_notif",
  "new_message_notif", "new_subscriber_notif", "profile_public", "show_online_status",
];

// GET /api/settings
exports.getSettings = (req, res, next) => {
  try {
    const s = db.prepare("SELECT * FROM user_settings WHERE user_id=?").get(req.userId);
    if (!s) return res.status(404).json({ error: "Settings not found." });

    // Convert integer booleans to JS booleans
    const settings = { ...s };
    for (const f of BOOL_FIELDS) settings[f] = settings[f] === 1;
    res.json({ data: settings });
  } catch (err) { next(err); }
};

// PATCH /api/settings
exports.updateSettings = (req, res, next) => {
  try {
    const updates = [];
    const params  = [];

    // Boolean fields
    for (const field of BOOL_FIELDS) {
      if (req.body[field] !== undefined) {
        updates.push(`${field}=?`);
        params.push(req.body[field] ? 1 : 0);
      }
    }

    // String fields
    if (req.body.theme !== undefined) {
      const theme = ["dark", "light"].includes(req.body.theme) ? req.body.theme : "dark";
      updates.push("theme=?");
      params.push(theme);
    }
    if (req.body.allow_messages !== undefined) {
      const val = ["all", "subscribers", "none"].includes(req.body.allow_messages) ? req.body.allow_messages : "all";
      updates.push("allow_messages=?");
      params.push(val);
    }

    if (!updates.length) return res.status(400).json({ error: "Nothing to update." });

    updates.push("updated_at=?");
    params.push(Date.now(), req.userId);

    db.prepare(`UPDATE user_settings SET ${updates.join(",")} WHERE user_id=?`).run(...params);

    const s = db.prepare("SELECT * FROM user_settings WHERE user_id=?").get(req.userId);
    const settings = { ...s };
    for (const f of BOOL_FIELDS) settings[f] = settings[f] === 1;
    res.json({ data: settings });
  } catch (err) { next(err); }
};
