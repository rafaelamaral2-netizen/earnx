/* =========================================================
   EARNX — SCRIPT.JS — PHASE 1 + 2 + 3 + 4
   State + Feed + Discover + Profile
   ========================================================= */

/* -------------------------
   STATE
------------------------- */
const initialUI = {
  appView: "home",
  discoverTab: "global",
  discoverCategory: "all",
  profileUserId: null,
  searchQuery: "",
  theme: "dark",
  messagesView: "inbox",
  activeConvoUserId: null,
  feedFilter: "following"
};

let state = {
  sessionUserId: "u1",
  ui: loadUIState(),
  users: getMockUsers(),
  posts: getMockPosts(),
  follows: getMockFollows(),
  messages: [],
  localLikes: {}
};

/* -------------------------
   BOOT
------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  applyTheme();
  render();
});

/* -------------------------
   MOCK DATA
------------------------- */
function getMockUsers() {
  return [
    {
      id: "u1",
      displayName: "Rafael Amaral",
      username: "rafael",
      country: "PR",
      verified: true,
      category: "tech",
      bio: "Building EARNX into a premium creator platform.",
      avatarUrl: "",
      coverUrl: ""
    },
    {
      id: "u2",
      displayName: "Sofia Vega",
      username: "sofia",
      country: "MX",
      verified: true,
      category: "lifestyle",
      bio: "Exclusive drops, premium content, and audience energy.",
      avatarUrl: "",
      coverUrl: ""
    },
    {
      id: "u3",
      displayName: "Alex Rivera",
      username: "alex",
      country: "PR",
      verified: false,
      category: "gaming",
      bio: "Streaming, clips, and high-engagement moments.",
      avatarUrl: "",
      coverUrl: ""
    },
    {
      id: "u4",
      displayName: "Luna Cruz",
      username: "luna",
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

/* -------------------------
   STORAGE
------------------------- */
function loadUIState() {
  try {
    return { ...initialUI, ...JSON.parse(localStorage.getItem("ui")) };
  } catch {
    return { ...initialUI };
  }
}

function saveUIState() {
  localStorage.setItem("ui", JSON.stringify(state.ui));
}

/* -------------------------
   HELPERS
------------------------- */
function currentUser() {
  return state.users.find(u => u.id === state.sessionUserId);
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

/* -------------------------
   THEME
------------------------- */
function applyTheme() {
  document.body.classList.toggle("dark-theme", state.ui.theme === "dark");
}

function toggleTheme() {
  state.ui.theme = state.ui.theme === "dark" ? "light" : "dark";
  saveUIState();
  applyTheme();
  render();
}

/* -------------------------
   NAVIGATION
------------------------- */
function setAppView(view) {
  state.ui.appView = view;
  if (view === "profile" && !state.ui.profileUserId) {
    state.ui.profileUserId = state.sessionUserId;
  }
  saveUIState();
  render();
}

function setProfile(id) {
  state.ui.profileUserId = id;
  state.ui.appView = "profile";
  saveUIState();
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
   RENDER
------------------------- */
function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    ${renderNav()}
    <main class="page-content">
      ${renderPage()}
    </main>
  `;

  bindEvents();
}

/* -------------------------
   NAV UI
------------------------- */
function renderNav() {
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
        <button class="nav-btn ${state.ui.appView === "messages" ? "active" : ""}" data-nav="messages">Messages</button>
        <button class="nav-btn ${state.ui.appView === "profile" ? "active" : ""}" data-nav="profile">Profile</button>
        <button class="nav-btn ${state.ui.appView === "wallet" ? "active" : ""}" data-nav="wallet">Wallet</button>
        <button class="nav-btn ${state.ui.appView === "settings" ? "active" : ""}" data-nav="settings">Settings</button>
      </div>

      <div style="margin-top:20px;">
        <button class="btn btn-primary" id="themeToggleBtn">
          ${state.ui.theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
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
  if (state.ui.appView === "messages") return renderMessagesPlaceholder();
  if (state.ui.appView === "wallet") return renderWalletPlaceholder();
  if (state.ui.appView === "settings") return renderSettingsPlaceholder();
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
      ${["all", "tech", "lifestyle", "gaming", "art"].map(cat => `
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
                <button class="btn btn-secondary" data-nav="messages">Message</button>
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
   PLACEHOLDERS
------------------------- */
function renderMessagesPlaceholder() {
  return `
    <section class="panel" style="padding:20px;">
      <h2 class="section-title">Messages</h2>
      <p class="text-muted">Messages will be activated in Phase 5.</p>
    </section>
  `;
}

function renderWalletPlaceholder() {
  return `
    <section class="panel" style="padding:20px;">
      <h2 class="section-title">Wallet</h2>
      <p class="text-muted">Wallet logic will be activated in Phase 6.</p>
    </section>
  `;
}

function renderSettingsPlaceholder() {
  return `
    <section class="panel" style="padding:20px;">
      <h2 class="section-title">Settings</h2>
      <p class="text-muted">Settings logic will be activated in Phase 6.</p>
    </section>
  `;
}

/* -------------------------
   EVENTS
------------------------- */
function bindEvents() {
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.onclick = () => setAppView(btn.dataset.nav);
  });

  document.querySelectorAll("[data-feed-filter]").forEach(btn => {
    btn.onclick = () => {
      state.ui.feedFilter = btn.dataset.feedFilter;
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
      render();
    };
  });

  document.querySelectorAll("[data-follow]").forEach(btn => {
    btn.onclick = () => toggleFollow(btn.dataset.follow);
  });

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.oninput = e => {
      state.ui.searchQuery = e.target.value;
      render();
    };
  }

  const themeToggleBtn = document.getElementById("themeToggleBtn");
  if (themeToggleBtn) {
    themeToggleBtn.onclick = toggleTheme;
  }
}
