/* =========================================================
   EARNX — SCRIPT.JS — PHASE 1 + PHASE 2
   Global State + Theme + Navigation + Feed Logic
   ========================================================= */

/* -------------------------
   1) Initial UI / app state
------------------------- */
const initialUI = {
  authView: "login",
  appView: "home",
  discoverTab: "global",
  discoverCategory: "all",
  profileUserId: null,
  notice: null,
  searchQuery: "",
  theme: "dark",
  messagesView: "inbox",
  activeConvoUserId: null,
  feedFilter: "following" // following | trending | premium
};

const initialState = {
  sessionUserId: "u1",
  ui: loadUIState(),
  users: getMockUsers(),
  posts: getMockPosts(),
  follows: getMockFollows(),
  messages: getMockMessages(),
  localLikes: {},
  wallet: getMockWallet(),
  settings: getMockSettings()
};

let state = initialState;

/* -------------------------
   2) Boot
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  render();
  bindGlobalEvents();
});

/* -------------------------
   3) Mock data
------------------------- */
function getMockUsers() {
  return [
    {
      id: "u1",
      name: "Rafael Amaral",
      displayName: "Rafael Amaral",
      username: "rafael",
      email: "rafael@example.com",
      role: "creator",
      country: "Puerto Rico",
      bio: "Building a premium creator platform with ambition and momentum.",
      avatarUrl: "",
      coverUrl: "",
      verified: true,
      category: "Tech"
    },
    {
      id: "u2",
      name: "Sofia Vega",
      displayName: "Sofia Vega",
      username: "sofia",
      email: "sofia@example.com",
      role: "creator",
      country: "Mexico",
      bio: "Exclusive creator lifestyle content and premium drops.",
      avatarUrl: "",
      coverUrl: "",
      verified: true,
      category: "Lifestyle"
    },
    {
      id: "u3",
      name: "Alex Rivera",
      displayName: "Alex Rivera",
      username: "alex",
      email: "alex@example.com",
      role: "creator",
      country: "Puerto Rico",
      bio: "Streaming, drops, and audience-first content.",
      avatarUrl: "",
      coverUrl: "",
      verified: false,
      category: "Streaming"
    },
    {
      id: "u4",
      name: "Luna Cruz",
      displayName: "Luna Cruz",
      username: "luna",
      email: "luna@example.com",
      role: "creator",
      country: "Spain",
      bio: "Premium content, community, and creator energy.",
      avatarUrl: "",
      coverUrl: "",
      verified: true,
      category: "Art"
    }
  ];
}

function getMockPosts() {
  return [
    {
      id: "p1",
      userId: "u2",
      content: "Late night vibes ✨ Exclusive content dropping for premium members.",
      monetized: true,
      likesCount: 128,
      commentsCount: 12,
      createdAt: Date.now() - 1000 * 60 * 60 * 3
    },
    {
      id: "p2",
      userId: "u3",
      content: "New premium drop coming soon. High engagement week ahead.",
      monetized: false,
      likesCount: 89,
      commentsCount: 8,
      createdAt: Date.now() - 1000 * 60 * 60 * 7
    },
    {
      id: "p3",
      userId: "u4",
      content: "Fresh content unlocked for the top supporters 💚",
      monetized: true,
      likesCount: 211,
      commentsCount: 16,
      createdAt: Date.now() - 1000 * 60 * 60 * 14
    },
    {
      id: "p4",
      userId: "u1",
      content: "EARNX keeps evolving. Cleaner UI, stronger momentum, better creator positioning.",
      monetized: false,
      likesCount: 67,
      commentsCount: 4,
      createdAt: Date.now() - 1000 * 60 * 60 * 18
    }
  ];
}

function getMockFollows() {
  return [
    { followerId: "u1", followingId: "u2" },
    { followerId: "u1", followingId: "u3" },
    { followerId: "u2", followingId: "u4" }
  ];
}

function getMockMessages() {
  return [
    {
      id: "m1",
      fromUserId: "u2",
      toUserId: "u1",
      text: "Hey, thanks for the follow.",
      read: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 5
    },
    {
      id: "m2",
      fromUserId: "u1",
      toUserId: "u2",
      text: "Of course. Your profile is looking strong.",
      read: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 4
    },
    {
      id: "m3",
      fromUserId: "u3",
      toUserId: "u1",
      text: "We should connect this week.",
      read: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 2
    }
  ];
}

function getMockWallet() {
  return {
    available: 4250,
    pending: 1280,
    reserved: 320,
    paidOut: 12940
  };
}

