const STORAGE_KEY = "earnx_app_v1";

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
    searchQuery: ""
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
  }, 2500);
}

function currentUser() {
  return state.users.find(u => u.id === state.sessionUserId) || null;
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("") || "EX";
}

function userPosts(userId) {
  return state.posts.filter(p => p.userId === userId);
}

function followerCount(userId) {
  return state.follows.filter(f => f.followingId === userId).length;
}

function followingCount(userId) {
  return state.follows.filter(f => f.followerId === userId).length;
}

function isFollowing(followerId, followingId) {
  return state.follows.some(
    f => f.followerId === followerId && f.followingId === followingId
  );
}

function toggleFollow(targetUserId) {
  const me = currentUser();
  if (!me || me.id === targetUserId) return;

  const existing = state.follows.findIndex(
    f => f.followerId === me.id && f.followingId === targetUserId
  );

  if (existing > -1) {
    state.follows.splice(existing, 1);
    saveState();
    render();
    setNotice("success", "Unfollowed creator.");
  } else {
    state.follows.push({
      id: uid("follow"),
      followerId: me.id,
      followingId: targetUserId
    });
    saveState();
    render();
    setNotice("success", "Now following creator.");
  }
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
    users = users.filter(u => u.country === viewerCountry);
  }

  return users
    .map(u => ({ ...u, score: scoreUser(u) }))
    .sort((a, b) => b.score - a.score);
}

function getRankBadge(userId, scope = "global", viewerCountry = "Global") {
  const ranked = rankingUsers(scope, viewerCountry);
  const index = ranked.findIndex(u => u.id === userId);
  if (index === -1) return null;
  const pos = index + 1;

  if (pos === 1) return { label: "#1 Trending", className: "rank-1" };
  if (pos === 2) return { label: "#2 Trending", className: "rank-2" };
  if (pos === 3) return { label: "#3 Trending", className: "rank-3" };
  if (pos <= 10) return { label: `Top ${pos}`, className: "" };
  return null;
}

function isAmbassador(userId, viewerCountry = "Global") {
  const globalRank = rankingUsers("global");
  const localRank = rankingUsers("local", viewerCountry);

  const inGlobalTop3 = globalRank.slice(0, 3).some(u => u.id === userId);
  const inLocalTop3 = localRank.slice(0, 3).some(u => u.id === userId);

  return inGlobalTop3 || inLocalTop3;
}

function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function login(email, password) {
  const user = state.users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    setNotice("error", "Invalid email or password.");
    return;
  }

  state.sessionUserId = user.id;
  state.ui.appView = "home";
  saveState();
  render();
}

function signup(form) {
  const exists = state.users.some(
    u => u.email.toLowerCase() === form.email.toLowerCase()
      || u.username.toLowerCase() === form.username.toLowerCase()
  );

  if (exists) {
    setNotice("error", "Email or username already exists.");
    return;
  }

  const user = {
    id: uid("user"),
    email: form.email,
    password: form.password,
    username: form.username,
    displayName: form.displayName,
    country: form.country,
    bio: form.bio || "Creator on EarnX.",
    createdAt: Date.now()
  };

  state.users.push(user);
  state.sessionUserId = user.id;
  state.ui.appView = "home";
  saveState();
  render();
  setNotice("success", "Welcome to EarnX.");
}

function logout() {
  state.sessionUserId = null;
  state.ui.authView = "login";
  saveState();
  render();
}

function createPost(content, monetized) {
  const me = currentUser();
  if (!me) return;

  if (!content.trim()) {
    setNotice("error", "Write something before publishing.");
    return;
  }

  state.posts.unshift({
    id: uid("post"),
    userId: me.id,
    content: content.trim(),
    monetized: Boolean(monetized),
    createdAt: Date.now()
  });

  saveState();
  state.ui.appView = "profile";
  render();
  setNotice("success", "Post published.");
}

function ensureProfileTarget() {
  const me = currentUser();
  if (!me) return;
  if (!state.ui.profileUserId) {
    state.ui.profileUserId = me.id;
  }
}

function goToProfile(userId) {
  state.ui.profileUserId = userId;
  state.ui.appView = "profile";
  saveState();
  render();
}

