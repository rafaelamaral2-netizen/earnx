/* =========================================================
   EARNX — PHASE 8
   Full frontend + auth demo + session + navigation
   Replaces entire script.js
========================================================= */

const STORAGE_KEY = "earnx_phase8_app";

/* -------------------------
   INITIAL UI
------------------------- */
const initialUI = {
  authView: "login",           // login | signup
  appView: "home",             // home | discover | messages | profile | wallet | settings
  discoverCategory: "all",
  searchQuery: "",
  theme: "dark",
  messagesView: "inbox",       // inbox | chat
  activeConvoUserId: null,
  feedFilter: "following",
  profileUserId: null,
  settingsTab: "preferences"
};

let state = createInitialState();

/* -------------------------
   BOOT
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  applyTheme();
  render();
});

/* -------------------------
   INITIAL STATE
------------------------- */
function createInitialState() {
  return {
    sessionUserId: null,
    ui: { ...initialUI },
    users: getMockUsers(),
    posts: getMockPosts(),
    follows: getMockFollows(),
    messages: getMockMessages(),
    localLikes: {},
    wallet: getMockWallet(),
    settings: getMockSettings()
  };
}

/* -------------------------
   MOCK DATA
------------------------- */
function getMockUsers() {
  return [
    {
      id: "u1",
      username: "rafael",
      email: "rafael@test.com",
      password: "1234",
      displayName: "Rafael Amaral",
      country: "PR",
      verified: true,
      category: "tech",
      bio: "Building EARNX into a premium creator platform.",
      avatarUrl: "",
      coverUrl: ""
    },
    {
      id: "u2",
      username: "sofia",
      email: "sofia@test.com",
      password: "1234",
      displayName: "Sofia Vega",
      country: "MX",
      verified: true,
      category: "lifestyle",
      bio: "Exclusive drops, premium content, and audience energy.",
      avatarUrl: "",
      coverUrl: ""
    },
    {
      id: "u3",
      username: "alex",
      email: "alex@test.com",
      password: "1234",
      displayName: "Alex Rivera",
      country: "PR",
      verified: false,
      category: "gaming",
      bio: "Streaming, clips, and high-engagement moments.",
      avatarUrl: "",
      coverUrl: ""
    },
    {
      id: "u4",
      username: "luna",
      email: "luna@test.com",
      password: "1234",
      displayName: "Luna Cruz",
      country: "ES",
      verified: true,
      category: "art",
      bio: "Visual creator focused on premium community and aesthetic content.",
      avatarUrl: "",
      coverUrl: ""
    }
  ];
}

function getMockPosts() {
  return [
    {
      id: "p1",
      userId: "u2",
      content: "Premium drop 🔥",
      monetized: true,
      likesCount: 120,
      commentsCount: 12,
      createdAt: Date.now() - 1000 * 60 * 60 * 2
    },
    {
      id: "p2",
      userId: "u3",
      content: "Streaming tonight with the community.",
      monetized: false,
      likesCount: 80,
      commentsCount: 8,
      createdAt: Date.now() - 1000 * 60 * 60 * 5
    },
    {
      id: "p3",
      userId: "u4",
      content: "New artwork and exclusive preview for supporters.",
      monetized: true,
      likesCount: 200,
      commentsCount: 15,
      createdAt: Date.now() - 1000 * 60 * 60 * 9
    },
    {
      id: "p4",
      userId: "u1",
      content: "EARNX is evolving into a stronger creator ecosystem.",
      monetized: false,
      likesCount: 67,
      commentsCount: 4,
      createdAt: Date.now() - 1000 * 60 * 60 * 15
    }
  ];
}

function getMockFollows() {
  return [
    { followerId: "u1", followingId: "u2" },
    { followerId: "u1", followingId: "u3" },
    { followerId: "u2", followingId: "u4" },
    { followerId: "u3", followingId: "u2" },
    { followerId: "u4", followingId: "u2" }
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
      createdAt: Date.now() - 1000 * 60 * 60 * 10
    },
    {
      id: "m2",
      fromUserId: "u1",
      toUserId: "u2",
      text: "Of course. Your profile looks strong.",
      read: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 9
    },
    {
      id: "m3",
      fromUserId: "u3",
      toUserId: "u1",
      text: "We should connect this week.",
      read: false,
      createdAt: Date.now() - 1000 * 60 * 60 * 4
    },
    {
      id: "m4",
      fromUserId: "u1",
      toUserId: "u3",
      text: "Definitely, let's line it up.",
      read: true,
      createdAt: Date.now() - 1000 * 60 * 60 * 3
    },
    {
      id: "m5",
      fromUserId: "u4",
      toUserId: "u1",
      text: "Loved the direction of EARNX.",
      read: false,
      createdAt: Date.now() - 1000 * 60 * 70
    }
  ];
}