function getMockSettings() {
  return {
    notifications: true,
    privacyMode: false,
    emailUpdates: true,
    theme: "dark"
  };
}

/* -------------------------
   4) Local storage
------------------------- */
function loadUIState() {
  try {
    const raw = localStorage.getItem("earnx_ui");
    if (!raw) return { ...initialUI };
    return { ...initialUI, ...JSON.parse(raw) };
  } catch {
    return { ...initialUI };
  }
}

function saveUIState() {
  try {
    localStorage.setItem("earnx_ui", JSON.stringify(state.ui));
  } catch {}
}

function saveThemePreference() {
  try {
    localStorage.setItem("earnx_theme", state.ui.theme);
  } catch {}
}

function loadThemePreference() {
  try {
    return localStorage.getItem("earnx_theme");
  } catch {
    return null;
  }
}

/* -------------------------
   5) Theme
------------------------- */
function applyTheme() {
  const savedTheme = loadThemePreference();
  if (savedTheme) state.ui.theme = savedTheme;

  if (state.ui.theme === "light") {
    document.body.classList.remove("dark-theme");
  } else {
    document.body.classList.add("dark-theme");
  }
}

function toggleTheme() {
  state.ui.theme = state.ui.theme === "dark" ? "light" : "dark";
  saveUIState();
  saveThemePreference();
  applyTheme();
  render();
}

/* -------------------------
   6) State helpers
------------------------- */
function currentUser() {
  return state.users.find(user => user.id === state.sessionUserId) || null;
}

function setNotice(message) {
  state.ui.notice = message;
  saveUIState();
  render();
}

function clearNotice() {
  state.ui.notice = null;
  saveUIState();
  render();
}

function setAppView(view) {
  state.ui.appView = view;

  if (view !== "messages") {
    state.ui.messagesView = "inbox";
    state.ui.activeConvoUserId = null;
  }

  if (view === "profile" && !state.ui.profileUserId) {
    const me = currentUser();
    state.ui.profileUserId = me ? me.id : null;
  }

  saveUIState();
  render();
}

function setProfileView(userId) {
  state.ui.profileUserId = userId;
  state.ui.appView = "profile";
  saveUIState();
  render();
}

function setSearchQuery(value) {
  state.ui.searchQuery = value;
  saveUIState();
  render();
}

function setDiscoverTab(tab) {
  state.ui.discoverTab = tab;
  saveUIState();
  render();
}

function setDiscoverCategory(category) {
  state.ui.discoverCategory = category;
  saveUIState();
  render();
}

function setFeedFilter(filter) {
  state.ui.feedFilter = filter;
  saveUIState();
  render();
}

/* -------------------------
   7) Utility helpers
------------------------- */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInitials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/);
  return parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("");
}

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric"
  });
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function followerCount(userId) {
  return state.follows.filter(f => f.followingId === userId).length;
}

function followingCount(userId) {
  return state.follows.filter(f => f.followerId === userId).length;
}

function userPosts(userId) {
  return state.posts.filter(post => post.userId === userId);
}

function isFollowing(followerId, followingId) {
  return state.follows.some(
    f => f.followerId === followerId && f.followingId === followingId
  );
}

function scoreUser(user) {
  const postScore = userPosts(user.id).length * 20;
  const followScore = followerCount(user.id) * 8;
  const verifyBonus = user.verified ? 80 : 0;
  return postScore + followScore + verifyBonus;
}

function rankingUsers(mode = "global", country = "") {
  let users = [...state.users].filter(u => u.role === "creator");

  if (mode === "local") {
    users = users.filter(u => u.country === country);
  }

  return users.sort((a, b) => scoreUser(b) - scoreUser(a));
}

function getRankPosition(userId, mode = "global", country = "") {
  const users = rankingUsers(mode, country);
  const index = users.findIndex(u => u.id === userId);
  return index >= 0 ? index + 1 : null;
}

function getRankBadge(userId, mode = "global", country = "") {
  const position = getRankPosition(userId, mode, country);
  if (!position || position > 3) return null;

  const map = {
    1: { label: "#1", className: "rank-1" },
    2: { label: "#2", className: "rank-2" },
    3: { label: "#3", className: "rank-3" }
  };

  return map[position];
}

function isAmbassador(userId, country = "") {
  const pos = getRankPosition(userId, "local", country);
  return pos === 1;
}

