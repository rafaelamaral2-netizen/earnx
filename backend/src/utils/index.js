const { randomUUID, createHash, randomBytes } = require("crypto");

function uid() {
  return randomUUID();
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function randomToken() {
  return randomBytes(32).toString("hex");
}

function paginate(req) {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

function paginationMeta(total, page, limit) {
  return { total, page, limit, pages: Math.ceil(total / limit) };
}

function safeUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return {
    ...safe,
    verified: row.verified === 1,
  };
}

function parseJSON(val, fallback = null) {
  try { return JSON.parse(val); } catch { return fallback; }
}

module.exports = { uid, hashToken, randomToken, paginate, paginationMeta, safeUser, parseJSON };