function getMockWallet() {
  return {
    available: 4250,
    pending: 1280,
    reserved: 320,
    paidOut: 12940,
    recentTransactions: [
      {
        id: "t1",
        title: "Subscription payout",
        subtitle: "From premium subscribers",
        amount: 420,
        type: "credit",
        status: "completed",
        createdAt: Date.now() - 1000 * 60 * 60 * 6
      },
      {
        id: "t2",
        title: "Reserved funds",
        subtitle: "Pending release",
        amount: 180,
        type: "reserved",
        status: "pending",
        createdAt: Date.now() - 1000 * 60 * 60 * 18
      },
      {
        id: "t3",
        title: "Payout sent",
        subtitle: "Transferred to creator account",
        amount: 950,
        type: "debit",
        status: "completed",
        createdAt: Date.now() - 1000 * 60 * 60 * 34
      }
    ]
  };
}

function getMockSettings() {
  return {
    notifications: {
      app: true,
      messages: true,
      marketing: false
    },
    privacy: {
      privateProfile: false,
      hideActivity: false
    },
    preferences: {
      compactFeed: false,
      autoplayMedia: true
    },
    account: {
      creatorMode: true
    }
  };
}

/* -------------------------
   STORAGE
------------------------- */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn("Could not save state", err);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    state = {
      ...createInitialState(),
      ...parsed,
      ui: { ...initialUI, ...(parsed.ui || {}) }
    };
  } catch (err) {
    console.warn("Could not load state", err);
  }
}

/* -------------------------
   HELPERS
------------------------- */
function currentUser() {
  return state.users.find(u => u.id === state.sessionUserId) || null;
}