/* -------------------------
   8) Avatar rendering
------------------------- */
function renderAvatar(user, extraClass = "") {
  if (!user) return `<div class="avatar ${extraClass}">?</div>`;

  const url = user.avatarUrl || user.avatar_url || null;
  const initials = getInitials(user.displayName || user.name || "");

  if (url) {
    return `
      <div class="avatar ${extraClass} has-img">
        <img
          src="${escapeHtml(url)}"
          alt="${escapeHtml(initials)}"
          class="avatar-img"
          data-fallback="${escapeHtml(initials)}"
        >
      </div>
    `;
  }

  return `<div class="avatar ${extraClass}">${escapeHtml(initials)}</div>`;
}

/* -------------------------
   9) Icons
------------------------- */
function iconSvg(icon) {
  const icons = {
    home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>`,
    search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>`,
    messages: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    profile: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>`,
    wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7h18v10H3z"/><path d="M16 12h5"/><path d="M3 7l3-3h12l3 3"/></svg>`,
    settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.1-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2.8a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.26.3.44.64.52 1.03.08.39.1.79.08 1.17-.02.38-.08.76-.19 1.13-.1.37-.24.73-.41 1.07z"/></svg>`,
    refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>`,
    heart: `<svg viewBox="0 0 24 24"><path d="M12 21.6C6.4 16.1 1 11.3 1 7.2 1 3.4 4.1 2 6.3 2c1.3 0 4.1.5 5.7 4.5C13.6 2.5 16.4 2 17.7 2 20.2 2 23 3.6 23 7.2c0 4.1-5.1 8.6-11 14.4z"/></svg>`,
    comment: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    send: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
  };

  return icons[icon] || "";
}

/* -------------------------
   10) Feed helpers
------------------------- */
function filteredFeedPosts() {
  const me = currentUser();
  let posts = [...state.posts].sort((a, b) => b.createdAt - a.createdAt);

  if (state.ui.feedFilter === "following" && me) {
    const followingIds = state.follows
      .filter(f => f.followerId === me.id)
      .map(f => f.followingId);

    posts = posts.filter(post => followingIds.includes(post.userId) || post.userId === me.id);
  }

  if (state.ui.feedFilter === "premium") {
    posts = posts.filter(post => post.monetized);
  }

  if (state.ui.feedFilter === "trending") {
    posts = posts.sort((a, b) => {
      const aScore = (a.likesCount || 0) + (a.commentsCount || 0) * 2;
      const bScore = (b.likesCount || 0) + (b.commentsCount || 0) * 2;
      return bScore - aScore;
    });
  }

  return posts;
}

function isPostLiked(postId) {
  return !!state.localLikes[postId];
}

function toggleLike(postId) {
  state.localLikes[postId] = !state.localLikes[postId];
  render();
}

/* -------------------------
   11) Base render
------------------------- */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  const me = currentUser();

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(me)}
      <div class="main-shell">
        ${renderTopbar(me)}
        <main class="page-content">
          ${renderCurrentPage()}
        </main>
        ${renderBottomNav()}
      </div>
    </div>
  `;

  bindRenderEvents();
}

/* -------------------------
   12) Sidebar / topbar / nav
------------------------- */
function renderSidebar(me) {
  return `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">X</div>
        <div>
          <div class="brand-name">EARN<span class="x">X</span></div>
          <div class="brand-sub">Creator platform</div>
        </div>
      </div>

      <div class="nav-group">
        ${navButton("home", "Home", "home")}
        ${navButton("discover", "Discover", "search")}
        ${navButton("messages", "Messages", "messages")}
        ${navButton("profile", "Profile", "profile")}
        ${navButton("wallet", "Wallet", "wallet")}
        ${navButton("settings", "Settings", "settings")}
      </div>

      <div class="stack" style="margin-top: 20px;">
        <button class="btn btn-primary" id="themeToggleBtn">
          ${state.ui.theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
      </div>

      <div style="margin-top: 24px;">
        ${renderAvatar(me, "avatar-md")}
      </div>
    </aside>
  `;
}

function renderTopbar(me) {
  return `
    <header class="topbar">
      <div class="topbar-left">
        <div>
          <div class="page-kicker">EARNX</div>
          <h1 class="page-title">${getPageTitle()}</h1>
          <p class="page-subtitle">Welcome back, @${escapeHtml(me?.username || "user")}</p>
        </div>
      </div>

      <div class="topbar-right">
        <input
          class="search-input"
          id="globalSearchInput"
          placeholder="Search creators"
          value="${escapeHtml(state.ui.searchQuery)}"
        />
        <button class="icon-btn" id="refreshViewBtn" aria-label="Refresh">
          ${iconSvg("refresh")}
        </button>
      </div>
    </header>
  `;
}

function navButton(view, label, icon) {
  const active = state.ui.appView === view ? "active" : "";
  return `
    <button class="nav-btn ${active}" data-nav="${view}">
      <span class="nav-icon-wrap">
        <span class="nav-icon">${iconSvg(icon)}</span>
      </span>
      <span class="nav-label">${escapeHtml(label)}</span>
    </button>
  `;
}

function renderBottomNav() {
  const items = [
    ["home", "Home", "home"],
    ["discover", "Discover", "search"],
    ["messages", "Messages", "messages"],
    ["profile", "Profile", "profile"],
    ["wallet", "Wallet", "wallet"]
  ];

  return `
    <nav class="bottom-nav">
      ${items.map(([view, label, icon]) => {
        const active = state.ui.appView === view ? "active" : "";
        return `
          <button class="nav-btn ${active}" data-nav="${view}">
            <span class="nav-icon-wrap">
              <span class="nav-icon">${iconSvg(icon)}</span>
            </span>
            <span class="nav-label">${escapeHtml(label)}</span>
          </button>
        `;
      }).join("")}
    </nav>
  `;
}

function getPageTitle() {
  const titles = {
    home: "Home Feed",
    discover: "Discover",
    messages: "Messages",
    profile: "Profile",
    wallet: "Wallet",
    settings: "Settings"
  };

  return titles[state.ui.appView] || "EARNX";
}

/* -------------------------
   13) Page renderers
------------------------- */
function renderCurrentPage() {
  switch (state.ui.appView) {
    case "home":
      return renderHomePage();
    case "discover":
      return renderDiscoverPlaceholder();
    case "messages":
      return renderMessagesPlaceholder();
    case "profile":
      return renderProfilePlaceholder();
    case "wallet":
      return renderWalletPlaceholder();
    case "settings":
      return renderSettingsPlaceholder();
    default:
      return renderHomePage();
  }
}

function renderHomePage() {
  const posts = filteredFeedPosts();

  return `
    <section class="page-section">
      <div class="section-head">
        <h2 class="section-title">Creator feed</h2>
        <span class="section-meta">${posts.length} posts</span>
      </div>

      <div class="tabs">
        <button class="tab ${state.ui.feedFilter === "following" ? "active" : ""}" data-feed-filter="following">Following</button>
        <button class="tab ${state.ui.feedFilter === "trending" ? "active" : ""}" data-feed-filter="trending">Trending</button>
        <button class="tab ${state.ui.feedFilter === "premium" ? "active" : ""}" data-feed-filter="premium">Premium</button>
      </div>
    </section>

    <section class="feed-list">
      ${posts.length ? posts.map(renderPostCard).join("") : renderFeedEmpty()}
    </section>
  `;
}

function renderPostCard(post) {
  const me = currentUser();
  const user = state.users.find(u => u.id === post.userId);
  if (!user) return "";

  const badge = getRankBadge(user.id, "global", me?.country || "");
  const ambassador = isAmbassador(user.id, me?.country || "");
  const liked = isPostLiked(post.id);
  const likeCount = (post.likesCount || 0) + (liked ? 1 : 0);
  const isPremium = !!post.monetized;

  return `
    <article class="post-card">
      <div class="post-head clickable" data-open-profile="${user.id}">
        ${renderAvatar(user)}
        <div class="name-block">
          <div class="name-line">
            <h4>${escapeHtml(user.displayName || user.name || "")}</h4>
            ${badge ? `<span class="badge ${escapeHtml(badge.className)}">${escapeHtml(badge.label)}</span>` : ""}
            ${ambassador ? `<span class="badge badge-ambassador">Ambassador</span>` : ""}
            ${isPremium ? `<span class="badge badge-premium">Premium</span>` : ""}
          </div>
          <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)} · ${escapeHtml(formatDate(post.createdAt))}</div>
        </div>
      </div>

      <div class="post-content">
        ${escapeHtml(post.content || "")}
      </div>

      <div class="post-media">
        <div class="media" style="min-height:220px; display:grid; place-items:center;">
          Media Preview
        </div>
      </div>

      <div class="post-footer">
        <div class="post-reactions">
          <button class="reaction-btn ${liked ? "reaction-liked" : ""}" data-like-post="${post.id}">
            ${iconSvg("heart")}
            ${likeCount > 0 ? `<span>${likeCount}</span>` : ""}
          </button>

          <button class="reaction-btn" data-comment-post="${post.id}">
            ${iconSvg("comment")}
            ${post.commentsCount > 0 ? `<span>${post.commentsCount}</span>` : ""}
          </button>
        </div>

        <button class="reaction-btn" data-message-user-direct="${user.id}">
          ${iconSvg("send")}
        </button>
      </div>
    </article>
  `;
}

function renderFeedEmpty() {
  return `
    <div class="feed-empty">
      <h3>No posts found</h3>
      <p>Try a different feed filter or follow more creators.</p>
    </div>
  `;
}

function renderDiscoverPlaceholder() {
  return `
    <section class="panel" style="padding: 20px;">
      <div class="section-head">
        <h2 class="section-title">Discover foundation ready</h2>
        <span class="section-meta">Phase 3 next</span>
      </div>
      <p class="text-muted">
        Discover filters, search, tabs, and rankings will be connected next.
      </p>
    </section>
  `;
}

function renderMessagesPlaceholder() {
  return `
    <section class="panel" style="padding: 20px;">
      <div class="section-head">
        <h2 class="section-title">Messages foundation ready</h2>
        <span class="section-meta">Phase 5 next</span>
      </div>
      <p class="text-muted">
        Inbox, threads, and send-message flow will be connected later.
      </p>
    </section>
  `;
}

function renderProfilePlaceholder() {
  const me = currentUser();
  const profile = state.users.find(u => u.id === state.ui.profileUserId) || me;

  return `
    <section class="panel" style="padding: 20px;">
      <div class="row" style="margin-bottom: 14px;">
        ${renderAvatar(profile, "avatar-lg")}
        <div>
          <h2 class="section-title" style="margin: 0;">${escapeHtml(profile.displayName || profile.name)}</h2>
          <p class="text-muted" style="margin: 6px 0 0;">@${escapeHtml(profile.username)}</p>
        </div>
      </div>

      <p class="text-muted">
        Profile view foundation is ready. Follow state, avatar fallback, and creator profile logic come in Phase 4.
      </p>
    </section>
  `;
}

function renderWalletPlaceholder() {
  return `
    <section class="panel" style="padding: 20px;">
      <div class="section-head">
        <h2 class="section-title">Wallet foundation ready</h2>
        <span class="section-meta">${formatMoney(state.wallet.available)} available</span>
      </div>
      <p class="text-muted">
        Wallet and settings logic will be connected in Phase 6.
      </p>
    </section>
  `;
}

function renderSettingsPlaceholder() {
  return `
    <section class="panel" style="padding: 20px;">
      <div class="section-head">
        <h2 class="section-title">Settings foundation ready</h2>
        <span class="section-meta">Phase 6 next</span>
      </div>
      <p class="text-muted">
        Preferences and persistence will be connected later.
      </p>
    </section>
  `;
}

/* -------------------------
   14) Events
------------------------- */
function bindGlobalEvents() {
  document.addEventListener("error", event => {
    const target = event.target;
    if (target && target.classList && target.classList.contains("avatar-img")) {
      const parent = target.parentElement;
      const fallback = target.dataset.fallback || "?";
      if (parent) {
        parent.classList.remove("has-img");
        parent.innerHTML = escapeHtml(fallback);
      }
    }
  }, true);
}

function bindRenderEvents() {
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.nav;
      setAppView(view);
    });
  });

  document.querySelectorAll("[data-feed-filter]").forEach(btn => {
    btn.addEventListener("click", () => {
      setFeedFilter(btn.dataset.feedFilter);
    });
  });

  document.querySelectorAll("[data-open-profile]").forEach(btn => {
    btn.addEventListener("click", () => {
      setProfileView(btn.dataset.openProfile);
    });
  });

  document.querySelectorAll("[data-like-post]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleLike(btn.dataset.likePost);
    });
  });

  document.querySelectorAll("[data-comment-post]").forEach(btn => {
    btn.addEventListener("click", () => {
      setNotice("Comments will be connected in a later phase.");
    });
  });

  document.querySelectorAll("[data-message-user-direct]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.appView = "messages";
      state.ui.messagesView = "chat";
      state.ui.activeConvoUserId = btn.dataset.messageUserDirect;
      saveUIState();
      render();
    });
  });

  const themeBtn = document.getElementById("themeToggleBtn");
  if (themeBtn) {
    themeBtn.addEventListener("click", toggleTheme);
  }

  const refreshBtn = document.getElementById("refreshViewBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => render());
  }

  const globalSearchInput = document.getElementById("globalSearchInput");
  if (globalSearchInput) {
    globalSearchInput.addEventListener("input", e => {
      setSearchQuery(e.target.value);
    });
  }
}
