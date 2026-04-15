const express = require("express");
const cors    = require("cors");
const path    = require("path");

const authRoutes     = require("./routes/auth");
const stateRoutes    = require("./routes/state");
const followsRoutes  = require("./routes/follows");
const postsRoutes    = require("./routes/posts");
const messagesRoutes = require("./routes/messages");

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend static files from the project root
app.use(express.static(path.join(__dirname, "..")));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/state",    stateRoutes);
app.use("/api/follows",  followsRoutes);
app.use("/api/posts",    postsRoutes);
app.use("/api/messages", messagesRoutes);

// ─── Fallback ─────────────────────────────────────────────────────────────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`EarnX server running → http://localhost:${PORT}`);
});
