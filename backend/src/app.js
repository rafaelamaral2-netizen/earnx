require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const express = require("express");
const cors    = require("cors");
const path    = require("path");

// Initialize DB + schema first
require("./db/schema");

const errorHandler     = require("./middleware/errorHandler");
const authRoutes       = require("./modules/auth/auth.routes");
const usersRoutes      = require("./modules/users/users.routes");
const profilesRoutes   = require("./modules/profiles/profiles.routes");
const postsRoutes      = require("./modules/posts/posts.routes");
const mediaRoutes      = require("./modules/media/media.routes");
const messagesRoutes   = require("./modules/messages/messages.routes");
const discoverRoutes   = require("./modules/discover/discover.routes");
const walletRoutes     = require("./modules/wallet/wallet.routes");
const subsRoutes       = require("./modules/subscriptions/subscriptions.routes");
const settingsRoutes   = require("./modules/settings/settings.routes");

const app = express();

// ── Global middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));

// ── Serve uploaded files ──────────────────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ── Serve frontend static files ───────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../../")));

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",          authRoutes);
app.use("/api/users",         usersRoutes);
app.use("/api/profiles",      profilesRoutes);
app.use("/api/posts",         postsRoutes);
app.use("/api/media",         mediaRoutes);
app.use("/api/messages",      messagesRoutes);
app.use("/api/discover",      discoverRoutes);
app.use("/api/wallet",        walletRoutes);
app.use("/api/subscriptions", subsRoutes);
app.use("/api/settings",      settingsRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "2.0.0" }));

// ── SPA fallback ──────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../index.html"));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
