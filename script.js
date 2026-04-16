const STORAGE_KEY = "earnx_social_v1";

// ---------- STATE ----------
let state = {
  user: null,
  theme: "dark",
  view: "home",
  messages: [],
  creators: [
    { name: "NovaX", fans: 1200 },
    { name: "LunaFlow", fans: 980 },
    { name: "CryptoJay", fans: 1500 }
  ],
  stories: [
    { user: "NovaX", time: Date.now() },
    { user: "LunaFlow", time: Date.now() }
  ],
  posts: [
    { user: "NovaX", content: "New drop coming soon 🚀" },
    { user: "LunaFlow", content: "Fan love is real 💚" }
  ]
};

// ---------- INIT ----------
function init() {
  loadState();
  applyTheme();
  render();
}

// ---------- STORAGE ----------
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) state = { ...state, ...JSON.parse(saved) };
  } catch {}
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- AUTH ----------
function login(identifier, password) {
  if (!identifier || !password) {
    alert("Fill all fields");
    return;
  }

  state.user = { name: identifier };
  saveState();
  render();
}

function logout() {
  state.user = null;
  saveState();
  render();
}

// ---------- THEME ----------
function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  applyTheme();
}

function applyTheme() {
  document.body.className = state.theme;
}

// ---------- NAV ----------
function navigate(view) {
  state.view = view;
  render();
}

// ---------- RENDER ----------
function render() {
  const app = document.getElementById("app");

  if (!state.user) {
    app.innerHTML = `
      <div class="auth-wrap">
        <div class="auth-card">
          <h1>EarnX</h1>
          <input id="user" placeholder="Username or Email" />
          <input id="pass" type="password" placeholder="Password" />
          <button id="loginBtn">Login</button>
        </div>
      </div>
    `;

    document.getElementById("loginBtn").onclick = () => {
      login(
        document.getElementById("user").value,
        document.getElementById("pass").value
      );
    };

    return;
  }

  app.innerHTML = `
    <div class="app">
      <nav class="sidebar">
        <h2>EarnX</h2>
        <button onclick="navigate('home')">Home</button>
        <button onclick="navigate('discover')">Discover</button>
        <button onclick="navigate('messages')">Messages</button>
        <button onclick="navigate('profile')">Profile</button>
        <button onclick="toggleTheme()">Theme</button>
        <button onclick="logout()">Logout</button>
      </nav>

      <main class="content">
        ${renderView()}
      </main>
    </div>
  `;
}

function renderView() {
  switch (state.view) {
    case "home":
      return `
        <div class="stories">
          ${state.stories
            .map(s => `<div class="story">${s.user}</div>`)
            .join("")}
        </div>

        <div class="feed">
          ${state.posts
            .map(p => `<div class="post"><b>${p.user}</b><p>${p.content}</p></div>`)
            .join("")}
        </div>
      `;

    case "discover":
      return `
        <h2>Trending Creators</h2>
        ${state.creators
          .map(c => `<div class="card">${c.name} - ${c.fans} fans</div>`)
          .join("")}
      `;

    case "messages":
      return `
        <h2>Messages</h2>
        <p>Private chat UI coming</p>
      `;

    case "profile":
      return `
        <h2>${state.user.name}</h2>
        <p>Your profile</p>
      `;

    default:
      return `<p>Loading...</p>`;
  }
}

// ---------- START ----------
document.addEventListener("DOMContentLoaded", init);
