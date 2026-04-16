// Usage: requireRole("admin") or requireRole("creator", "admin")
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userId) return res.status(401).json({ error: "Authentication required." });
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    next();
  };
}

module.exports = requireRole;
