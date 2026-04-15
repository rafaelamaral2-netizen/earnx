// Try all known keys so existing accounts are never lost
const STORAGE_KEY = “earnx_app_stable_v1”;
const LEGACY_KEYS = [“earnx_app_final”, “earnx_app_stable_v2”];

const countries = [
“Puerto Rico”,
“United States”,
“Mexico”,
“Colombia”,
“Argentina”,
“Spain”,
“Dominican Republic”,
“Chile”,
“Brazil”,
“Global”
];

const initialState = {
sessionUserId: null,
ui: {
authView: “login”,
appView: “home”,
discoverTab: “global”,
profileUserId: null,
notice: null,
searchQuery: “”,
theme: “dark”
},
users: [],
posts: [],
follows: [],
messages: []
};

let state = loadState();

function loadState() {
try {
// Try primary key first, then legacy keys
const keysToTry = [STORAGE_KEY, …LEGACY_KEYS];
let raw = null;
let foundKey = null;

```
for (const key of keysToTry) {
  const val = localStorage.getItem(key);
  if (val) {
    raw = val;
    foundKey = key;
    break;
  }
}

if (!raw) return structuredClone(initialState);

const parsed = JSON.parse(raw);
const loaded = {
  ...structuredClone(initialState),
  ...parsed,
  ui: {
    ...structuredClone(initialState).ui,
    ...(parsed.ui || {}),
    notice: null
  }
};

// Migrate to primary key if found in a legacy key
if (foundKey !== STORAGE_KEY) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loaded));
  localStorage.removeItem(foundKey);
}

return loaded;
```

} catch {
return structuredClone(initialState);
}
}

function saveState() {
try {
localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
} catch {
// storage full or blocked – fail silently
}
}

