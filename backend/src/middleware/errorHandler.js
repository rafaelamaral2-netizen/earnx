function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // SQLite unique constraint violation
  if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(409).json({ error: "A record with that value already exists." });
  }

  const status = err.status || 500;
  const message = status < 500 ? err.message : "Internal server error.";
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