function userById(id) {
  return state.users.find(u => u.id === id) || null;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function followerCount(id) {
  return state.follows.filter(f => f.followingId === id).length;
}

function followingCount(id) {
  return state.follows.filter(f => f.followerId === id).length;
}

function userPosts(id) {
  return state.posts
    .filter(p => p.userId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function isFollowing(followerId, followingId) {
  return state.follows.some(
    f => f.followerId === followerId && f.followingId === followingId
  );
}

function scoreUser(user) {
  return followerCount(user.id) * 10 + userPosts(user.id).length * 20 + (user.verified ? 50 : 0);
}

function rankingUsers() {
  return [...state.users].sort((a, b) => scoreUser(b) - scoreUser(a));
}

function formatRelative(ts) {
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function formatChatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

/* -------------------------
   AUTH
------------------------- */
function login(identifier, password) {
  const value = identifier.trim().toLowerCase();

  const user = state.users.find(
    u =>
      (u.email && u.email.toLowerCase() === value || u.username.toLowerCase() === value) &&
      u.password === password
  );

  if (!user) {
    alert("Invalid credentials");
    return;
  }

  state.sessionUserId = user.id;
  state.ui.appView = "home";
  state.ui.profileUserId = user.id;
  saveState();
  render();
}

function signup({ displayName, username, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  const emailTaken = state.users.some(u => u.email && u.email.toLowerCase() === normalizedEmail);
  const usernameTaken = state.users.some(u => u.username.toLowerCase() === normalizedUsername);

  if (emailTaken) {
    alert("That email already exists");
    return;
  }

  if (usernameTaken) {
    alert("That username already exists");
    return;
  }

  const id = "u" + (state.users.length + 1);

  const newUser = {
    id,
    displayName: displayName.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    country: "PR",
    verified: false,
    category: "creator",
    bio: "New creator on EARNX.",
    avatarUrl: "",
    coverUrl: ""
  };

  state.users.push(newUser);
  state.sessionUserId = newUser.id;
  state.ui.authView = "login";
  state.ui.appView = "home";
  state.ui.profileUserId = newUser.id;
  saveState();
  render();
}

function logout() {
  state.sessionUserId = null;
  state.ui.authView = "login";
  state.ui.appView = "home";
  state.ui.activeConvoUserId = null;
  state.ui.messagesView = "inbox";
  saveState();
  render();
}

/* -------------------------
   THEME
------------------------- */
function applyTheme() {
  document.body.classList.toggle("dark-theme", state.ui.theme === "dark");
}

function toggleTheme() {
  state.ui.theme = state.ui.theme === "dark" ? "light" : "dark";
  saveState();
  applyTheme();
  render();
}

/* -------------------------
   NAVIGATION
------------------------- */
function setAppView(view) {
  state.ui.appView = view;

  if (view !== "messages") {
    state.ui.messagesView = "inbox";
    state.ui.activeConvoUserId = null;
  }

  if (view === "profile" && !state.ui.profileUserId) {
    state.ui.profileUserId = state.sessionUserId;
  }

  saveState();
  render();
}

function setProfile(id) {
  state.ui.profileUserId = id;
  state.ui.appView = "profile";
  saveState();
  render();
}

function openChat(userId) {
  state.ui.appView = "messages";
  state.ui.messagesView = "chat";
  state.ui.activeConvoUserId = userId;
  markConversationAsRead(userId);
  saveState();
  render();
}

function goInbox() {
  state.ui.messagesView = "inbox";
  state.ui.activeConvoUserId = null;
  saveState();
  render();
}

/* -------------------------
   FEED
------------------------- */
function filteredPosts() {
  let posts = [...state.posts];

  if (state.ui.feedFilter === "following") {
    const followingIds = state.follows
      .filter(f => f.followerId === state.sessionUserId)
      .map(f => f.followingId);

    posts = posts.filter(p => followingIds.includes(p.userId) || p.userId === state.sessionUserId);
  }

  if (state.ui.feedFilter === "premium") {
    posts = posts.filter(p => p.monetized);
  }

  if (state.ui.feedFilter === "trending") {
    posts = posts.sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount));
  } else {
    posts = posts.sort((a, b) => b.createdAt - a.createdAt);
  }

  return posts;
}

function toggleLike(id) {
  state.localLikes[id] = !state.localLikes[id];
  saveState();
  render();
}

function isLiked(id) {
  return !!state.localLikes[id];
}

/* -------------------------
   DISCOVER
------------------------- */
function getDiscoverUsers() {
  let users = rankingUsers();

  if (state.ui.discoverCategory !== "all") {
    users = users.filter(u => u.category === state.ui.discoverCategory);
  }

  if (state.ui.searchQuery) {
    const q = state.ui.searchQuery.toLowerCase();
    users = users.filter(
      u =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.category.toLowerCase().includes(q)
    );
  }

  return users;
}

/* -------------------------
   PROFILE
------------------------- */
function toggleFollow(targetUserId) {
  const me = state.sessionUserId;
  const exists = state.follows.find(
    f => f.followerId === me && f.followingId === targetUserId
  );

  if (exists) {
    state.follows = state.follows.filter(
      f => !(f.followerId === me && f.followingId === targetUserId)
    );
  } else {
    state.follows.push({
      followerId: me,
      followingId: targetUserId
    });
  }

  saveState();
  render();
}

function renderAvatar(user, extraClass = "") {
  const initials = getInitials(user?.displayName || user?.username || "?");
  const url = user?.avatarUrl || "";

  if (url) {
    return `
      <div class="avatar ${extraClass} has-img">
        <img src="${url}" alt="${initials}" class="avatar-img">
      </div>
    `;
  }

  return `<div class="avatar ${extraClass}">${initials}</div>`;
}

/* -------------------------
   MESSAGES
------------------------- */
function getConversations() {
  const me = state.sessionUserId;
  const map = new Map();

  state.messages.forEach(message => {
    const isMine = message.fromUserId === me;
    const isToMe = message.toUserId === me;
    if (!isMine && !isToMe) return;

    const otherId = isMine ? message.toUserId : message.fromUserId;
    const existing = map.get(otherId);

    if (!existing || existing.lastMessage.createdAt < message.createdAt) {
      map.set(otherId, {
        userId: otherId,
        lastMessage: message
      });
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt
  );
}

function getThread(userId) {
  const me = state.sessionUserId;

  return state.messages
    .filter(
      m =>
        (m.fromUserId === me && m.toUserId === userId) ||
        (m.fromUserId === userId && m.toUserId === me)
    )
    .sort((a, b) => a.createdAt - b.createdAt);
}

function unreadCountForUser(userId) {
  const me = state.sessionUserId;
  return state.messages.filter(
    m => m.fromUserId === userId && m.toUserId === me && !m.read
  ).length;
}

function totalUnreadCount() {
  const me = state.sessionUserId;
  return state.messages.filter(m => m.toUserId === me && !m.read).length;
}

function markConversationAsRead(userId) {
  const me = state.sessionUserId;
  state.messages = state.messages.map(m => {
    if (m.fromUserId === userId && m.toUserId === me) {
      return { ...m, read: true };
    }
    return m;
  });
}

function sendMessage(toUserId, text) {
  const value = text.trim();
  if (!value) return;

  state.messages.push({
    id: "m" + (state.messages.length + 1),
    fromUserId: state.sessionUserId,
    toUserId,
    text: value,
    read: false,
    createdAt: Date.now()
  });

  saveState();
  render();
}

/* -------------------------
   SETTINGS
------------------------- */
function setSettingsTab(tab) {
  state.ui.settingsTab = tab;
  saveState();
  render();
}

function updatePreference(path, value) {
  const [group, key] = path.split(".");
  if (!state.settings[group]) return;
  state.settings[group][key] = value;
  saveState();
  render();
}

/* -------------------------
   RENDER ROOT
------------------------- */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  if (!state.sessionUserId) {
    app.innerHTML = renderAuthShell();
  } else {
    app.innerHTML = renderAppShell();
  }

  bindEvents();
}

/* -------------------------
   AUTH UI
------------------------- */
function renderAuthShell() {
  return `
    <main class="page">
      <section class="shell">
        <div class="brand">
          <div class="brand-icon">X</div>
          <div class="brand-copy">
            <h1>EarnX</h1>
            <p>Creator economy platform</p>
          </div>
        </div>

        <div class="intro">
          <h2>A premium social platform built around creator ambition, audience reach, and public ranking momentum.</h2>
          <p>Designed for creators who want stronger positioning, cleaner monetization, and a product that feels elevated from the first touch.</p>
        </div>

        ${
          state.ui.authView === "login"
            ? renderLoginCard()
            : renderSignupCard()
        }
      </section>
    </main>
  `;
}

function renderLoginCard() {
  return `
    <div class="card">
      <h3>Login</h3>
      <p class="card-sub">Enter your creator account.</p>

      <form id="loginForm">
        <div class="field">
          <label class="label" for="loginIdentifier">Email or username</label>
          <input class="input" id="loginIdentifier" type="text" placeholder="you@example.com or @username" />
        </div>

        <div class="field">
          <label class="label" for="loginPassword">Password</label>
          <input class="input" id="loginPassword" type="password" placeholder="••••••••" />
        </div>

        <button class="button" type="submit">Login</button>
      </form>

      <div class="links">
        <a href="#" id="goSignup">Create account</a>
      </div>

      <div class="note">Demo account: rafael@test.com / 1234</div>
    </div>
  `;
}

function renderSignupCard() {
  return `
    <div class="card">
      <h3>Create account</h3>
      <p class="card-sub">Start building your EARNX identity.</p>

      <form id="signupForm">
        <div class="field">
          <label class="label" for="signupDisplayName">Display name</label>
          <input class="input" id="signupDisplayName" type="text" placeholder="Your name" />
        </div>

        <div class="field">
          <label class="label" for="signupUsername">Username</label>
          <input class="input" id="signupUsername" type="text" placeholder="username" />
        </div>

        <div class="field">
          <label class="label" for="signupEmail">Email</label>
          <input class="input" id="signupEmail" type="email" placeholder="you@example.com" />
        </div>

        <div class="field">
          <label class="label" for="signupPassword">Password</label>
          <input class="input" id="signupPassword" type="password" placeholder="••••••••" />
        </div>

        <button class="button" type="submit">Create account</button>
      </form>

      <div class="links">
        <a href="#" id="goLogin">Back to login</a>
      </div>

      <div class="note">Account is stored locally in your browser for demo purposes.</div>
    </div>
  `;
}

/* -------------------------
   APP SHELL
------------------------- */
function renderAppShell() {
  return `
    ${renderNav()}
    <main class="page-content">
      ${renderPage()}
    </main>
  `;
}

/* -------------------------
   NAV UI
------------------------- */
function renderNav() {
  const unread = totalUnreadCount();

  return `
    <nav class="sidebar">
      <div class="brand">
        <div class="brand-mark">X</div>
        <div>
          <div class="brand-name">EARN<span class="x">X</span></div>
          <div class="brand-sub">Creator platform</div>
        </div>
      </div>

      <div class="nav-group">
        <button class="nav-btn ${state.ui.appView === "home" ? "active" : ""}" data-nav="home">Home</button>
        <button class="nav-btn ${state.ui.appView === "discover" ? "active" : ""}" data-nav="discover">Discover</button>
        <button class="nav-btn ${state.ui.appView === "messages" ? "active" : ""}" data-nav="messages">
          Messages ${unread > 0 ? `<span class="nav-unread">${unread}</span>` : ""}
        </button>
        <button class="nav-btn ${state.ui.appView === "profile" ? "active" : ""}" data-nav="profile">Profile</button>
        <button class="nav-btn ${state.ui.appView === "wallet" ? "active" : ""}" data-nav="wallet">Wallet</button>
        <button class="nav-btn ${state.ui.appView === "settings" ? "active" : ""}" data-nav="settings">Settings</button>
      </div>

      <div style="margin-top:20px;" class="stack">
        <button class="btn btn-primary" id="themeToggleBtn">
          ${state.ui.theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        <button class="btn btn-secondary" id="logoutBtn">Logout</button>
      </div>
    </nav>
  `;
}

/* -------------------------
   PAGE ROUTER
------------------------- */
function renderPage() {
  if (state.ui.appView === "home") return renderFeed();
  if (state.ui.appView === "discover") return renderDiscover();
  if (state.ui.appView === "profile") return renderProfile();
  if (state.ui.appView === "messages") return renderMessages();
  if (state.ui.appView === "wallet") return renderWallet();
  if (state.ui.appView === "settings") return renderSettings();
  return "";
}

/* -------------------------
   FEED UI
------------------------- */
function renderFeed() {
  return `
    <div class="topbar">
      <div>
        <span class="page-kicker">EARNX</span>
        <h1 class="page-title">Home Feed</h1>
        <p class="page-subtitle">Friendly, premium, creator-first feed</p>
      </div>
    </div>

    <div class="tabs" style="margin-top:16px;">
      <button class="tab ${state.ui.feedFilter === "following" ? "active" : ""}" data-feed-filter="following">Following</button>
      <button class="tab ${state.ui.feedFilter === "trending" ? "active" : ""}" data-feed-filter="trending">Trending</button>
      <button class="tab ${state.ui.feedFilter === "premium" ? "active" : ""}" data-feed-filter="premium">Premium</button>
    </div>

    <div class="feed-list" style="margin-top:18px;">
      ${filteredPosts().map(renderPost).join("")}
    </div>
  `;
}

function renderPost(post) {
  const user = userById(post.userId);
  const liked = isLiked(post.id);
  const likeCount = post.likesCount + (liked ? 1 : 0);

  return `
    <article class="post-card">
      <div class="post-head clickable" data-profile="${user.id}">
        ${renderAvatar(user)}
        <div class="name-block">
          <div class="name-line">
            <h4>${user.displayName}</h4>
            ${user.verified ? `<span class="badge badge-ambassador">Verified</span>` : ""}
            ${post.monetized ? `<span class="badge badge-premium">Premium</span>` : ""}
          </div>
          <div class="handle">@${user.username} · ${user.country} · ${formatRelative(post.createdAt)}</div>
        </div>
      </div>

      <div class="post-content">${post.content}</div>

      <div class="post-footer">
        <div class="post-reactions">
          <button class="reaction-btn ${liked ? "reaction-liked" : ""}" data-like="${post.id}">
            ❤️ <span>${likeCount}</span>
          </button>
          <button class="reaction-btn">
            💬 <span>${post.commentsCount}</span>
          </button>
        </div>

        <button class="reaction-btn" data-profile="${user.id}">
          View Profile
        </button>
      </div>
    </article>
  `;
}

/* -------------------------
   DISCOVER UI
------------------------- */
function renderDiscover() {
  const users = getDiscoverUsers();

  return `
    <div class="topbar">
      <div>
        <span class="page-kicker">Discover</span>
        <h1 class="page-title">Discover creators</h1>
        <p class="page-subtitle">Find other users, creators, and content</p>
      </div>
    </div>

    <div class="searchbar-wrap" style="margin-top:16px;">
      <input
        class="search-input"
        id="searchInput"
        placeholder="Search creators..."
        value="${state.ui.searchQuery}"
      />
    </div>

    <div class="cats-strip" style="margin-top:12px;">
      ${["all", "tech", "lifestyle", "gaming", "art", "creator"].map(cat => `
        <button class="cat-chip ${state.ui.discoverCategory === cat ? "active" : ""}" data-cat="${cat}">
          ${cat}
        </button>
      `).join("")}
    </div>

    <div class="list" style="margin-top:18px;">
      ${users.map(renderCreatorCard).join("")}
    </div>
  `;
}

function renderCreatorCard(user) {
  return `
    <div class="creator-card">
      <div class="creator-head">
        ${renderAvatar(user, "avatar-md")}
        <div class="name-block">
          <div class="name-line">
            <h4>${user.displayName}</h4>
            ${user.verified ? `<span class="badge badge-ambassador">Verified</span>` : ""}
          </div>
          <div class="handle">@${user.username} · ${user.category}</div>
        </div>
      </div>

      <div class="creator-bio">${user.bio}</div>

      <div class="post-actions">
        <span class="chip">Followers ${followerCount(user.id)}</span>
        <span class="chip">Posts ${userPosts(user.id).length}</span>
        <span class="chip">Score ${scoreUser(user)}</span>
      </div>

      <div class="creator-actions">
        <button class="btn btn-secondary" data-profile="${user.id}">View profile</button>
      </div>
    </div>
  `;
}

/* -------------------------
   PROFILE UI
------------------------- */
function renderProfile() {
  const me = currentUser();
  const profile = userById(state.ui.profileUserId) || me;
  const ownProfile = profile.id === me.id;
  const posts = userPosts(profile.id);
  const followed = isFollowing(me.id, profile.id);

  return `
    <section class="panel">
      <div class="profile-cover-zone">
        <div class="profile-cover-bg ${profile.coverUrl ? "" : "profile-cover-default"}">
          ${profile.coverUrl ? `<img class="profile-cover-img" src="${profile.coverUrl}" alt="Cover">` : ""}
        </div>

        <div class="profile-avatar-anchor">
          ${renderAvatar(profile, "avatar-xl")}
          ${profile.verified ? `<span class="verified-checkmark">✓</span>` : ""}
        </div>
      </div>

      <div class="profile-identity-block">
        <div class="profile-name-area">
          <div>
            <h2 class="profile-display-name">${profile.displayName}</h2>
            <div class="handle">@${profile.username} · ${profile.country}</div>
          </div>

          <div class="profile-rank-col">
            <span class="chip">Score ${scoreUser(profile)}</span>
          </div>
        </div>

        <p class="profile-bio-text">${profile.bio || "No bio yet."}</p>

        <div class="category-chip">${profile.category}</div>

        <div class="profile-stats-bar">
          <div class="pstat">
            <strong>${followerCount(profile.id)}</strong>
            <span>Followers</span>
          </div>
          <div class="pstat-divider"></div>
          <div class="pstat">
            <strong>${followingCount(profile.id)}</strong>
            <span>Following</span>
          </div>
          <div class="pstat-divider"></div>
          <div class="pstat">
            <strong>${posts.length}</strong>
            <span>Posts</span>
          </div>
        </div>

        <div class="profile-action-row">
          ${
            ownProfile
              ? `
                <button class="btn btn-primary">Edit Profile</button>
                <button class="btn btn-secondary" data-nav="settings">Settings</button>
              `
              : `
                <button class="btn btn-primary" data-follow="${profile.id}">
                  ${followed ? "Following" : "Follow"}
                </button>
                <button class="btn btn-secondary" data-message-user="${profile.id}">Message</button>
              `
          }
        </div>

        <div class="profile-tabs">
          <div class="profile-tab active">Posts</div>
          <div class="profile-tab">Media</div>
          <div class="profile-tab">Premium</div>
        </div>

        <div class="feed-list" style="margin-top:18px;">
          ${
            posts.length
              ? posts.map(renderPost).join("")
              : `
                <div class="profile-empty">
                  <h3>No posts yet</h3>
                  <p>${ownProfile ? "Start building your presence." : "This creator has not posted yet."}</p>
                </div>
              `
          }
        </div>
      </div>
    </section>
  `;
}

/* -------------------------
   MESSAGES UI
------------------------- */
function renderMessages() {
  if (state.ui.messagesView === "chat" && state.ui.activeConvoUserId) {
    return renderChatView();
  }
  return renderInboxView();
}

function renderInboxView() {
  const convos = getConversations();

  return `
    <div class="topbar">
      <div>
        <span class="page-kicker">Messages</span>
        <h1 class="page-title">Inbox</h1>
        <p class="page-subtitle">Premium creator conversations</p>
      </div>
    </div>

    <div class="messages-shell" style="margin-top:18px;">
      <section class="inbox-panel">
        <div class="inbox-head">
          <div class="inbox-head-title">
            <h3>Conversations</h3>
            <p>${convos.length} active chats</p>
          </div>
        </div>

        ${
          convos.length
            ? `<div class="inbox-list">${convos.map(renderConversationRow).join("")}</div>`
            : `
              <div class="inbox-empty">
                <div class="inbox-empty-icon">💬</div>
                <h3>Your inbox is quiet</h3>
                <p>Start a conversation from a creator profile to build stronger engagement.</p>
              </div>
            `
        }
      </section>

      <section class="chat-panel">
        <div class="inbox-empty">
          <div class="inbox-empty-icon">✉️</div>
          <h3>Select a conversation</h3>
          <p>Choose a creator or user from the inbox to open the chat thread.</p>
        </div>
      </section>
    </div>
  `;
}

function renderConversationRow(convo) {
  const user = userById(convo.userId);
  const unread = unreadCountForUser(convo.userId);

  return `
    <div class="convo-row ${state.ui.activeConvoUserId === convo.userId ? "active" : ""}" data-open-chat="${convo.userId}">
      ${renderAvatar(user, "avatar-md")}
      <div class="convo-body">
        <div class="convo-top">
          <span class="convo-name">${user.displayName}</span>
          <span class="convo-time">${formatRelative(convo.lastMessage.createdAt)}</span>
        </div>
        <div class="convo-preview">${convo.lastMessage.text}</div>
        <div class="convo-meta">
          <span class="convo-badge">@${user.username}</span>
          ${unread > 0 ? `<span class="convo-unread">${unread}</span>` : ""}
        </div>
      </div>
    </div>
  `;
}

function renderChatView() {
  const user = userById(state.ui.activeConvoUserId);
  const thread = getThread(user.id);

  return `
    <div class="topbar">
      <div>
        <span class="page-kicker">Messages</span>
        <h1 class="page-title">Chat</h1>
        <p class="page-subtitle">Private thread with @${user.username}</p>
      </div>
    </div>

    <div class="messages-shell" style="margin-top:18px;">
      <section class="inbox-panel">
        <div class="inbox-head">
          <div class="inbox-head-title">
            <h3>Conversations</h3>
            <p>${getConversations().length} active chats</p>
          </div>
        </div>
        <div class="inbox-list">
          ${getConversations().map(renderConversationRow).join("")}
        </div>
      </section>

      <section class="chat-panel">
        <div class="chat-topbar">
          <button class="icon-btn" id="backToInboxBtn">←</button>
          <div class="chat-header-id">
            ${renderAvatar(user, "avatar-sm")}
            <div>
              <div class="chat-header-name">${user.displayName}</div>
              <div class="chat-header-handle">@${user.username}</div>
            </div>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages">
          ${thread.length ? thread.map(renderBubble).join("") : `<div class="chat-day-label">Start the conversation</div>`}
        </div>

        <div class="chat-input-bar">
          <form id="chatForm">
            <div class="chat-input-row">
              <textarea class="chat-textarea" id="chatTextarea" placeholder="Write a message..."></textarea>
              <button class="chat-send-btn" type="submit">➤</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  `;
}

function renderBubble(message) {
  const mine = message.fromUserId === state.sessionUserId;
  const sender = userById(message.fromUserId);

  return `
    <div class="bubble-row ${mine ? "bubble-row-mine" : "bubble-row-theirs"}">
      ${mine ? "" : renderAvatar(sender, "avatar-xs")}
      <div class="bubble ${mine ? "bubble-mine" : "bubble-theirs"}">
        <p class="bubble-text">${message.text}</p>
        <span class="bubble-time">${formatChatTime(message.createdAt)}</span>
      </div>
    </div>
  `;
}

/* -------------------------
   WALLET UI
------------------------- */
function renderWallet() {
  const w = state.wallet;

  return `
    <div class="wallet-shell">
      <section class="wallet-hero">
        <div class="wallet-hero-top">
          <div>
            <div class="wallet-kicker">Wallet</div>
            <div class="wallet-balance-label">Available balance</div>
            <h1 class="wallet-balance">${formatMoney(w.available)}</h1>
            <div class="wallet-balance-sub">Premium creator earnings and payout visibility</div>
          </div>
          <div class="wallet-action-row">
            <button class="btn btn-primary">Withdraw</button>
            <button class="btn btn-secondary">Export</button>
          </div>
        </div>
      </section>

      <section class="wallet-grid">
        <div class="wallet-card wallet-card-positive">
          <div class="wallet-card-label">Available</div>
          <h3 class="wallet-card-value">${formatMoney(w.available)}</h3>
          <div class="wallet-card-meta">Ready to use</div>
        </div>

        <div class="wallet-card">
          <div class="wallet-card-label">Pending</div>
          <h3 class="wallet-card-value">${formatMoney(w.pending)}</h3>
          <div class="wallet-card-meta">Awaiting release</div>
        </div>

        <div class="wallet-card wallet-card-warning">
          <div class="wallet-card-label">Reserved</div>
          <h3 class="wallet-card-value">${formatMoney(w.reserved)}</h3>
          <div class="wallet-card-meta">Protected balance</div>
        </div>

        <div class="wallet-card">
          <div class="wallet-card-label">Paid out</div>
          <h3 class="wallet-card-value">${formatMoney(w.paidOut)}</h3>
          <div class="wallet-card-meta">Lifetime payouts</div>
        </div>
      </section>

      <section class="wallet-panels">
        <div class="wallet-panel">
          <div class="wallet-panel-head">
            <div>
              <h3>Recent activity</h3>
              <p>Your latest transactions</p>
            </div>
          </div>

          <div class="wallet-activity-list">
            ${w.recentTransactions.map(renderTransaction).join("")}
          </div>
        </div>

        <div class="wallet-panel">
          <div class="wallet-panel-head">
            <div>
              <h3>Revenue summary</h3>
              <p>Quick performance indicators</p>
            </div>
          </div>

          <div class="revenue-summary">
            <div class="revenue-pill-row">
              <span class="revenue-pill">Monthly growth +14%</span>
              <span class="revenue-pill">Top source subscriptions</span>
              <span class="revenue-pill">Retention stable</span>
            </div>
            <div class="revenue-visual">
              Revenue visualization placeholder
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderTransaction(tx) {
  return `
    <div class="wallet-activity-row">
      <div class="wallet-activity-left">
        <div class="wallet-activity-icon">💸</div>
        <div>
          <div class="wallet-activity-title">${tx.title}</div>
          <div class="wallet-activity-sub">${tx.subtitle} · ${formatRelative(tx.createdAt)}</div>
          <div class="wallet-activity-status">${tx.status}</div>
        </div>
      </div>
      <div class="wallet-activity-amount ${tx.type === "credit" ? "positive" : tx.type === "debit" ? "negative" : ""}">
        ${tx.type === "debit" ? "-" : tx.type === "credit" ? "+" : ""}${formatMoney(tx.amount)}
      </div>
    </div>
  `;
}

/* -------------------------
   SETTINGS UI
------------------------- */
function renderSettings() {
  return `
    <div class="settings-shell">
      <aside class="settings-nav">
        <button class="settings-nav-btn ${state.ui.settingsTab === "preferences" ? "active" : ""}" data-settings-tab="preferences">Preferences</button>
        <button class="settings-nav-btn ${state.ui.settingsTab === "notifications" ? "active" : ""}" data-settings-tab="notifications">Notifications</button>
        <button class="settings-nav-btn ${state.ui.settingsTab === "privacy" ? "active" : ""}" data-settings-tab="privacy">Privacy</button>
        <button class="settings-nav-btn ${state.ui.settingsTab === "account" ? "active" : ""}" data-settings-tab="account">Account</button>
      </aside>

      <section class="settings-main">
        ${renderSettingsContent()}
      </section>
    </div>
  `;
}

function renderSettingsContent() {
  if (state.ui.settingsTab === "preferences") {
    return `
      <div class="settings-section">
        <div class="settings-section-head">
          <h3>Preferences</h3>
          <p>Adjust how the product feels and behaves.</p>
        </div>

        <div class="settings-row">
          <div class="settings-row-left">
            <div class="settings-row-title">Theme</div>
            <div class="settings-row-sub">Switch between light and dark mode.</div>
          </div>
          <div class="settings-control">
            <button class="btn btn-secondary" id="themeToggleInlineBtn">${state.ui.theme === "dark" ? "Dark" : "Light"}</button>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-left">
            <div class="settings-row-title">Compact feed</div>
            <div class="settings-row-sub">Reduce feed density for faster scanning.</div>
          </div>
          <div class="settings-control">
            <button class="switch ${state.settings.preferences.compactFeed ? "active" : ""}" data-toggle-setting="preferences.compactFeed"></button>
          </div>
        </div>

        <div class="settings-row">
          <div class="settings-row-left">
            <div class="settings-row-title">Autoplay media</div>
            <div class="settings-row-sub">Automatically play eligible media previews.</div>
          </div>
          <div class="settings-control">
            <button class="switch ${state.settings.preferences.autoplayMedia ? "active" : ""}" data-toggle-setting="preferences.autoplayMedia"></button>
          </div>
        </div>
      </div>
    `;
  }

  if (state.ui.settingsTab === "notifications") {
    return `
      <div class="settings-section">
        <div class="settings-section-head">
          <h3>Notifications</h3>
          <p>Control how EARNX keeps you informed.</p>
        </div>

        ${renderToggleRow("App notifications", "General product notifications.", "notifications.app", state.settings.notifications.app)}
        ${renderToggleRow("Messages", "Be notified when someone sends you a message.", "notifications.messages", state.settings.notifications.messages)}
        ${renderToggleRow("Marketing updates", "Receive occasional product and growth updates.", "notifications.marketing", state.settings.notifications.marketing)}
      </div>
    `;
  }

  if (state.ui.settingsTab === "privacy") {
    return `
      <div class="settings-section">
        <div class="settings-section-head">
          <h3>Privacy</h3>
          <p>Decide how visible your activity should be.</p>
        </div>

        ${renderToggleRow("Private profile", "Limit profile discoverability.", "privacy.privateProfile", state.settings.privacy.privateProfile)}
        ${renderToggleRow("Hide activity", "Reduce public visibility of your activity.", "privacy.hideActivity", state.settings.privacy.hideActivity)}
      </div>
    `;
  }

  const me = currentUser();

  return `
    <div class="settings-section">
      <div class="settings-section-head">
        <h3>Account</h3>
        <p>Review your account and creator mode setup.</p>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="settings-field" value="${me?.email || ""}" readonly />
        </div>

        <div class="form-group">
          <label class="form-label">Creator mode</label>
          <input class="settings-field" value="${state.settings.account.creatorMode ? "Enabled" : "Disabled"}" readonly />
        </div>
      </div>

      <div class="soft-divider"></div>

      <div class="account-card">
        <div class="account-card-title">Account status</div>
        <div class="account-card-sub">Your EARNX creator profile is active and ready for scaling.</div>
      </div>
    </div>
  `;
}

function renderToggleRow(title, subtitle, path, enabled) {
  return `
    <div class="settings-row">
      <div class="settings-row-left">
        <div class="settings-row-title">${title}</div>
        <div class="settings-row-sub">${subtitle}</div>
      </div>
      <div class="settings-control">
        <button class="switch ${enabled ? "active" : ""}" data-toggle-setting="${path}"></button>
      </div>
    </div>
  `;
}

/* -------------------------
   EVENTS
------------------------- */
function bindEvents() {
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.onsubmit = e => {
      e.preventDefault();
      const identifier = document.getElementById("loginIdentifier").value;
      const password = document.getElementById("loginPassword").value;
      login(identifier, password);
    };
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.onsubmit = e => {
      e.preventDefault();
      signup({
        displayName: document.getElementById("signupDisplayName").value,
        username: document.getElementById("signupUsername").value,
        email: document.getElementById("signupEmail").value,
        password: document.getElementById("signupPassword").value
      });
    };
  }

  const goSignup = document.getElementById("goSignup");
  if (goSignup) {
    goSignup.onclick = e => {
      e.preventDefault();
      state.ui.authView = "signup";
      saveState();
      render();
    };
  }

  const goLogin = document.getElementById("goLogin");
  if (goLogin) {
    goLogin.onclick = e => {
      e.preventDefault();
      state.ui.authView = "login";
      saveState();
      render();
    };
  }

  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.onclick = () => setAppView(btn.dataset.nav);
  });

  document.querySelectorAll("[data-feed-filter]").forEach(btn => {
    btn.onclick = () => {
      state.ui.feedFilter = btn.dataset.feedFilter;
      saveState();
      render();
    };
  });

  document.querySelectorAll("[data-like]").forEach(btn => {
    btn.onclick = () => toggleLike(btn.dataset.like);
  });

  document.querySelectorAll("[data-profile]").forEach(btn => {
    btn.onclick = () => setProfile(btn.dataset.profile);
  });

  document.querySelectorAll("[data-cat]").forEach(btn => {
    btn.onclick = () => {
      state.ui.discoverCategory = btn.dataset.cat;
      saveState();
      render();
    };
  });

  document.querySelectorAll("[data-follow]").forEach(btn => {
    btn.onclick = () => toggleFollow(btn.dataset.follow);
  });

  document.querySelectorAll("[data-message-user]").forEach(btn => {
    btn.onclick = () => openChat(btn.dataset.messageUser);
  });

  document.querySelectorAll("[data-open-chat]").forEach(btn => {
    btn.onclick = () => openChat(btn.dataset.openChat);
  });

  document.querySelectorAll("[data-settings-tab]").forEach(btn => {
    btn.onclick = () => setSettingsTab(btn.dataset.settingsTab);
  });

  document.querySelectorAll("[data-toggle-setting]").forEach(btn => {
    btn.onclick = () => {
      const path = btn.dataset.toggleSetting;
      const [group, key] = path.split(".");
      const current = state.settings[group][key];
      updatePreference(path, !current);
    };
  });

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.oninput = e => {
      state.ui.searchQuery = e.target.value;
      saveState();
      render();
    };
  }

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.onclick = toggleTheme;
  }

  const themeToggleInlineBtn = document.getElementById("themeToggleInlineBtn");
  if (themeToggleInlineBtn) {
    themeToggleInlineBtn.onclick = toggleTheme;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.onclick = logout;
  }

  const backToInboxBtn = document.getElementById("backToInboxBtn");
  if (backToInboxBtn) {
    backToInboxBtn.onclick = goInbox;
  }

  const chatForm = document.getElementById("chatForm");
  if (chatForm) {
    chatForm.onsubmit = e => {
      e.preventDefault();
      const textarea = document.getElementById("chatTextarea");
      if (!textarea) return;
      sendMessage(state.ui.activeConvoUserId, textarea.value);
      textarea.value = "";
    };
  }
}
