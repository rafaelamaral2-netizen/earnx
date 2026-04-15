const express = require("express");
const bcrypt = require("bcryptjs");
const { db, uid, mapUser } = require("../database");
const { signToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

const countries = [
  "Puerto Rico", "United States", "Mexico", "Colombia", "Argentina",
  "Spain", "Dominican Republic", "Chile", "Brazil", "Global"
];

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const displayName = String(req.body.displayName || "").trim();
    const username    = String(req.body.username    || "").trim().toLowerCase();
    const email       = String(req.body.email       || "").trim().toLowerCase();
    const password    = String(req.body.password    || "").trim();
    const country     = String(req.body.country     || "").trim();
    const bio         = String(req.body.bio         || "").trim() || "Creator on EarnX.";

    if (!displayName) return res.status(400).json({ error: "Display name is required." });
    if (!username)    return res.status(400).json({ error: "Username is required." });
    if (!email)       return res.status(400).json({ error: "Email is required." });
    if (password.length < 4) return res.status(400).json({ error: "Password must be at least 4 characters." });
    if (!countries.includes(country)) return res.status(400).json({ error: "Please select a valid country." });

    const existing = db.prepare(
      "SELECT id FROM users WHERE email = ? OR username = ?"
    ).get(email, username);

    if (existing) {
      return res.status(409).json({ error: "That email or username is already in use." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uid("user");
    const now = Date.now();

    db.prepare(
      "INSERT INTO users (id, username, display_name, email, password_hash, bio, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).run(id, username, displayName, email, passwordHash, bio, country, now);

    const user = mapUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id));
    const token = signToken(id);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const identifier = String(req.body.email || "").trim().toLowerCase();
    const password   = String(req.body.password || "").trim();

    if (!identifier || !password) {
      return res.status(400).json({ error: "Please enter your email and password." });
    }

    const row = db.prepare(
      "SELECT * FROM users WHERE email = ? OR username = ?"
    ).get(identifier, identifier);

    if (!row) {
      return res.status(401).json({ error: "Incorrect email or password. Please try again." });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Incorrect email or password. Please try again." });
    }

    const user = mapUser(row);
    const token = signToken(row.id);

    res.json({ token, user });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId);
  if (!row) return res.status(404).json({ error: "User not found." });
  res.json({ user: mapUser(row) });
});

module.exports = router;
