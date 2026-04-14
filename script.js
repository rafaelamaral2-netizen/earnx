const STORAGE_KEY = "earnx_app_v4";

const countries = [
  "Puerto Rico",
  "United States",
  "Mexico",
  "Colombia",
  "Argentina",
  "Spain",
  "Dominican Republic",
  "Chile",
  "Brazil",
  "Global"
];

const initialState = {
  sessionUserId: null,
  ui: {
    authView: "login",
    appView: "home",
    discoverTab: "global",
    profileUserId: null,
    notice: null,
    searchQuery: "",
    theme: "dark"
  },
  users: [],
  posts: [],
  follows: [],
  messages: []
};

let state = loadState();

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(initialState);

  try {
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(initialState),
      ...parsed,
      ui: {
        ...structuredClone(initialState).ui,
        ...(parsed.ui || {})
      }
    };
  } catch {
    return structuredClone(initialState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeEmail(email) {
  return String(email).trim().toLowerCase();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function setNotice(type, text) {
  state.ui.notice = { type, text };
  saveState();
  render();

  setTimeout(() => {
    if (state.ui.notice?.text === text) {
      state.ui.notice = null;
      saveState();
      render();
    }
  }, 2400);
}

function applyTheme() {
  const theme = state.ui.theme || "dark";
  document.body.classList.toggle("light-theme", theme === "light");
}

function setTheme(theme) {
  state.ui.theme = theme;
  saveState();
  applyTheme();
  render();
}

function currentUser() {
  return state.users.find((u) => u.id === state.sessionUserId) || null;
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "EX";
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function userPosts(userId) {
  return state.posts.filter((p) => p.userId === userId);
}

function followerCount(userId) {
  return state.follows.filter((f) => f.followingId === userId).length;
}

function followingCount(userId) {
  return state.follows.filter((f) => f.followerId === userId).length;
}

function isFollowing(followerId, followingId) {
  return state.follows.some(
    (f) => f.followerId === followerId && f.followingId === followingId
  );
}

function scoreUser(user) {
  const posts = userPosts(user.id).length;
  const followers = followerCount(user.id);
  const following = followingCount(user.id);
  return followers * 8 + posts * 5 + Math.max(0, 10 - following);
}

function rankingUsers(scope = "global", viewerCountry = "Global") {
  let users = [...state.users];

  if (scope === "local") {
    users = users.filter((u) => u.country === viewerCountry);
  }

  return users
    .map((u) => ({ ...u, score: scoreUser(u) }))
    .sort((a, b) => b.score - a.score);
}

function getRankPosition(userId, scope = "global", viewerCountry = "Global") {
  const ranked = rankingUsers(scope, viewerCountry);
  const index = ranked.findIndex((u) => u.id === userId);
  return index === -1 ? null : index + 1;
}

function getRankBadge(userId, scope = "global", viewerCountry = "Global") {
  const pos = getRankPosition(userId, scope,