function uid(prefix = “id”) {
return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEmail(email) {
return String(email || “”).trim().toLowerCase();
}

function escapeHtml(str = “”) {
return String(str)
.replaceAll(”&”, “&”)
.replaceAll(”<”, “<”)
.replaceAll(”>”, “>”)
.replaceAll(’”’, “"”);
}

// ─── Notice ───────────────────────────────────────────────────────────────────
let noticeTimer = null;

function setNotice(type, text) {
if (noticeTimer) clearTimeout(noticeTimer);
state.ui.notice = { type, text };
render();
noticeTimer = setTimeout(() => {
state.ui.notice = null;
saveState();
render();
noticeTimer = null;
}, 2600);
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function applyTheme() {
const theme = state.ui.theme || “dark”;
document.body.classList.toggle(“light-theme”, theme === “light”);
}

function setTheme(theme) {
state.ui.theme = theme;
saveState();
applyTheme();
render();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function currentUser() {
if (!state.sessionUserId) return null;
return state.users.find((u) => u.id === state.sessionUserId) || null;
}

function getInitials(name = “”) {
const parts = String(name).trim().split(/\s+/).filter(Boolean);
if (!parts.length) return “EX”;
return parts.slice(0, 2).map((w) => w[0].toUpperCase()).join(””);
}

function formatDate(ts) {
return new Date(ts).toLocaleDateString([], { month: “short”, day: “numeric” });
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

function rankingUsers(scope = “global”, viewerCountry = “Global”) {
let users = […state.users];
if (scope === “local”) {
users = users.filter((u) => u.country === viewerCountry);
}
return users
.map((u) => ({ …u, score: scoreUser(u) }))
.sort((a, b) => b.score - a.score);
}

function getRankPosition(userId, scope = “global”, viewerCountry = “Global”) {
const ranked = rankingUsers(scope, viewerCountry);
const index = ranked.findIndex((u) => u.id === userId);
return index === -1 ? null : index + 1;
}

function getRankBadge(userId, scope = “global”, viewerCountry = “Global”) {
const pos = getRankPosition(userId, scope, viewerCountry);
if (!pos) return null;
if (pos === 1) return { label: “#1 Trending”, className: “rank-1” };
if (pos === 2) return { label: “#2 Trending”, className: “rank-2” };
if (pos === 3) return { label: “#3 Trending”, className: “rank-3” };
if (pos <= 10) return { label: `Top ${pos}`, className: “” };
return null;
}

function isAmbassador(userId, viewerCountry = “Global”) {
const globalTop3 = rankingUsers(“global”).slice(0, 3).map((u) => u.id);
const localTop3 = rankingUsers(“local”, viewerCountry).slice(0, 3).map((u) => u.id);
return globalTop3.includes(userId) || localTop3.includes(userId);
}

// ─── Actions ──────────────────────────────────────────────────────────────────
function toggleFollow(targetUserId) {
const me = currentUser();
if (!me || me.id === targetUserId) return;

const index = state.follows.findIndex(
(f) => f.followerId === me.id && f.followingId === targetUserId
);

if (index >= 0) {
state.follows.splice(index, 1);
saveState();
render();
setNotice(“success”, “Unfollowed creator.”);
return;
}

state.follows.push({
id: uid(“follow”),
followerId: me.id,
followingId: targetUserId
});

saveState();
render();
setNotice(“success”, “Now following creator.”);
}

// FIX: login now trims and normalizes inputs before comparing
function login(email, password) {
const cleanEmail = normalizeEmail(email);
const cleanPassword = String(password || “”).trim();

if (!cleanEmail || !cleanPassword) {
setNotice(“error”, “Please enter your email and password.”);
return;
}

const user = state.users.find(
(u) =>
normalizeEmail(u.email) === cleanEmail &&
String(u.password).trim() === cleanPassword
);

if (!user) {
setNotice(“error”, “Incorrect email or password. Please try again.”);
return;
}

state.sessionUserId = user.id;
state.ui.appView = “home”;
state.ui.profileUserId = user.id;
state.ui.authView = “login”;
saveState();
render();
setNotice(“success”, `Welcome back, ${user.displayName}!`);
}

// FIX: signup validates all required fields before attempting
function signup(form) {
const cleanEmail = normalizeEmail(form.email);
const cleanUsername = String(form.username || “”).trim().toLowerCase();
const cleanDisplayName = String(form.displayName || “”).trim();
const cleanPassword = String(form.password || “”).trim();
const cleanCountry = String(form.country || “”).trim();

if (!cleanDisplayName) { setNotice(“error”, “Display name is required.”); return; }
if (!cleanUsername) { setNotice(“error”, “Username is required.”); return; }
if (!cleanEmail) { setNotice(“error”, “Email is required.”); return; }
if (!cleanPassword || cleanPassword.length < 4) {
setNotice(“error”, “Password must be at least 4 characters.”);
return;
}
if (!cleanCountry) { setNotice(“error”, “Please select a country.”); return; }

const exists = state.users.some(
(u) =>
normalizeEmail(u.email) === cleanEmail ||
String(u.username).trim().toLowerCase() === cleanUsername
);

if (exists) {
setNotice(“error”, “That email or username is already in use.”);
return;
}

const newUser = {
id: uid(“user”),
displayName: cleanDisplayName,
username: cleanUsername,
email: cleanEmail,
password: cleanPassword,
country: cleanCountry,
bio: String(form.bio || “”).trim() || “Creator on EarnX.”,
createdAt: Date.now()
};

state.users.push(newUser);
state.sessionUserId = newUser.id;
state.ui.appView = “home”;
state.ui.profileUserId = newUser.id;
saveState();
render();
setNotice(“success”, `Welcome to EarnX, ${newUser.displayName}!`);
}

function logout() {
state.sessionUserId = null;
state.ui.authView = “login”;
state.ui.notice = null;
saveState();
render();
}

function createPost(content, monetized) {
const me = currentUser();
if (!me) return;

if (!String(content || “”).trim()) {
setNotice(“error”, “Write something before publishing.”);
return;
}

state.posts.unshift({
id: uid(“post”),
userId: me.id,
content: String(content).trim(),
monetized: Boolean(monetized),
createdAt: Date.now()
});

saveState();
state.ui.appView = “profile”;
state.ui.profileUserId = me.id;
render();
setNotice(“success”, “Post published.”);
}

function createMessage(toUserId, text) {
const me = currentUser();
if (!me) return;

if (!String(text || “”).trim()) {
setNotice(“error”, “Message cannot be empty.”);
return;
}

state.messages.push({
id: uid(“msg”),
fromUserId: me.id,
toUserId,
text: String(text).trim(),
createdAt: Date.now()
});

saveState();
render();
setNotice(“success”, “Message sent.”);
}

function goToProfile(userId) {
state.ui.profileUserId = userId;
state.ui.appView = “profile”;
saveState();
render();
}

// ─── Render helpers ───────────────────────────────────────────────────────────
function renderNotice() {
if (!state.ui.notice) return “”;
return `<div class="notice ${state.ui.notice.type}">${escapeHtml(state.ui.notice.text)}</div>`;
}

function iconSvg(name) {
const icons = {
home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>`,
search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16 21 21"/></svg>`,
create: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
messages: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16v10H8l-4 3v-13z"/></svg>`,
profile: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 20c1.8-3 4.2-4.5 7-4.5S17.2 17 19 20"/></svg>`,
settings: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 0 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 0 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 0 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 0 1 0 4h-.2a1 1 0 0 0-.9.6z"/></svg>`,
refresh: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 2 5.3"/><path d="M20 4v6h-6"/></svg>`
};
return icons[name] || “”;
}

// ─── Auth views ───────────────────────────────────────────────────────────────
function authView() {
const view = state.ui.authView;

const brandHtml = `<div class="brand"> <div class="brand-badge">X</div> <div> <div class="brand-title">EarnX</div> <div class="small">Creator economy platform</div> </div> </div>`;

if (view === “signup”) {
return `<div class="auth-shell"> ${brandHtml} <p class="brand-subtitle">Build audience, compete for visibility, and turn attention into creator momentum.</p> ${renderNotice()} <div class="card auth-card"> <h2 class="card-title">Create account</h2> <p class="card-subtitle">Start as a real creator with a clear identity.</p> <form id="signupForm" novalidate> <div class="field"> <label class="label">Display name</label> <input class="input" name="displayName" placeholder="Rafael Amaral" autocomplete="name" /> </div> <div class="field"> <label class="label">Username</label> <input class="input" name="username" placeholder="rafaelx" autocomplete="username" /> </div> <div class="field"> <label class="label">Email</label> <input class="input" type="email" name="email" placeholder="you@example.com" autocomplete="email" /> </div> <div class="field"> <label class="label">Password</label> <input class="input" type="password" name="password" placeholder="••••••••" autocomplete="new-password" /> </div> <div class="field"> <label class="label">Country</label> <select class="select" name="country"> <option value="">Select country…</option> ${countries.map((c) =>`<option value="${c}">${c}</option>`).join("")} </select> </div> <div class="field"> <label class="label">Bio <span class="muted">(optional)</span></label> <textarea class="textarea" name="bio" placeholder="Tell your audience what you create."></textarea> </div> <button class="btn btn-primary" type="submit">Create account</button> </form> <div class="auth-links"> <button class="btn btn-ghost" type="button" data-auth-view="login">Already have an account?</button> </div> </div> </div> `;
}

if (view === “forgot”) {
return `<div class="auth-shell"> ${brandHtml} ${renderNotice()} <div class="card auth-card"> <h2 class="card-title">Forgot password</h2> <p class="card-subtitle">Password recovery will be available once backend integration is live.</p> <div class="field"> <label class="label">Email</label> <input class="input" type="email" placeholder="you@example.com" /> </div> <button class="btn btn-secondary" type="button" id="fakeRecoveryBtn">Continue</button> <div class="auth-links"> <button class="btn btn-ghost" type="button" data-auth-view="login">← Back to login</button> </div> </div> </div>`;
}

// Default: login
return `<div class="auth-shell"> ${brandHtml} <p class="brand-subtitle">A premium social platform built around creator ambition, audience reach, and public ranking momentum.</p> ${renderNotice()} <div class="card auth-card"> <h2 class="card-title">Login</h2> <p class="card-subtitle">Enter your creator account.</p> <form id="loginForm" novalidate> <div class="field"> <label class="label">Email or username</label> <input class="input" name="email" placeholder="Email or username" autocomplete="username" /> </div> <div class="field"> <label class="label">Password</label> <input class="input" type="password" name="password" placeholder="••••••••" autocomplete="current-password" /> </div> <button class="btn btn-primary" type="submit">Login</button> </form> <div class="auth-links"> <button class="btn btn-ghost" type="button" data-auth-view="forgot">Forgot password</button> <button class="btn btn-ghost" type="button" data-auth-view="signup">Create account</button> </div> </div> </div>`;
}

// ─── App shell ────────────────────────────────────────────────────────────────
function appView() {
return `<div class="shell"> ${renderNotice()} ${renderCurrentScreen()} ${bottomNav()} </div>`;
}

function renderCurrentScreen() {
switch (state.ui.appView) {
case “search”:    return renderSearchScreen();
case “create”:    return renderCreateScreen();
case “messages”:  return renderMessagesScreen();
case “profile”:   return renderProfileScreen();
case “settings”:  return renderSettingsScreen();
case “dashboard”: return renderDashboardScreen();
default:          return renderHomeScreen();
}
}

// ─── Home ─────────────────────────────────────────────────────────────────────
function renderHomeScreen() {
const me = currentUser();
const followingIds = state.follows
.filter((f) => f.followerId === me.id)
.map((f) => f.followingId);

const feed = state.posts.filter((p) => followingIds.includes(p.userId));
const rising = rankingUsers(“global”).filter((u) => u.id !== me.id).slice(0, 3);

return `
<div class="topbar">
<div>
<span class="eyebrow">Home</span>
<h1>Following & momentum</h1>
</div>
<button class="icon-btn" id="openSettingsBtn" aria-label="Settings">
<span class="nav-icon">${iconSvg(“settings”)}</span>
</button>
</div>

```
<div class="card hero">
  <h2>Follow creators. Watch movement. Build presence.</h2>
  <p>Your feed stays real. Rankings stay public. Private earnings stay protected.</p>
</div>

<section class="section">
  <div class="section-head">
    <h3>Momentum</h3>
    <span class="section-meta">Global creators gaining status</span>
  </div>
  <div class="stack">
    ${rising.length
      ? rising.map(renderMomentumCard).join("")
      : `<div class="panel empty-state">
           <h3>No creator momentum yet</h3>
           <p>As real creators publish and gain attention, rising movement will appear here.</p>
         </div>`
    }
  </div>
</section>

<section class="section">
  <div class="section-head">
    <h3>Following feed</h3>
    <span class="section-meta">${feed.length} post${feed.length !== 1 ? "s" : ""}</span>
  </div>
  ${feed.length
    ? `<div class="feed-list">${feed.map(renderPostCard).join("")}</div>`
    : `<div class="panel empty-state">
         <h3>Follow creators to start building your feed</h3>
         <p>Your home stays clean until you choose who deserves your attention.</p>
         <button class="btn btn-primary" id="goDiscoverBtn">Go to discover</button>
       </div>`
  }
</section>
```

`;
}

function renderMomentumCard(user) {
const me = currentUser();
const globalPos = getRankPosition(user.id, “global”, me.country);
const ambassador = isAmbassador(user.id, me.country);
const followed = isFollowing(me.id, user.id);

return `<div class="momentum-card"> <div class="momentum-head"> <div class="avatar">${getInitials(user.displayName)}</div> <div class="name-block"> <div class="name-line"> <h4>${escapeHtml(user.displayName)}</h4> ${globalPos && globalPos <= 3 ?`<span class="badge rank-${globalPos}">#${globalPos}</span>`: ""} ${ambassador ?`<span class="badge ambassador">Ambassador</span>`: ""} </div> <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)}</div> </div> </div> <div class="post-actions"> <span class="chip">Score ${scoreUser(user)}</span> <span class="chip">${followerCount(user.id)} followers</span> </div> <div class="row" style="margin-top:12px;"> <button class="btn btn-secondary" data-open-profile="${user.id}">View profile</button> <button class="btn btn-primary" data-follow="${user.id}">${followed ? "Following" : "Follow"}</button> </div> </div>`;
}

function renderPostCard(post) {
const me = currentUser();
const user = state.users.find((u) => u.id === post.userId);
if (!user) return “”;
const badge = getRankBadge(user.id, “global”, me.country);
const ambassador = isAmbassador(user.id, me.country);

return `<div class="post-card"> <div class="post-head"> <div class="avatar">${getInitials(user.displayName)}</div> <div class="name-block"> <div class="name-line"> <h4>${escapeHtml(user.displayName)}</h4> ${badge ?`<span class="badge ${badge.className}">${escapeHtml(badge.label)}</span>`: ""} ${ambassador ?`<span class="badge ambassador">Ambassador</span>`: ""} </div> <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)} · ${formatDate(post.createdAt)}</div> </div> </div> <div class="post-content">${escapeHtml(post.content)}</div> <div class="post-actions"> <span class="chip">Support</span> <span class="chip">Comment</span> <span class="chip">Share</span> ${post.monetized ?`<span class="chip">Support enabled</span>`: ""} </div> </div>`;
}

// ─── Search / Discover ────────────────────────────────────────────────────────
function renderSearchScreen() {
const me = currentUser();
const tab = state.ui.discoverTab;
const query = state.ui.searchQuery.trim().toLowerCase();

const global = rankingUsers(“global”);
const local = rankingUsers(“local”, me.country);
const ambassadors = global.filter((u) => isAmbassador(u.id, me.country));
const rising = global.slice(0, 10);

let list = global;
if (tab === “local”) list = local;
else if (tab === “trending”) list = rising;
else if (tab === “ambassadors”) list = ambassadors;

if (query) {
list = list.filter(
(u) =>
u.displayName.toLowerCase().includes(query) ||
u.username.toLowerCase().includes(query) ||
u.country.toLowerCase().includes(query)
);
}

return `
<div class="topbar">
<div>
<span class="eyebrow">Discover</span>
<h1>Global, local, ambassadors</h1>
</div>
<button class="icon-btn" id="refreshSearchBtn" aria-label="Refresh">
<span class="nav-icon">${iconSvg(“refresh”)}</span>
</button>
</div>

```
<div class="searchbar">
  <input class="input" id="searchInput" placeholder="Search creators, usernames, countries…" value="${escapeHtml(state.ui.searchQuery)}" />
</div>

<div class="tabs">
  <button class="tab ${tab === "global" ? "active" : ""}" data-discover-tab="global">Global</button>
  <button class="tab ${tab === "local" ? "active" : ""}" data-discover-tab="local">Local</button>
  <button class="tab ${tab === "trending" ? "active" : ""}" data-discover-tab="trending">Trending</button>
  <button class="tab ${tab === "ambassadors" ? "active" : ""}" data-discover-tab="ambassadors">Ambassadors</button>
</div>

<section class="section">
  <div class="section-head">
    <h3>Top 3 global</h3>
    <span class="section-meta">Public status</span>
  </div>
  <div class="rank-grid">${renderTopCards(global, me.country)}</div>
</section>

<section class="section">
  <div class="section-head">
    <h3>Top 3 in ${escapeHtml(me.country)}</h3>
    <span class="section-meta">Local visibility</span>
  </div>
  <div class="rank-grid">${renderTopCards(local, me.country)}</div>
</section>

<section class="section">
  <div class="section-head">
    <h3>${tabLabel(tab)}</h3>
    <span class="section-meta">${list.length} creator${list.length !== 1 ? "s" : ""}</span>
  </div>
  ${list.length
    ? `<div class="list">${list.map(renderCreatorCard).join("")}</div>`
    : `<div class="panel empty-state">
         <h3>No creators found yet</h3>
         <p>Discovery becomes more powerful as real creator activity grows across countries and global rankings.</p>
       </div>`
  }
</section>
```

`;
}

function tabLabel(tab) {
if (tab === “local”) return “Local creators”;
if (tab === “trending”) return “Trending now”;
if (tab === “ambassadors”) return “EarnX ambassadors”;
return “Global creators”;
}

function renderTopCards(users, viewerCountry) {
const top = users.slice(0, 3);
if (!top.length) {
return `<div class="rank-card"> <div class="rank-number gold">#1</div> <div class="muted">Waiting for creator movement</div> </div> <div class="rank-card"> <div class="rank-number silver">#2</div> <div class="muted">No public ranking yet</div> </div>`;
}

return top.map((u, i) => {
const tone = i === 0 ? “gold” : i === 1 ? “silver” : “bronze”;
return `<div class="rank-card"> <div class="rank-number ${tone}">#${i + 1}</div> <div class="name-line"><h4>${escapeHtml(u.displayName)}</h4></div> <div class="handle">@${escapeHtml(u.username)} · ${escapeHtml(u.country)}</div> <div class="mini-line"></div> <div class="post-actions"> <span class="chip">Score ${scoreUser(u)}</span> ${isAmbassador(u.id, viewerCountry) ?`<span class="badge ambassador">Ambassador</span>`: ""} </div> </div>`;
}).join(””);
}

function renderCreatorCard(user) {
const me = currentUser();
const own = user.id === me.id;
const followed = isFollowing(me.id, user.id);
const globalBadge = getRankBadge(user.id, “global”, me.country);
const localBadge = getRankBadge(user.id, “local”, me.country);
const ambassador = isAmbassador(user.id, me.country);

return `<div class="creator-card"> <div class="creator-head"> <div class="avatar">${getInitials(user.displayName)}</div> <div class="name-block"> <div class="name-line"> <h4>${escapeHtml(user.displayName)}</h4> ${globalBadge ?`<span class="badge ${globalBadge.className}">${escapeHtml(globalBadge.label)}</span>`: ""} ${ambassador ?`<span class="badge ambassador">${user.country === me.country ? “Country Ambassador” : “Global Ambassador”}</span>`: ""} </div> <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)}</div> </div> </div> <div class="profile-bio">${escapeHtml(user.bio || "Creator on EarnX.")}</div> <div class="post-actions"> <span class="chip">${followerCount(user.id)} followers</span> <span class="chip">${userPosts(user.id).length} posts</span> <span class="chip">Score ${scoreUser(user)}</span> ${localBadge ?`<span class="chip">${escapeHtml(localBadge.label)} local</span>`: ""} </div> <div class="row" style="margin-top:12px;"> <button class="btn btn-secondary" data-open-profile="${user.id}">View profile</button> ${own ?`<button class="btn btn-primary" data-go-dashboard="1">Dashboard</button>`:`<button class="btn btn-primary" data-follow="${user.id}">${followed ? “Following” : “Follow”}</button>`} </div> </div>`;
}

// ─── Create ───────────────────────────────────────────────────────────────────
function renderCreateScreen() {
return `<div class="topbar"> <div> <span class="eyebrow">Create</span> <h1>Publish with intention</h1> </div> <div></div> </div> <div class="card content-card"> <h2 class="card-title">New post</h2> <p class="card-subtitle">Build consistency, visibility, and support momentum.</p> <form id="createPostForm" novalidate> <div class="field"> <label class="label">Caption</label> <textarea class="textarea" name="content" placeholder="Publish a thought, an update, or a message to your audience."></textarea> </div> <div class="field"> <label class="label">Monetization</label> <label class="chip" style="padding:14px; justify-content:center; cursor:pointer; width:100%;"> <input type="checkbox" name="monetized" style="margin-right:8px;"> Enable support button </label> </div> <button class="btn btn-primary" type="submit">Publish</button> </form> </div>`;
}

// ─── Messages ─────────────────────────────────────────────────────────────────
function renderMessagesScreen() {
const me = currentUser();
const users = state.users.filter((u) => u.id !== me.id);
const recent = state.messages
.filter((m) => m.fromUserId === me.id || m.toUserId === me.id)
.sort((a, b) => b.createdAt - a.createdAt);

return `<div class="topbar"> <div> <span class="eyebrow">Messages</span> <h1>Private creator communication</h1> </div> <div></div> </div> ${users.length ?`<div class="card content-card">
<h2 class="card-title">Quick message</h2>
<p class="card-subtitle">Direct contact between creators and supporters starts here.</p>
<form id="messageForm" novalidate>
<div class="field">
<label class="label">Send to</label>
<select class="select" name="toUserId">
${users.map((u) => `<option value="${u.id}">${escapeHtml(u.displayName)} (@${escapeHtml(u.username)})</option>`).join(””)}
</select>
</div>
<div class="field">
<label class="label">Message</label>
<textarea class="textarea" name="text" placeholder="Write a direct message."></textarea>
</div>
<button class="btn btn-primary" type="submit">Send message</button>
</form>
</div>`: "" } <section class="section"> <div class="section-head"> <h3>Recent inbox activity</h3> <span class="section-meta">${recent.length} message${recent.length !== 1 ? "s" : ""}</span> </div> ${recent.length ?`<div class="list">${recent.map(renderMessageCard).join(””)}</div>`:`<div class="panel empty-state">
<h3>Your inbox is quiet</h3>
<p>As creator communication begins, private interactions will appear here.</p>
</div>`} </section>`;
}

function renderMessageCard(msg) {
const me = currentUser();
const from = state.users.find((u) => u.id === msg.fromUserId);
const to = state.users.find((u) => u.id === msg.toUserId);
if (!from || !to) return “”;
const other = msg.fromUserId === me.id ? to : from;

return `<div class="message-card"> <div class="message-head"> <div class="avatar">${getInitials(other.displayName)}</div> <div class="name-block"> <div class="name-line"><h4>${escapeHtml(other.displayName)}</h4></div> <div class="handle">${msg.fromUserId === me.id ? "To" : "From"} @${escapeHtml(other.username)} · ${formatDate(msg.createdAt)}</div> </div> </div> <div class="post-content">${escapeHtml(msg.text)}</div> </div>`;
}

// ─── Profile ──────────────────────────────────────────────────────────────────
function renderProfileScreen() {
const me = currentUser();
const user = state.users.find((u) => u.id === state.ui.profileUserId) || me;

const own = user.id === me.id;
const posts = userPosts(user.id);
const globalPos = getRankPosition(user.id, “global”, me.country);
const localPos = getRankPosition(user.id, “local”, me.country);
const ambassador = isAmbassador(user.id, me.country);
const followed = isFollowing(me.id, user.id);

return `
<div class="topbar">
<div>
<span class="eyebrow">Profile</span>
<h1>${own ? “Identity & business” : “Creator identity”}</h1>
</div>
<button class="icon-btn" id="profileSettingsBtn" aria-label="Settings">
<span class="nav-icon">${iconSvg(“settings”)}</span>
</button>
</div>

```
<div class="card profile-card">
  <div class="profile-head">
    <div class="avatar large">${getInitials(user.displayName)}</div>
    <div class="name-block">
      <div class="name-line"><h3>${escapeHtml(user.displayName)}</h3></div>
      <div class="handle">@${escapeHtml(user.username)} · ${escapeHtml(user.country)}</div>
      <div class="post-actions" style="margin-top:10px;">
        ${globalPos ? `<span class="badge ${globalPos <= 3 ? `rank-${globalPos}` : ""}">Global #${globalPos}</span>` : ""}
        ${localPos ? `<span class="chip">${escapeHtml(user.country)} #${localPos}</span>` : ""}
        ${ambassador ? `<span class="badge ambassador">${user.country === me.country ? "Country Ambassador" : "Global Ambassador"}</span>` : ""}
      </div>
    </div>
  </div>

  <div class="profile-bio">${escapeHtml(user.bio || "Creator on EarnX.")}</div>

  <div class="profile-stats">
    <div class="profile-stat">
      <strong>${followerCount(user.id)}</strong>
      <span class="small">Followers</span>
    </div>
    <div class="profile-stat">
      <strong>${followingCount(user.id)}</strong>
      <span class="small">Following</span>
    </div>
    <div class="profile-stat">
      <strong>${posts.length}</strong>
      <span class="small">Posts</span>
    </div>
  </div>

  <div class="profile-actions row">
    ${own
      ? `<button class="btn btn-primary" data-go-dashboard="1">Creator Studio</button>
         <button class="btn btn-secondary" data-go-settings="1">Settings</button>`
      : `<button class="btn btn-primary" data-follow="${user.id}">${followed ? "Following" : "Follow"}</button>
         <button class="btn btn-secondary" data-message-user="${user.id}">Message</button>`
    }
  </div>
</div>

<section class="section">
  <div class="section-head">
    <h3>Status highlights</h3>
    <span class="section-meta">Public perception</span>
  </div>
  <div class="highlight-strip">
    <div class="highlight-card">
      <strong>${globalPos ? `#${globalPos}` : "—"}</strong>
      <span class="small">Global rank</span>
    </div>
    <div class="highlight-card">
      <strong>${scoreUser(user)}</strong>
      <span class="small">Trend score</span>
    </div>
    <div class="highlight-card">
      <strong>${ambassador ? "Yes" : "No"}</strong>
      <span class="small">Ambassador</span>
    </div>
  </div>
</section>

<section class="section">
  <div class="section-head">
    <h3>${own ? "Published content" : "Creator content"}</h3>
    <span class="section-meta">${posts.length} post${posts.length !== 1 ? "s" : ""}</span>
  </div>
  ${posts.length
    ? `<div class="feed-list">${posts.map(renderPostCard).join("")}</div>`
    : `<div class="panel empty-state">
         <h3>No posts yet</h3>
         <p>${own ? "Your content will appear here as you publish." : "This creator has not published anything yet."}</p>
       </div>`
  }
</section>
```

`;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboardScreen() {
const me = currentUser();
const posts = userPosts(me.id);
const globalPos = getRankPosition(me.id, “global”, me.country);
const localPos = getRankPosition(me.id, “local”, me.country);

return `<div class="topbar"> <div> <span class="eyebrow">Creator Studio</span> <h1>Private growth &amp; monetization</h1> </div> <div></div> </div> <div class="kpi-grid"> <div class="kpi-card"><strong>$0.00</strong><span>Earnings summary</span></div> <div class="kpi-card"><strong>${followerCount(me.id)}</strong><span>Audience size</span></div> <div class="kpi-card"><strong>${posts.length}</strong><span>Published posts</span></div> <div class="kpi-card"><strong>${scoreUser(me)}</strong><span>Trend score</span></div> <div class="kpi-card"><strong>${globalPos || "—"}</strong><span>Global rank</span></div> <div class="kpi-card"><strong>${localPos || "—"}</strong><span>${escapeHtml(me.country)} rank</span></div> </div> <section class="section"> <div class="section-head"> <h3>Private business blocks</h3> <span class="section-meta">Only visible to creator</span> </div> <div class="list"> <div class="setting-card"> <div class="card-title">Monetization performance</div> <p class="card-subtitle">Future area for fan support, subscriptions, conversion, and payout metrics.</p> </div> <div class="setting-card"> <div class="card-title">Audience analytics</div> <p class="card-subtitle">Track reach, retention, and support behavior without exposing private numbers publicly.</p> </div> <div class="setting-card"> <div class="card-title">Ranking movement</div> <p class="card-subtitle">See how close you are to the Top 10, Top 3, and ambassador status.</p> </div> </div> </section>`;
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function renderSettingsScreen() {
const me = currentUser();
const isDark = state.ui.theme !== “light”;

return `
<div class="topbar">
<div>
<span class="eyebrow">Settings</span>
<h1>Account & privacy</h1>
</div>
<div></div>
</div>
<div class="list">
<div class="setting-card">
<div class="card-title">Profile access</div>
<p class="card-subtitle">Manage public identity, creator positioning, and audience-facing presentation.</p>
<button class="btn btn-secondary" data-open-profile="${me.id}">Open profile</button>
</div>

```
  <div class="setting-card">
    <div class="card-title">Creator Studio</div>
    <p class="card-subtitle">Access your private growth, monetization, and ranking movement.</p>
    <button class="btn btn-primary" data-go-dashboard="1">Open Creator Studio</button>
  </div>

  <div class="setting-card">
    <div class="card-title">Appearance</div>
    <p class="card-subtitle">Choose how EarnX looks on your device.</p>
    <div class="theme-toggle-row">
      <button class="btn ${isDark ? "btn-primary" : "btn-secondary"}" id="themeDarkBtn">🌙 Dark</button>
      <button class="btn ${!isDark ? "btn-primary" : "btn-secondary"}" id="themeLightBtn">☀️ Light</button>
    </div>
  </div>

  <div class="setting-card">
    <div class="card-title">Notifications</div>
    <p class="card-subtitle">Reserved for follower changes, ranking alerts, and private message activity.</p>
  </div>

  <div class="setting-card">
    <div class="card-title">Payout methods</div>
    <p class="card-subtitle">Private creator financial configuration will connect here later.</p>
  </div>

  <div class="setting-card">
    <div class="card-title">Logout</div>
    <p class="card-subtitle">Exit your EarnX session securely.</p>
    <button class="btn btn-secondary" id="logoutBtn">Logout</button>
  </div>
</div>
```

`;
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────
function bottomNav() {
const items = [
[“home”, “Home”, “home”],
[“search”, “Search”, “search”],
[“create”, “Create”, “create”],
[“messages”, “Messages”, “messages”],
[“profile”, “Profile”, “profile”]
];

return `<nav class="bottom-nav"> ${items.map(([key, label, icon]) =>`
<button class=“nav-btn ${state.ui.appView === key ? “active” : “”}” data-nav=”${key}” aria-label=”${label}”>
<span class="nav-icon">${iconSvg(icon)}</span>
<span class="nav-label">${label}</span>
</button>
`).join("")} </nav> `;
}

// ─── Render + bind ────────────────────────────────────────────────────────────
function render() {
applyTheme();
const app = document.getElementById(“app”);
app.innerHTML = currentUser() ? appView() : authView();
bindEvents();
}

function bindEvents() {
// Auth view switches
document.querySelectorAll(”[data-auth-view]”).forEach((btn) => {
btn.addEventListener(“click”, () => {
state.ui.authView = btn.dataset.authView;
state.ui.notice = null;
saveState();
render();
});
});

// Login form — FIX: use trimmed values
const loginForm = document.getElementById(“loginForm”);
if (loginForm) {
loginForm.addEventListener(“submit”, (e) => {
e.preventDefault();
const fd = new FormData(loginForm);
login(fd.get(“email”), fd.get(“password”));
});
}

// Signup form — FIX: validate before calling signup
const signupForm = document.getElementById(“signupForm”);
if (signupForm) {
signupForm.addEventListener(“submit”, (e) => {
e.preventDefault();
const fd = new FormData(signupForm);
signup({
displayName: fd.get(“displayName”),
username: fd.get(“username”),
email: fd.get(“email”),
password: fd.get(“password”),
country: fd.get(“country”),
bio: fd.get(“bio”)
});
});
}

const fakeRecoveryBtn = document.getElementById(“fakeRecoveryBtn”);
if (fakeRecoveryBtn) {
fakeRecoveryBtn.addEventListener(“click”, () => {
setNotice(“success”, “Recovery flow reserved for backend integration.”);
});
}

// Nav
document.querySelectorAll(”[data-nav]”).forEach((btn) => {
btn.addEventListener(“click”, () => {
state.ui.appView = btn.dataset.nav;
if (btn.dataset.nav === “profile”) {
state.ui.profileUserId = state.sessionUserId;
}
saveState();
render();
});
});

document.querySelectorAll(”[data-discover-tab]”).forEach((btn) => {
btn.addEventListener(“click”, () => {
state.ui.discoverTab = btn.dataset.discoverTab;
saveState();
render();
});
});

const searchInput = document.getElementById(“searchInput”);
if (searchInput) {
searchInput.addEventListener(“input”, (e) => {
state.ui.searchQuery = e.target.value;
saveState();
render();
});
}

document.querySelectorAll(”[data-follow]”).forEach((btn) => {
btn.addEventListener(“click”, () => toggleFollow(btn.dataset.follow));
});

document.querySelectorAll(”[data-open-profile]”).forEach((btn) => {
btn.addEventListener(“click”, () => goToProfile(btn.dataset.openProfile));
});

document.querySelectorAll(”[data-go-dashboard]”).forEach((btn) => {
btn.addEventListener(“click”, () => {
state.ui.appView = “dashboard”;
saveState();
render();
});
});

document.querySelectorAll(”[data-go-settings]”).forEach((btn) => {
btn.addEventListener(“click”, () => {
state.ui.appView = “settings”;
saveState();
render();
});
});

document.querySelectorAll(”[data-message-user]”).forEach((btn) => {
btn.addEventListener(“click”, () => {
state.ui.appView = “messages”;
saveState();
render();
});
});

const createPostForm = document.getElementById(“createPostForm”);
if (createPostForm) {
createPostForm.addEventListener(“submit”, (e) => {
e.preventDefault();
const fd = new FormData(createPostForm);
createPost(fd.get(“content”), fd.get(“monetized”));
});
}

const messageForm = document.getElementById(“messageForm”);
if (messageForm) {
messageForm.addEventListener(“submit”, (e) => {
e.preventDefault();
const fd = new FormData(messageForm);
createMessage(String(fd.get(“toUserId”)), String(fd.get(“text”)));
});
}

const goDiscoverBtn = document.getElementById(“goDiscoverBtn”);
if (goDiscoverBtn) {
goDiscoverBtn.addEventListener(“click”, () => {
state.ui.appView = “search”;
saveState();
render();
});
}

const openSettingsBtn = document.getElementById(“openSettingsBtn”);
if (openSettingsBtn) {
openSettingsBtn.addEventListener(“click”, () => {
state.ui.appView = “settings”;
saveState();
render();
});
}

const profileSettingsBtn = document.getElementById(“profileSettingsBtn”);
if (profileSettingsBtn) {
profileSettingsBtn.addEventListener(“click”, () => {
state.ui.appView = “settings”;
saveState();
render();
});
}

const refreshSearchBtn = document.getElementById(“refreshSearchBtn”);
if (refreshSearchBtn) {
refreshSearchBtn.addEventListener(“click”, () => render());
}

const logoutBtn = document.getElementById(“logoutBtn”);
if (logoutBtn) {
logoutBtn.addEventListener(“click”, logout);
}

const themeDarkBtn = document.getElementById(“themeDarkBtn”);
if (themeDarkBtn) {
themeDarkBtn.addEventListener(“click”, () => setTheme(“dark”));
}

const themeLightBtn = document.getElementById(“themeLightBtn”);
if (themeLightBtn) {
themeLightBtn.addEventListener(“click”, () => setTheme(“light”));
}
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
render();