function createMessage(toUserId, text) {
  const me = currentUser();
  if (!me) return;
  if (!text.trim()) {
    setNotice("error", "Message cannot be empty.");
    return;
  }
  state.messages.push({
    id: uid("msg"),
    fromUserId: me.id,
    toUserId,
    text: text.trim(),
    createdAt: Date.now()
  });
  saveState();
  render();
  setNotice("success", "Message sent.");
}

function renderNotice() {
  if (!state.ui.notice) return "";
  return `
    <div class="notice ${state.ui.notice.type}">
      ${escapeHtml(state.ui.notice.text)}
    </div>
  `;
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function authView() {
  const view = state.ui.authView;

  if (view === "signup") {
    return `
      <div class="auth-shell">
        <div class="brand">
          <div class="brand-badge">X</div>
          <div>
            <div class="brand-title">EarnX</div>
            <div class="small">Creator economy platform</div>
          </div>
        </div>
        <p class="brand-subtitle">
          Build your presence, compete in public rankings, and monetize directly from your audience.
        </p>
        ${renderNotice()}
        <div class="card auth-card">
          <h2 class="card-title">Create account</h2>
          <p class="card-subtitle">Start with a real profile and a clean identity.</p>

          <form id="signupForm">
            <div class="field">
              <label class="label">Display name</label>
              <input class="input" name="displayName" placeholder="Rafael Amaral" required />
            </div>

            <div class="field">
              <label class="label">Username</label>
              <input class="input" name="username" placeholder="rafaelx" required />
            </div>

            <div class="field">
              <label class="label">Email</label>
              <input class="input" name="email" type="email" placeholder="you@example.com" required />
            </div>

            <div class="field">
              <label class="label">Password</label>
              <input class="input" name="password" type="password" placeholder="••••••••" required />
            </div>

            <div class="field">
              <label class="label">Country</label>
              <select class="select" name="country" required>
                ${countries.map(c => `<option value="${c}">${c}</option>`).join("")}
              </select>
            </div>

            <div class="field">
              <label class="label">Bio</label>
              <textarea class="textarea" name="bio" placeholder="Tell your audience what you create."></textarea>
            </div>

            <button class="btn btn-primary" type="submit">Create account</button>
          </form>

          <div class="auth-links">
            <button class="btn btn-ghost" data-auth-view="login" type="button">Already have an account?</button>
          </div>
        </div>
      </div>
    `;
  }

  if (view === "forgot") {
    return `
      <div class="auth-shell">
        <div class="brand">
          <div class="brand-badge">X</div>
          <div>
            <div class="brand-title">EarnX</div>
            <div class="small">Recover access</div>
          </div>
        </div>
        ${renderNotice()}
        <div class="card auth-card">
          <h2 class="card-title">Forgot password</h2>
          <p class="card-subtitle">This static frontend does not send emails yet. Use your saved credentials.</p>

          <div class="field">
            <label class="label">Email</label>
            <input class="input" type="email" placeholder="you@example.com" />
          </div>

          <button class="btn btn-secondary" type="button" id="fakeRecoveryBtn">Continue</button>

          <div class="auth-links">
            <button class="btn btn-ghost" data-auth-view="login" type="button">Back to login</button>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="auth-shell">
      <div class="brand">
        <div class="brand-badge">X</div>
        <div>
          <div class="brand-title">EarnX</div>
          <div class="small">Where creators compete and monetize</div>
        </div>
      </div>
      <p class="brand-subtitle">
        A premium social platform for creators building status, audience, and direct fan support.
      </p>
      ${renderNotice()}
      <div class="card auth-card">
        <h2 class="card-title">Login</h2>
        <p class="card-subtitle">Access your creator account.</p>

        <form id="loginForm">
          <div class="field">
            <label class="label">Email</label>
            <input class="input" name="email" type="email" placeholder="you@example.com" required />
          </div>

          <div class="field">
            <label class="label">Password</label>
            <input class="input" name="password" type="password" placeholder="••••••••" required />
          </div>

          <button class="btn btn-primary" type="submit">Login</button>
        </form>

        <div class="auth-links">
          <button class="btn btn-ghost" data-auth-view="forgot" type="button">Forgot password</button>
          <button class="btn btn-ghost" data-auth-view="signup" type="button">Create account</button>
        </div>
      </div>
    </div>
  `;
}

function appView() {
  ensureProfileTarget();

  return `
    <div class="shell">
      <main class="screen">
        ${renderNotice()}
        ${renderCurrentAppScreen()}
      </main>
      ${bottomNav()}
    </div>
  `;
}

function renderCurrentAppScreen() {
  const view = state.ui.appView;
  if (view === "search") return renderSearchScreen();
  if (view === "create") return renderCreateScreen();
  if (view === "messages") return renderMessagesScreen();
  if (view === "profile") return renderProfileScreen();
  if (view === "settings") return renderSettingsScreen();
  if (view === "dashboard") return renderDashboardScreen();
  return renderHomeScreen();
}

function renderHomeScreen() {
  const me = currentUser();
  const followingIds = state.follows
    .filter(f => f.followerId === me.id)
    .map(f => f.followingId);

  const feedPosts = state.posts.filter(p => followingIds.includes(p.userId));

  return `
    <div class="topbar">
      <div>
        <div class="small">Home</div>
        <h1>EarnX</h1>
      </div>
      <button class="icon-btn" id="openSettingsBtn">⚙️</button>
    </div>

    <div class="card hero">
      <h2>Build status. Grow reach. Stay visible.</h2>
      <p>Your feed shows creators you actually follow. Rankings stay public. Earnings stay private.</p>
    </div>

    ${
      feedPosts.length === 0
        ? `
          <div class="card empty-state">
            <h3>Follow creators to start building your feed</h3>
            <p>Your home feed stays clean until you connect with real creators inside the platform.</p>
            <button class="btn btn-primary" id="goDiscoverBtn">Discover creators</button>
          </div>
        `
        : `
          <div class="feed-list">
            ${feedPosts.map(renderPostCard).join("")}
          </div>
        `
    }
  `;
}

function renderPostCard(post) {
  const user = state.users.find(u => u.id === post.userId);
  const me = currentUser();
  const globalBadge = getRankBadge(user.id, "global", me?.country || "Global");
  const ambassador = isAmbassador(user.id, me?.country || "Global");

  return `
    <div class="post-card card">
      <div class="post-head">
        <div class="avatar">${getInitials(user.displayName)}</div>
        <div class="name-block">
          <div class="name-line">
            <h4>${escapeHtml(user.displayName)}</h4>
            ${globalBadge ? `<span class="badge ${globalBadge.className}">${escapeHtml(globalBadge.label)}</span>` : ""}
            ${ambassador ? `<span class="badge ambassador">Ambassador</span>` : ""}
          </div>
          <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)} · ${formatTime(post.createdAt)}</div>
        </div>
      </div>

      <div class="post-content">${escapeHtml(post.content)}</div>

      <div class="post-actions">
        <span class="action-chip">♥ Support</span>
        <span class="action-chip">💬 Comment</span>
        <span class="action-chip">↗ Share</span>
        ${post.monetized ? `<span class="action-chip">💸 Monetized</span>` : ""}
      </div>
    </div>
  `;
}

function renderSearchScreen() {
  const me = currentUser();
  const query = (state.ui.searchQuery || "").toLowerCase().trim();
  const tab = state.ui.discoverTab;

  const localUsers = rankingUsers("local", me.country);
  const globalUsers = rankingUsers("global");

  let list = tab === "local" ? localUsers : globalUsers;

  if (tab === "ambassadors") {
    list = globalUsers.filter(u => isAmbassador(u.id, me.country));
  }

  if (tab === "trending") {
    list = globalUsers.slice(0, 10);
  }

  if (query) {
    list = list.filter(u =>
      u.displayName.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.country.toLowerCase().includes(query)
    );
  }

  return `
    <div class="topbar">
      <div>
        <div class="small">Discover</div>
        <h1>Search & Rankings</h1>
      </div>
      <button class="icon-btn" id="refreshSearchBtn">↻</button>
    </div>

    <div class="searchbar">
      <input class="input" id="searchInput" placeholder="Search creators, countries, usernames..." value="${escapeHtml(state.ui.searchQuery || "")}" />
    </div>

    <div class="app-tabs">
      <button class="app-tab ${tab === "global" ? "active" : ""}" data-discover-tab="global">Global</button>
      <button class="app-tab ${tab === "local" ? "active" : ""}" data-discover-tab="local">Local</button>
      <button class="app-tab ${tab === "trending" ? "active" : ""}" data-discover-tab="trending">Trending</button>
      <button class="app-tab ${tab === "ambassadors" ? "active" : ""}" data-discover-tab="ambassadors">Ambassadors</button>
    </div>

    <div class="section-title">
      <h3>Top positions</h3>
      <span>${tab === "local" ? me.country : "Global"} visibility</span>
    </div>

    <div class="grid-2">
      ${renderTopRankCards(tab === "local" ? localUsers : globalUsers, me.country)}
    </div>

    <div class="section-title">
      <h3>${tab === "ambassadors" ? "EarnX Ambassadors" : "Creators"}</h3>
      <span>${list.length} results</span>
    </div>

    ${
      list.length === 0
        ? `
          <div class="card empty-state">
            <h3>No creators found yet</h3>
            <p>As real accounts join EarnX, discovery becomes more powerful across countries and global rankings.</p>
          </div>
        `
        : `
          <div class="list">
            ${list.map(u => renderCreatorCard(u, me.country)).join("")}
          </div>
        `
    }
  `;
}

function renderTopRankCards(users, viewerCountry) {
  const top3 = users.slice(0, 3);

  if (top3.length === 0) {
    return `
      <div class="rank-card card">
        <div class="rank-number gold">#1</div>
        <div class="meta">No live ranking yet</div>
      </div>
      <div class="rank-card card">
        <div class="rank-number silver">#2</div>
        <div class="meta">Waiting for creator activity</div>
      </div>
    `;
  }

  return top3.map((u, idx) => {
    const tone = idx === 0 ? "gold" : idx === 1 ? "silver" : "bronze";
    const badgeText = idx === 0 ? "Crown position" : idx === 1 ? "Second position" : "Third position";

    return `
      <div class="rank-card card">
        <div class="rank-number ${tone}">#${idx + 1}</div>
        <div class="name-line">
          <h4>${escapeHtml(u.displayName)}</h4>
        </div>
        <div class="meta">@${escapeHtml(u.username)} · ${escapeHtml(u.country)}</div>
        <div class="hr"></div>
        <div class="small">${badgeText}</div>
        ${isAmbassador(u.id, viewerCountry) ? `<div style="margin-top:10px;"><span class="badge ambassador">Ambassador</span></div>` : ""}
      </div>
    `;
  }).join("");
}

function renderCreatorCard(user, viewerCountry) {
  const me = currentUser();
  const own = me.id === user.id;
  const followed = isFollowing(me.id, user.id);
  const badge = getRankBadge(user.id, "global", viewerCountry);
  const ambassador = isAmbassador(user.id, viewerCountry);

  return `
    <div class="creator-card card">
      <div class="creator-head">
        <div class="avatar">${getInitials(user.displayName)}</div>
        <div class="name-block" style="flex:1;">
          <div class="name-line">
            <h4>${escapeHtml(user.displayName)}</h4>
            ${badge ? `<span class="badge ${badge.className}">${escapeHtml(badge.label)}</span>` : ""}
            ${ambassador ? `<span class="badge ambassador">${user.country === viewerCountry ? "Country Ambassador" : "Global Ambassador"}</span>` : ""}
          </div>
          <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)}</div>
        </div>
      </div>

      <div class="profile-bio">${escapeHtml(user.bio || "Creator on EarnX.")}</div>

      <div class="profile-meta" style="margin-top:14px;">
        <div class="profile-stat">
          <strong>${followerCount(user.id)}</strong>
          <span>Followers</span>
        </div>
        <div class="profile-stat">
          <strong>${userPosts(user.id).length}</strong>
          <span>Posts</span>
        </div>
        <div class="profile-stat">
          <strong>${scoreUser(user)}</strong>
          <span>Trend Score</span>
        </div>
      </div>

      <div class="row" style="margin-top:14px;">
        <button class="btn btn-secondary" data-open-profile="${user.id}">
          View profile
        </button>
        ${
          own
            ? `<button class="btn btn-primary" data-go-dashboard="1">Dashboard</button>`
            : `<button class="btn btn-primary" data-follow="${user.id}">${followed ? "Following" : "Follow"}</button>`
        }
      </div>
    </div>
  `;
}

function renderCreateScreen() {
  return `
    <div class="topbar">
      <div>
        <div class="small">Create</div>
        <h1>Publish content</h1>
      </div>
      <div></div>
    </div>

    <div class="card auth-card">
      <h2 class="card-title">New post</h2>
      <p class="card-subtitle">Speak to your audience clearly. Status grows from consistency.</p>

      <form id="createPostForm">
        <div class="field">
          <label class="label">Caption</label>
          <textarea class="textarea" name="content" placeholder="Share an update, drop a thought, or publish something your audience can support."></textarea>
        </div>

        <div class="field">
          <label class="label">Visibility</label>
          <select class="select" name="visibility">
            <option value="public">Public</option>
          </select>
        </div>

        <div class="field">
          <label class="label">Monetization</label>
          <div class="row">
            <label class="action-chip" style="justify-content:center; padding:14px;">
              <input type="checkbox" name="monetized" style="margin-right:8px;"> Enable support
            </label>
          </div>
        </div>

        <button class="btn btn-primary" type="submit">Publish</button>
      </form>
    </div>
  `;
}

function renderMessagesScreen() {
  const me = currentUser();
  const inboxUsers = state.users.filter(u => u.id !== me.id);
  const recent = state.messages
    .filter(m => m.fromUserId === me.id || m.toUserId === me.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  return `
    <div class="topbar">
      <div>
        <div class="small">Messages</div>
        <h1>Inbox</h1>
      </div>
      <div></div>
    </div>

    ${
      inboxUsers.length === 0
        ? `
          <div class="card empty-state">
            <h3>No messages yet</h3>
            <p>As more creators join EarnX, direct communication starts here.</p>
          </div>
        `
        : `
          <div class="section-title">
            <h3>Quick message</h3>
            <span>Direct creator contact</span>
          </div>
          <div class="card auth-card">
            <form id="messageForm">
              <div class="field">
                <label class="label">Send to</label>
                <select class="select" name="toUserId">
                  ${inboxUsers.map(u => `<option value="${u.id}">${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</option>`).join("")}
                </select>
              </div>
              <div class="field">
                <label class="label">Message</label>
                <textarea class="textarea" name="text" placeholder="Write a direct message."></textarea>
              </div>
              <button class="btn btn-primary" type="submit">Send message</button>
            </form>
          </div>
        `
    }

    <div class="section-title">
      <h3>Recent activity</h3>
      <span>${recent.length} messages</span>
    </div>

    ${
      recent.length === 0
        ? `
          <div class="card empty-state">
            <h3>Your inbox is quiet</h3>
            <p>When creator conversations begin, they will appear here in a clean and private thread experience.</p>
          </div>
        `
        : `
          <div class="list">
            ${recent.map(msg => {
              const from = state.users.find(u => u.id === msg.fromUserId);
              const to = state.users.find(u => u.id === msg.toUserId);
              const other = msg.fromUserId === me.id ? to : from;
              return `
                <div class="message-card card">
                  <div class="message-head">
                    <div class="avatar">${getInitials(other.displayName)}</div>
                    <div class="name-block">
                      <div class="name-line">
                        <h4>${escapeHtml(other.displayName)}</h4>
                      </div>
                      <div class="handle">${msg.fromUserId === me.id ? "To" : "From"} @${escapeHtml(other.username)} · ${formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                  <div class="post-content">${escapeHtml(msg.text)}</div>
                </div>
              `;
            }).join("")}
          </div>
        `
    }
  `;
}

function renderProfileScreen() {
  const me = currentUser();
  const user = state.users.find(u => u.id === state.ui.profileUserId) || me;
  const own = user.id === me.id;
  const posts = userPosts(user.id);
  const badge = getRankBadge(user.id, "global", me.country);
  const localBadge = getRankBadge(user.id, "local", me.country);
  const ambassador = isAmbassador(user.id, me.country);

  return `
    <div class="topbar">
      <div>
        <div class="small">Profile</div>
        <h1>${own ? "Your profile" : "Creator profile"}</h1>
      </div>
      <button class="icon-btn" id="profileSettingsBtn">⚙️</button>
    </div>

    <div class="card profile-card">
      <div class="profile-head">
        <div class="avatar large">${getInitials(user.displayName)}</div>
        <div class="name-block">
          <div class="name-line">
            <h3>${escapeHtml(user.displayName)}</h3>
          </div>
          <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)}</div>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            ${badge ? `<span class="badge ${badge.className}">${escapeHtml(badge.label)}</span>` : ""}
            ${localBadge ? `<span class="badge">${escapeHtml(localBadge.label)} Local</span>` : ""}
            ${ambassador ? `<span class="badge ambassador">${user.country === me.country ? "Country Ambassador" : "Global Ambassador"}</span>` : ""}
          </div>
        </div>
      </div>

      <div class="profile-bio">${escapeHtml(user.bio || "Creator on EarnX.")}</div>

      <div class="profile-meta">
        <div class="profile-stat">
          <strong>${followerCount(user.id)}</strong>
          <span>Followers</span>
        </div>
        <div class="profile-stat">
          <strong>${followingCount(user.id)}</strong>
          <span>Following</span>
        </div>
        <div class="profile-stat">
          <strong>${posts.length}</strong>
          <span>Posts</span>
        </div>
      </div>

      <div class="row" style="margin-top:14px;">
        ${
          own
            ? `
              <button class="btn btn-primary" data-go-dashboard="1">Private dashboard</button>
              <button class="btn btn-secondary" data-go-settings="1">Settings</button>
            `
            : `
              <button class="btn btn-primary" data-follow="${user.id}">
                ${isFollowing(me.id, user.id) ? "Following" : "Follow"}
              </button>
              <button class="btn btn-secondary" data-message-user="${user.id}">Message</button>
            `
        }
      </div>
    </div>

    <div class="section-title">
      <h3>${own ? "Your posts" : "Creator posts"}</h3>
      <span>${posts.length} total</span>
    </div>

    ${
      posts.length === 0
        ? `
          <div class="card empty-state">
            <h3>No posts yet</h3>
            <p>${own ? "Your published content will appear here." : "This creator has not published anything yet."}</p>
          </div>
        `
        : `
          <div class="feed-list">
            ${posts.map(renderPostCard).join("")}
          </div>
        `
    }
  `;
}

function renderSettingsScreen() {
  const me = currentUser();

  return `
    <div class="topbar">
      <div>
        <div class="small">Settings</div>
        <h1>Account & privacy</h1>
      </div>
      <div></div>
    </div>

    <div class="list">
      <div class="setting-card card">
        <div class="card-title">Profile access</div>
        <p class="card-subtitle">Edit profile, public identity, and creator presentation.</p>
        <button class="btn btn-secondary" data-open-profile="${me.id}">Open profile</button>
      </div>

      <div class="setting-card card">
        <div class="card-title">Private dashboard</div>
        <p class="card-subtitle">Your earnings, analytics, ranking movement, and monetization stay visible only to you.</p>
        <button class="btn btn-primary" data-go-dashboard="1">Open dashboard</button>
      </div>

      <div class="setting-card card">
        <div class="card-title">Notifications</div>
        <p class="card-subtitle">Ranking changes, new followers, support events, and private messages.</p>
        <div class="small">Frontend UI only for now.</div>
      </div>

      <div class="setting-card card">
        <div class="card-title">Payout methods</div>
        <p class="card-subtitle">Reserved for backend integration.</p>
        <div class="small">Private creator-only financial data will plug in here.</div>
      </div>

      <div class="setting-card card">
        <div class="card-title">Logout</div>
        <p class="card-subtitle">Securely exit your EarnX session.</p>
        <button class="btn btn-secondary" id="logoutBtn">Logout</button>
      </div>
    </div>
  `;
}

function renderDashboardScreen() {
  const me = currentUser();
  const posts = userPosts(me.id);
  const rankGlobal = rankingUsers("global").findIndex(u => u.id === me.id) + 1;
  const rankLocal = rankingUsers("local", me.country).findIndex(u => u.id === me.id) + 1;

  return `
    <div class="topbar">
      <div>
        <div class="small">Private dashboard</div>
        <h1>Creator analytics</h1>
      </div>
      <div></div>
    </div>

    <div class="kpi-grid">
      <div class="stat-card card">
        <strong>$0.00</strong>
        <span>Earnings summary</span>
      </div>
      <div class="stat-card card">
        <strong>${followerCount(me.id)}</strong>
        <span>Audience size</span>
      </div>
      <div class="stat-card card">
        <strong>${posts.length}</strong>
        <span>Published posts</span>
      </div>
      <div class="stat-card card">
        <strong>${scoreUser(me)}</strong>
        <span>Trend score</span>
      </div>
      <div class="stat-card card">
        <strong>${rankGlobal || "—"}</strong>
        <span>Global rank</span>
      </div>
      <div class="stat-card card">
        <strong>${rankLocal || "—"}</strong>
        <span>${escapeHtml(me.country)} rank</span>
      </div>
    </div>

    <div class="section-title">
      <h3>Private metrics</h3>
      <span>Visible only to creator</span>
    </div>

    <div class="list">
      <div class="setting-card card">
        <div class="card-title">Monetization performance</div>
        <p class="card-subtitle">This area is reserved for real fan support, payouts, and subscription data once backend is connected.</p>
      </div>

      <div class="setting-card card">
        <div class="card-title">Audience analytics</div>
        <p class="card-subtitle">Reach, retention, support activity, and conversion metrics will appear here privately.</p>
      </div>

      <div class="setting-card card">
        <div class="card-title">Ranking movement</div>
        <p class="card-subtitle">EarnX will track how close you are to #1, #2, #3 and the Top 10 in your country and globally.</p>
      </div>
    </div>
  `;
}

function bottomNav() {
  const items = [
    ["home", "🏠", "Home"],
    ["search", "🔍", "Search"],
    ["create", "➕", "Create"],
    ["messages", "💬", "Messages"],
    ["profile", "👤", "Profile"]
  ];

  return `
    <nav class="bottom-nav">
      ${items.map(([id, emoji, label]) => `
        <button class="nav-btn ${state.ui.appView === id ? "active" : ""}" data-nav="${id}">
          <span class="nav-emoji">${emoji}</span>
          <span>${label}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function render() {
  const app = document.getElementById("app");
  app.innerHTML = currentUser() ? appView() : authView();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll("[data-auth-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.authView = btn.dataset.authView;
      saveState();
      render();
    });
  });

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(loginForm);
      login(fd.get("email"), fd.get("password"));
    });
  }

  const signupForm = document.getElementById("signupForm");
  if (signupForm) {
    signupForm.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(signupForm);
      signup({
        displayName: String(fd.get("displayName")).trim(),
        username: String(fd.get("username")).trim(),
        email: String(fd.get("email")).trim(),
        password: String(fd.get("password")),
        country: String(fd.get("country")),
        bio: String(fd.get("bio")).trim()
      });
    });
  }

  const fakeRecoveryBtn = document.getElementById("fakeRecoveryBtn");
  if (fakeRecoveryBtn) {
    fakeRecoveryBtn.addEventListener("click", () => {
      setNotice("success", "Recovery flow reserved for backend integration.");
    });
  }

  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.appView = btn.dataset.nav;
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-discover-tab]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.discoverTab = btn.dataset.discoverTab;
      saveState();
      render();
    });
  });

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", e => {
      state.ui.searchQuery = e.target.value;
      saveState();
      render();
    });
  }

  document.querySelectorAll("[data-follow]").forEach(btn => {
    btn.addEventListener("click", () => {
      toggleFollow(btn.dataset.follow);
    });
  });

  document.querySelectorAll("[data-open-profile]").forEach(btn => {
    btn.addEventListener("click", () => {
      goToProfile(btn.dataset.openProfile);
    });
  });

  document.querySelectorAll("[data-go-dashboard]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.appView = "dashboard";
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-go-settings]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.appView = "settings";
      saveState();
      render();
    });
  });

  const openSettingsBtn = document.getElementById("openSettingsBtn");
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener("click", () => {
      state.ui.appView = "settings";
      saveState();
      render();
    });
  }

  const profileSettingsBtn = document.getElementById("profileSettingsBtn");
  if (profileSettingsBtn) {
    profileSettingsBtn.addEventListener("click", () => {
      state.ui.appView = "settings";
      saveState();
      render();
    });
  }

  const goDiscoverBtn = document.getElementById("goDiscoverBtn");
  if (goDiscoverBtn) {
    goDiscoverBtn.addEventListener("click", () => {
      state.ui.appView = "search";
      saveState();
      render();
    });
  }

  const createPostForm = document.getElementById("createPostForm");
  if (createPostForm) {
    createPostForm.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(createPostForm);
      createPost(fd.get("content"), fd.get("monetized"));
    });
  }

  const messageForm = document.getElementById("messageForm");
  if (messageForm) {
    messageForm.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(messageForm);
      createMessage(String(fd.get("toUserId")), String(fd.get("text")));
    });
  }

  document.querySelectorAll("[data-message-user]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.ui.appView = "messages";
      saveState();
      render();
    });
  });

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  const refreshSearchBtn = document.getElementById("refreshSearchBtn");
  if (refreshSearchBtn) {
    refreshSearchBtn.addEventListener("click", () => render());
  }
}

render();
