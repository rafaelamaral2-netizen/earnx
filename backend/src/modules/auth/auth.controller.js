const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const db       = require("../../config/db");
const { uid, hashToken, randomToken, safeUser } = require("../../utils");

const ACCESS_SECRET  = process.env.JWT_SECRET         || "earnx_access_secret_dev";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "earnx_refresh_secret_dev";
const ACCESS_EXP     = "15m";
const REFRESH_EXP    = "30d";

function signAccess(userId, role) {
  return jwt.sign({ sub: userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXP });
}
function signRefresh(userId) {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXP });
}
function storeRefresh(userId, token) {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  db.prepare(
    "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?,?,?,?,?)"
  ).run(uid(), userId, hashToken(token), expiresAt, Date.now());
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const name     = String(req.body.name     || "").trim();
    const username = String(req.body.username || "").trim().toLowerCase();
    const email    = String(req.body.email    || "").trim().toLowerCase();
    const password = String(req.body.password || "").trim();
    const role     = ["creator", "fan"].includes(req.body.role) ? req.body.role : "fan";

    if (!name)    return res.status(400).json({ error: "Name is required." });
    if (!/^[a-z0-9_]{3,30}$/.test(username))
      return res.status(400).json({ error: "Username: 3-30 chars, letters/numbers/underscores." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Valid email is required." });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters." });

    if (db.prepare("SELECT id FROM users WHERE email=? OR username=?").get(email, username))
      return res.status(409).json({ error: "Email or username already in use." });

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uid();
    const now    = Date.now();

    db.transaction(() => {
      db.prepare(
        "INSERT INTO users (id,name,username,email,password_hash,role,verified,followers_count,following_count,created_at,updated_at) VALUES (?,?,?,?,?,?,0,0,0,?,?)"
      ).run(userId, name, username, email, passwordHash, role, now, now);

      db.prepare(
        "INSERT INTO profiles (id,user_id,created_at,updated_at) VALUES (?,?,?,?)"
      ).run(uid(), userId, now, now);

      db.prepare(
        "INSERT INTO wallets (id,user_id,available,pending,reserved,paid_out,updated_at) VALUES (?,?,0,0,0,0,?)"
      ).run(uid(), userId, now);

      db.prepare(
        "INSERT INTO user_settings (user_id,updated_at) VALUES (?,?)"
      ).run(userId, now);
    })();

    const user = safeUser(db.prepare("SELECT * FROM users WHERE id=?").get(userId));
    const accessToken  = signAccess(userId, role);
    const refreshToken = signRefresh(userId);
    storeRefresh(userId, refreshToken);

    res.status(201).json({ data: { user, accessToken, refreshToken } });
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const identifier = String(req.body.email    || "").trim().toLowerCase();
    const password   = String(req.body.password || "").trim();

    if (!identifier || !password)
      return res.status(400).json({ error: "Email and password are required." });

    const row = db.prepare("SELECT * FROM users WHERE email=? OR username=?").get(identifier, identifier);
    if (!row || !(await bcrypt.compare(password, row.password_hash)))
      return res.status(401).json({ error: "Invalid credentials." });

    const accessToken  = signAccess(row.id, row.role);
    const refreshToken = signRefresh(row.id);
    storeRefresh(row.id, refreshToken);

    res.json({ data: { user: safeUser(row), accessToken, refreshToken } });
  } catch (err) { next(err); }
};

// POST /api/auth/logout
exports.logout = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken)
      db.prepare("DELETE FROM refresh_tokens WHERE token_hash=?").run(hashToken(refreshToken));
    res.json({ data: { message: "Logged out successfully." } });
  } catch (err) { next(err); }
};

// POST /api/auth/refresh
exports.refresh = (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required." });

    let payload;
    try { payload = jwt.verify(refreshToken, REFRESH_SECRET); }
    catch { return res.status(401).json({ error: "Invalid or expired refresh token." }); }

    const stored = db.prepare(
      "SELECT * FROM refresh_tokens WHERE token_hash=? AND expires_at>?"
    ).get(hashToken(refreshToken), Date.now());
    if (!stored) return res.status(401).json({ error: "Refresh token revoked." });

    const user = db.prepare("SELECT id, role FROM users WHERE id=?").get(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found." });

    // Rotate token
    db.prepare("DELETE FROM refresh_tokens WHERE token_hash=?").run(hashToken(refreshToken));
    const newRefresh = signRefresh(user.id);
    storeRefresh(user.id, newRefresh);

    res.json({ data: { accessToken: signAccess(user.id, user.role), refreshToken: newRefresh } });
  } catch (err) { next(err); }
};

// POST /api/auth/forgot-password
exports.forgotPassword = (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required." });

    const ok = { data: { message: "If that account exists, a reset link was sent." } };
    const user = db.prepare("SELECT id FROM users WHERE email=?").get(email);
    if (!user) return res.json(ok); // avoid user enumeration

    const token = randomToken();
    const now   = Date.now();
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").run(user.id);
    db.prepare(
      "INSERT INTO password_reset_tokens (id,user_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)"
    ).run(uid(), user.id, hashToken(token), now + 3600_000, now);

    // TODO: send email with reset link containing `token`
    if (process.env.NODE_ENV !== "production")
      console.log(`[DEV] Password reset token for ${email}: ${token}`);

    res.json(ok);
  } catch (err) { next(err); }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password required." });
    if (password.length < 8)  return res.status(400).json({ error: "Password must be at least 8 characters." });

    const stored = db.prepare(
      "SELECT * FROM password_reset_tokens WHERE token_hash=? AND expires_at>?"
    ).get(hashToken(token), Date.now());
    if (!stored) return res.status(400).json({ error: "Invalid or expired reset token." });

    const hash = await bcrypt.hash(password, 12);
    const now  = Date.now();
    db.prepare("UPDATE users SET password_hash=?, updated_at=? WHERE id=?").run(hash, now, stored.user_id);
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id=?").run(stored.user_id);
    db.prepare("DELETE FROM refresh_tokens WHERE user_id=?").run(stored.user_id); // force re-login

    res.json({ data: { message: "Password reset successfully. Please log in." } });
  } catch (err) { next(err); }
};

// GET /api/auth/me
exports.me = (req, res, next) => {
  try {
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.userId);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ data: safeUser(user) });
  } catch (err) { next(err); }
};
