const STORAGE_KEY = "earnx_pro_v1";

// ---------- STATE ----------
let state = {
  theme: "dark",
  view: "home",
  user: null,
  users: [],
  posts: [],
  creators: [],
  stories: [],
  messages: [],
  activeChat: null
};

// ---------- INIT ----------
function init() {
  loadState();
  seedData();
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

// ---------- SEED ----------
function seedData() {
  if (state.creators.length) return;

  state.creators = [
    { id: 1, name: "NovaX", fans: 1200 },
    { id: 2, name: "LunaFlow", fans: 900 },
    { id: 3, name: "CryptoJay", fans: 1500 }
  ];

  state.posts = [
    { id: 1, user: "NovaX", content: "Big drop coming 🚀" },
    { id: 2, user: "LunaFlow", content: "Fans control the future 💚" }
  ];

  state.stories = [
    { id: 1, user: "NovaX", time: Date.now() },
    { id: 2, user: "LunaFlow", time: Date.now() }
  ];

  state.messages = [
    {
      id: 1,
      user: "NovaX",
      chat: [
        { from: "them", text: "Thanks for supporting" },
        { from: "me", text: "Always 🔥" }
      ]
    }
  ];
}

// ---------- AUTH ----------
function login(id, pass) {
  if (!id || !pass) return alert("Fill all fields");

  state.user = { name: id };
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
  applyTheme();
  saveState();
}

function applyTheme() {
  document.body.className = state.theme;
}

// ---------- NAV ----------
function navigate(v) {
  state.view = v;
  render();
}

// ---------- STORIES ----------
function cleanStories() {
  const now = Date.now();
  state.stories = state.stories.filter(s => now - s.time < 86400000);
}

// ---------- RENDER ----------
function render() {
  cleanStories();

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

    document.getElementById("loginBtn").onclick = () =>
      login(
        document.getElementById("user").value,
        document.getElementById("pass").value
      );

    return;
  }

  app.innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <h2>EarnX</h2>
        <button onclick="navigate('home')">Home</button>
        <button onclick="navigate('discover')">Discover</button>
        <button onclick="navigate('messages')">Messages</button>
        <button onclick="navigate('profile')">Profile</button>
        <button onclick="toggleTheme()">Theme</button>
        <button onclick="logout()">Logout</button>
      </aside>

      <main class="main">
        ${renderView()}
      </main>
    </div>
  `;
}

// ---------- VIEWS ----------
function renderView() {
  if (state.view === "home") {
    return `
      <div class="stories">
        ${state.stories.map(s => `<div class="story">${s.user}</div>`).join("")}
      </div>

      <div class="feed">
        ${state.posts
          .map(p => `<div class="post"><b>${p.user}</b><p>${p.content}</p></div>`)
          .join("")}
      </div>
    `;
  }

  if (state.view === "discover") {
    return `
      <h2>Trending</h2>
      ${state.creators
        .sort((a, b) => b.fans - a.fans)
        .map(c => `<div class="card">${c.name} - ${c.fans}</div>`)
        .join("")}
    `;
  }

  if (state.view === "messages") {
    return `
      <div class="chat">
        <div class="chat-list">
          ${state.messages
            .map(
              m => `<div onclick="openChat(${m.id})">${m.user}</div>`
            )
            .join("")}
        </div>

        <div class="chat-box">
          ${renderChat()}
        </div>
      </div>
    `;
  }

  if (state.view === "profile") {
    return `
      <h2>${state.user.name}</h2>
      <p>Profile view</p>
    `;
  }
}

// ---------- CHAT ----------
function openChat(id) {
  state.activeChat = id;
  render();
}

function renderChat() {
  const chat = state.messages.find(m => m.id === state.activeChat);
  if (!chat) return "<p>Select a chat</p>";

  return `
    ${chat.chat
      .map(c => `<div class="${c.from}">${c.text}</div>`)
      .join("")}
    <input id="msg" placeholder="Type..." />
    <button onclick="sendMsg()">Send</button>
  `;
}

function sendMsg() {
  const input = document.getElementById("msg");
  const chat = state.messages.find(m => m.id === state.activeChat);

  if (!input.value) return;

  chat.chat.push({ from: "me", text: input.value });
  input.value = "";

  saveState();
  render();
}

// ---------- START ----------
document.addEventListener("DOMContentLoaded", init);
