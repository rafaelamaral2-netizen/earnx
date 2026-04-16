const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET || "earnx_access_secret_dev";

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required." });

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please log in again." });
  }
}

// Optional auth — attaches user if token present, but doesn't block request
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, ACCESS_SECRET);
      req.userId   = payload.sub;
      req.userRole = payload.role;
    } catch { /* ignore */ }
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
